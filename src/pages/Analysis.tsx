import { Bot, Clipboard, TriangleAlert, Swords, Zap, Flame, Timer as TimerIcon, CalendarDays, Download, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, FlipHorizontal2, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
interface Arrow { from: string; to: string; color: string; type?: 'best' | 'played' }
interface ParsedMove {
  san: string; from: string; to: string; fen: string;
  moveNumber: number; color: 'w' | 'b';
}
interface ChessComGame {
  url: string; pgn: string;
  white: { username: string; rating: number };
  black: { username: string; rating: number };
  end_time: number; time_class: string;
}
interface EngineState {
  score: number | null; isMate: boolean; mateIn: number | null;
  pv: string; depth: number;
  bestMove: { from: string; to: string } | null;
  isAnalyzing: boolean; ready: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const PIECE_SYMS: Record<string, string> = {
  K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟',
  k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟',
};
const LIGHT_SQ    = '#f0d9b5';
const DARK_SQ     = '#b58863';
const SEL_SQ      = '#f6f669';
const LEGAL_LIGHT = '#cdd16e';
const LEGAL_DARK  = '#aaa23a';
const LAST_LIGHT  = '#cdd26e';
const LAST_DARK   = '#aaa23a';
const ERR_SQ      = '#e84040';
const BEST_ARROW   = 'rgba(74,222,128,0.95)';
const PLAYED_ARROW = 'rgba(251,191,36,0.9)';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function parseFenToBoard(fen: string): (string | null)[][] {
  return fen.split(' ')[0].split('/').map(row => {
    const cells: (string | null)[] = [];
    for (const c of row) {
      if (isNaN(Number(c))) cells.push(c);
      else for (let i = 0; i < parseInt(c); i++) cells.push(null);
    }
    return cells;
  });
}
const sqToGrid = (sq: string) => ({ row: 8 - parseInt(sq[1]), col: sq.charCodeAt(0) - 97 });
const gridToSq = (row: number, col: number) => String.fromCharCode(97 + col) + (8 - row);

function convertPvToSan(fen: string, uciMoves: string[]): string {
  try {
    const temp = new Chess(fen);
    const sans: string[] = [];
    for (const uci of uciMoves.slice(0, 8)) {
      const from = uci.substring(0, 2); const to = uci.substring(2, 4);
      const promo = uci.length > 4 ? uci[4] : undefined;
      const r = temp.move({ from, to, promotion: promo });
      if (!r) break;
      sans.push(r.san);
    }
    return sans.join(' ');
  } catch { return uciMoves.slice(0, 6).join(' '); }
}
function formatScore(score: number | null, isMate: boolean, mateIn: number | null): string {
  if (isMate && mateIn != null) return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
  if (score == null) return '0.0';
  const s = score / 100;
  return s >= 0 ? `+${s.toFixed(1)}` : s.toFixed(1);
}
function parseChessComPgn(pgn: string): ParsedMove[] | null {
  try {
    const chess = new Chess(); chess.loadPgn(pgn);
    const history = chess.history({ verbose: true }) as Array<{ san: string; from: string; to: string; color: 'w' | 'b' }>;
    const temp = new Chess();
    return history.map((m, i) => { temp.move(m.san); return { san: m.san, from: m.from, to: m.to, fen: temp.fen(), moveNumber: Math.floor(i / 2) + 1, color: m.color }; });
  } catch { return null; }
}
function buildPositions(moves: ParsedMove[]): string[] {
  return [INITIAL_FEN, ...moves.map(m => m.fen)];
}

// ─────────────────────────────────────────────────────────────────
// ArrowOverlay
// ─────────────────────────────────────────────────────────────────
function ArrowOverlay({ arrows, flipped }: { arrows: Arrow[]; flipped: boolean }) {
  if (!arrows.length) return null;
  const pct = 100 / 8;

  const center = (sq: string) => {
    const { row, col } = sqToGrid(sq);
    const dr = flipped ? 7 - row : row;
    const dc = flipped ? 7 - col : col;
    return { x: (dc + 0.5) * pct, y: (dr + 0.5) * pct };
  };

  return (
    <svg viewBox="0 0 100 100" style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 20, overflow: 'visible',
    }}>
      <defs>
        <linearGradient id="gradBest" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#00ffaa" stopOpacity="0.55" />
          <stop offset="45%"  stopColor="#22ff88" stopOpacity="1"    />
          <stop offset="100%" stopColor="#00dd66" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="gradPlayed" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ffaa00" stopOpacity="0.5"  />
          <stop offset="45%"  stopColor="#ffdd00" stopOpacity="1"    />
          <stop offset="100%" stopColor="#ff8800" stopOpacity="0.8"  />
        </linearGradient>
        <filter id="glowBig" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="b2"/>
          <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/></feMerge>
        </filter>
        <filter id="glowTight" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.25" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="headBest" markerWidth="4" markerHeight="3.2" refX="3.6" refY="1.6" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0.5 L3.6,1.6 L0,2.7 L0.8,1.6 Z" fill="#22ff88" />
        </marker>
        <marker id="headPlayed" markerWidth="4" markerHeight="3.2" refX="3.6" refY="1.6" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0.5 L3.6,1.6 L0,2.7 L0.8,1.6 Z" fill="#ffdd00" />
        </marker>
        <marker id="dotBest" markerWidth="2.5" markerHeight="2.5" refX="1.25" refY="1.25" orient="auto" markerUnits="strokeWidth">
          <circle cx="1.25" cy="1.25" r="1.1" fill="#22ff88" opacity="0.9"/>
        </marker>
        <marker id="dotPlayed" markerWidth="2.5" markerHeight="2.5" refX="1.25" refY="1.25" orient="auto" markerUnits="strokeWidth">
          <circle cx="1.25" cy="1.25" r="1.1" fill="#ffdd00" opacity="0.9"/>
        </marker>
      </defs>

      {arrows.map((a, i) => {
        const f = center(a.from);
        const t = center(a.to);
        const dx = t.x - f.x; const dy = t.y - f.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.1) return null;

        const isBest  = a.color === BEST_ARROW || a.type === 'best';
        const neonCol  = isBest ? '#22ff88' : '#ffdd00';
        const gradId   = isBest ? 'gradBest' : 'gradPlayed';
        const headId   = isBest ? 'headBest' : 'headPlayed';
        const dotId    = isBest ? 'dotBest'  : 'dotPlayed';

        const sh = 0.9; const sc = (len - sh) / len;
        const ex = f.x + dx * sc; const ey = f.y + dy * sc;

        const mx = (f.x + ex) / 2; const my = (f.y + ey) / 2;
        const perp = isBest ? 1.4 : 1.0;
        const nx = (-dy / len) * perp; const ny = (dx / len) * perp;
        const pathD = `M ${f.x} ${f.y} Q ${mx + nx} ${my + ny} ${ex} ${ey}`;

        return (
          <g key={i}>
            <path d={pathD} fill="none"
              stroke={neonCol} strokeWidth="3.8" strokeOpacity="0.12"
              strokeLinecap="round" filter="url(#glowBig)" />
            <path d={pathD} fill="none"
              stroke={neonCol} strokeWidth="1.8" strokeOpacity="0.28"
              strokeLinecap="round" />
            <path d={pathD} fill="none"
              stroke={`url(#${gradId})`} strokeWidth="0.85" strokeOpacity="1"
              strokeLinecap="round"
              markerEnd={`url(#${headId})`}
              markerStart={`url(#${dotId})`}
              filter="url(#glowTight)" />
            {isBest && (
              <>
                <circle cx={t.x} cy={t.y} r="1.5" fill="none"
                  stroke="#22ff88" strokeWidth="0.35" strokeOpacity="0">
                  <animate attributeName="r"              values="1.2;4.0;1.2" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.8;0;0.8"   dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={t.x} cy={t.y} r="0.9" fill="none"
                  stroke="#22ff88" strokeWidth="0.25" strokeOpacity="0">
                  <animate attributeName="r"              values="0.9;2.8;0.9" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.6;0;0.6"   dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}
            {!isBest && (
              <circle cx={t.x} cy={t.y} r="0.9" fill="#ffdd00" fillOpacity="0">
                <animate attributeName="fill-opacity" values="0.7;0.15;0.7" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="r"            values="0.7;1.6;0.7"  dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// EvalBar
// ─────────────────────────────────────────────────────────────────
function EvalBar({ score, isMate, mateIn, isAnalyzing }:
  { score: number | null; isMate: boolean; mateIn: number | null; isAnalyzing: boolean }) {
  const clamped = Math.max(-1000, Math.min(1000, score ?? 0));
  const whitePct = 50 + (clamped / 1000) * 48;
  const text = formatScore(score, isMate, mateIn);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <div style={{ width: 22, height: '100%', minHeight: 200, maxHeight: 480, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', background: '#111', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ flex: `${100 - whitePct}`, background: '#2a2a2a', transition: 'flex 0.4s ease' }} />
        <div style={{ flex: `${whitePct}`, background: '#f0d9b5', transition: 'flex 0.4s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: isAnalyzing ? '#22ff88' : '#aaa', fontFamily: 'monospace', fontWeight: 700 }}>
        {isAnalyzing ? '…' : text}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AnalysisChessBoard
// ─────────────────────────────────────────────────────────────────
interface BoardProps {
  board: (string | null)[][];
  flipped: boolean;
  selectedSquare: { row: number; col: number } | null;
  legalMoveSquares: { row: number; col: number }[];
  lastMove: { from: string; to: string } | null;
  errorSquare: { row: number; col: number } | null;
  arrows: Arrow[];
  onSquareClick: (row: number, col: number) => void;
  interactive: boolean;
}
function AnalysisChessBoard({ board, flipped, selectedSquare, legalMoveSquares, lastMove, errorSquare, arrows, onSquareClick, interactive }: BoardProps) {
  const lastMoveGrids = useMemo(() => {
    if (!lastMove) return null;
    return { from: sqToGrid(lastMove.from), to: sqToGrid(lastMove.to) };
  }, [lastMove]);

  const cells = useMemo(() => {
    const result = [];
    for (let dRow = 0; dRow < 8; dRow++) {
      for (let dCol = 0; dCol < 8; dCol++) {
        const row = flipped ? 7 - dRow : dRow;
        const col = flipped ? 7 - dCol : dCol;
        const piece = board[row]?.[col] ?? null;
        const isLight = (row + col) % 2 === 0;
        const isSel   = selectedSquare?.row === row && selectedSquare?.col === col;
        const isLegal = legalMoveSquares.some(m => m.row === row && m.col === col);
        const isLFrom = lastMoveGrids?.from.row === row && lastMoveGrids?.from.col === col;
        const isLTo   = lastMoveGrids?.to.row   === row && lastMoveGrids?.to.col   === col;
        const isErr   = errorSquare?.row === row && errorSquare?.col === col;
        const isWhite = piece ? piece === piece.toUpperCase() : false;

        let bg = isLight ? LIGHT_SQ : DARK_SQ;
        if (isErr)                bg = ERR_SQ;
        else if (isSel)           bg = SEL_SQ;
        else if (isLegal)         bg = isLight ? LEGAL_LIGHT : LEGAL_DARK;
        else if (isLFrom || isLTo) bg = isLight ? LAST_LIGHT : LAST_DARK;

        result.push(
          <div key={`${row}-${col}`} onClick={interactive ? () => onSquareClick(row, col) : undefined}
            style={{ background: bg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: interactive ? 'pointer' : 'default', userSelect: 'none', WebkitUserSelect: 'none' }}>
            {dCol === 0 && <span style={{ position: 'absolute', top: '5%', left: '6%', fontSize: '0.6em', fontWeight: 700, lineHeight: 1, opacity: 0.65, pointerEvents: 'none', color: isLight ? DARK_SQ : LIGHT_SQ }}>{8 - row}</span>}
            {dRow === 7 && <span style={{ position: 'absolute', bottom: '4%', right: '6%', fontSize: '0.6em', fontWeight: 700, lineHeight: 1, opacity: 0.65, pointerEvents: 'none', color: isLight ? DARK_SQ : LIGHT_SQ }}>{String.fromCharCode(97 + col)}</span>}
            {isLegal && !piece && <div style={{ width: '30%', height: '30%', borderRadius: '50%', background: 'rgba(0,0,0,0.22)', pointerEvents: 'none' }} />}
            {isLegal && piece  && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.25)', pointerEvents: 'none' }} />}
            {piece && (
              <span style={{ fontSize: 'clamp(18px, 5.5vw, 40px)', lineHeight: 1, display: 'block', pointerEvents: 'none',
                color: isWhite ? '#ffffff' : '#111111',
                textShadow: isWhite
                  ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 8px rgba(0,0,0,0.6)'
                  : '-1px -1px 0 #ddd, 1px -1px 0 #ddd, -1px 1px 0 #ddd, 1px 1px 0 #ddd',
              }}>{PIECE_SYMS[piece]}</span>
            )}
          </div>
        );
      }
    }
    return result;
  }, [board, flipped, selectedSquare, legalMoveSquares, lastMoveGrids, errorSquare, interactive, onSquareClick]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 490, aspectRatio: '1', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.06)', flexShrink: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', width: '100%', height: '100%' }}>
        {cells}
      </div>
      <ArrowOverlay arrows={arrows} flipped={flipped} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MoveList
// ─────────────────────────────────────────────────────────────────
function MoveList({ moves, currentIndex, onMoveClick }: { moves: ParsedMove[]; currentIndex: number; onMoveClick: (idx: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  const rows: Array<{ num: number; w?: ParsedMove; b?: ParsedMove; wi: number; bi?: number }> = [];
  moves.forEach((m, i) => {
    if (m.color === 'w') rows.push({ num: m.moveNumber, w: m, wi: i + 1 });
    else {
      const last = rows[rows.length - 1];
      if (last && !last.b) { last.b = m; last.bi = i + 1; }
      else rows.push({ num: m.moveNumber, b: m, bi: i + 1 });
    }
  });

  return (
    <div ref={listRef} style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: 13, padding: '4px 0' }}>
      {rows.map(row => (
        <div key={row.num} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 8px' }}>
          <span style={{ width: 28, color: '#555', fontSize: 11, flexShrink: 0 }}>{row.num}.</span>
          {row.w && (
            <button data-active={currentIndex === row.wi} onClick={() => onMoveClick(row.wi)} style={{ flex: 1, textAlign: 'left', padding: '3px 6px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, background: currentIndex === row.wi ? 'rgba(250,204,21,0.3)' : 'transparent', color: currentIndex === row.wi ? '#fbbf24' : '#e2e8f0', transition: 'background 0.15s' }}>{row.w.san}</button>
          )}
          {row.b ? (
            <button data-active={currentIndex === row.bi} onClick={() => onMoveClick(row.bi!)} style={{ flex: 1, textAlign: 'left', padding: '3px 6px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, background: currentIndex === row.bi ? 'rgba(250,204,21,0.3)' : 'transparent', color: currentIndex === row.bi ? '#fbbf24' : '#cbd5e1', transition: 'background 0.15s' }}>{row.b.san}</button>
          ) : <div style={{ flex: 1 }} />}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Welcome Banner
// ─────────────────────────────────────────────────────────────────
function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 60, left: 16, right: 16,
        margin: '0 auto', maxWidth: 560,
        zIndex: 200,
        background: 'linear-gradient(135deg, rgba(12,8,30,0.98) 0%, rgba(18,10,42,0.98) 100%)',
        border: '1px solid rgba(167,139,250,0.28)', borderRadius: 16,
        boxShadow: '0 24px 70px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
        overflow: 'hidden',
        maxHeight: 'calc(100dvh - 80px)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ height: 2, flexShrink: 0, background: 'linear-gradient(90deg,#7c3aed,#22ff88,#fbbf24,#7c3aed)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />
      <div style={{ padding: '16px 18px 16px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}><Zap style={{ width: 18, height: 18, color: '#fff' }} /></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Analysis Board — Quick Guide</div>
            <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500, marginTop: 1 }}>Powered by Stockfish engine</div>
          </div>
          <button onClick={onDismiss} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 18, lineHeight: 1, padding: '2px 6px', borderRadius: 6 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(34,255,136,0.06)', border: '1px solid rgba(34,255,136,0.18)' }}>
            <Bot style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22ff88', marginBottom: 2 }}>Built-in Stockfish engine is active</div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.55 }}>One of the world's strongest engines runs live in your browser — giving you real-time evaluation, best-move arrows, and a principal variation line.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}>
            <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>♟</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 2 }}>Want deeper analysis? Use Chess.com</div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.55 }}>For full game reports with blunder / inaccuracy classification, run the analysis on <strong style={{ color: '#e2e8f0' }}>chess.com</strong>, then <strong style={{ color: '#e2e8f0' }}>download the PGN</strong> and upload it in the <strong style={{ color: '#c4b5fd' }}>Practice</strong> page to drill those lines.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Clipboard style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', marginBottom: 2 }}>How to use</div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.55 }}>
                <span style={{ color: '#c4b5fd' }}>①</span> <strong style={{ color: '#e2e8f0' }}>Free Play</strong> — move pieces, see live neon arrows.&nbsp;
                <span style={{ color: '#c4b5fd' }}>②</span> Load Chess.com games via the panel above the board.&nbsp;
                <span style={{ color: '#c4b5fd' }}>③</span> Navigate moves with <kbd style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 4px', fontSize: 10 }}>← →</kbd> and save the PGN.
              </div>
            </div>
          </div>
        </div>
        <button onClick={onDismiss} style={{ marginTop: 14, width: '100%', padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', letterSpacing: 0.3 }}>
          Got it — Start Analysing
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Analysis Page
// ─────────────────────────────────────────────────────────────────
type AppMode = 'free' | 'review';

const Analysis = () => {
  const navigate = useNavigate();
  const [mode, setMode]       = useState<AppMode>('free');
  const [flipped, setFlipped] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // ── Lock body scroll to prevent black space below ────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  // Board state
  const chessRef = useRef(new Chess());
  const [board, setBoard]                       = useState<(string | null)[][]>(parseFenToBoard(INITIAL_FEN));
  const [selectedSquare, setSelectedSquare]     = useState<{ row: number; col: number } | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<{ row: number; col: number }[]>([]);
  const [lastMove, setLastMove]                 = useState<{ from: string; to: string } | null>(null);
  const [errorSquare, setErrorSquare]           = useState<{ row: number; col: number } | null>(null);
  const [arrows, setArrows]                     = useState<Arrow[]>([]);

  // Review state
  const [currentGame, setCurrentGame] = useState<ChessComGame | null>(null);
  const [allMoves, setAllMoves]       = useState<ParsedMove[]>([]);
  const [positions, setPositions]     = useState<string[]>([INITIAL_FEN]);
  const [moveIndex, setMoveIndex]     = useState(0);

  // Chess.com state
  const [usernameInput, setUsernameInput] = useState('');
  const [games, setGames]                 = useState<ChessComGame[]>([]);
  const [gamesLoading, setGamesLoading]   = useState(false);
  const [gamesError, setGamesError]       = useState('');
  const [showGameList, setShowGameList]   = useState(false);

  // Engine state
  const [engine, setEngine] = useState<EngineState>({
    score: null, isMate: false, mateIn: null, pv: '', depth: 0, bestMove: null, isAnalyzing: false, ready: false,
  });
  const stockfishRef   = useRef<Worker | null>(null);
  const analysisFenRef = useRef(INITIAL_FEN);

  // ── Stockfish ────────────────────────────────────────────────
  useEffect(() => {
    let worker: Worker | undefined;
    (async () => {
      try {
        const res  = await fetch('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = new Blob([await res.text()], { type: 'application/javascript' });
        const url  = URL.createObjectURL(blob);
        worker = new Worker(url); URL.revokeObjectURL(url);
        worker.onmessage = (e: MessageEvent) => {
          const msg: string = typeof e.data === 'string' ? e.data : '';
          if (msg === 'readyok' || msg === 'uciok') { setEngine(p => ({ ...p, ready: true })); return; }
          if (msg.startsWith('bestmove')) {
            const bm = msg.split(' ')[1];
            if (bm && bm !== '(none)') setEngine(p => ({ ...p, bestMove: { from: bm.slice(0,2), to: bm.slice(2,4) }, isAnalyzing: false }));
            else setEngine(p => ({ ...p, bestMove: null, isAnalyzing: false }));
            return;
          }
          if (msg.startsWith('info') && msg.includes('depth')) {
            const depM = msg.match(/\bdepth (\d+)/);
            const cpM  = msg.match(/\bscore cp (-?\d+)/);
            const matM = msg.match(/\bscore mate (-?\d+)/);
            const pvM  = msg.match(/ pv ([\w\s]+)/);
            const mplM = msg.match(/\bmultipv (\d+)/);
            if (mplM && parseInt(mplM[1]) > 1) return;
            setEngine(p => ({
              ...p,
              ...(depM ? { depth: parseInt(depM[1]) } : {}),
              ...(cpM  ? { score: parseInt(cpM[1]), isMate: false } : {}),
              ...(matM ? { mateIn: parseInt(matM[1]), isMate: true  } : {}),
              ...(pvM  ? { pv: convertPvToSan(analysisFenRef.current, pvM[1].trim().split(' ')) } : {}),
            }));
          }
        };
        worker.postMessage('uci');
        worker.postMessage('setoption name Hash value 128');
        worker.postMessage('isready');
        stockfishRef.current = worker;
      } catch (err) { console.error('[Stockfish init]', err); }
    })();
    return () => { worker?.terminate(); };
  }, []);

  const analyzePosition = useCallback((fen: string) => {
    if (!stockfishRef.current) return;
    analysisFenRef.current = fen;
    setEngine(p => ({ ...p, isAnalyzing: true, bestMove: null, score: null, pv: '', depth: 0 }));
    stockfishRef.current.postMessage('stop');
    stockfishRef.current.postMessage(`position fen ${fen}`);
    stockfishRef.current.postMessage('go movetime 2000');
  }, []);

  useEffect(() => { if (engine.ready) analyzePosition(INITIAL_FEN); }, [engine.ready]); // eslint-disable-line

  // Sync arrows
  useEffect(() => {
    const list: Arrow[] = [];
    if (engine.bestMove) list.push({ from: engine.bestMove.from, to: engine.bestMove.to, color: BEST_ARROW, type: 'best' });
    if (mode === 'review' && moveIndex < allMoves.length) {
      const next = allMoves[moveIndex];
      if (!engine.bestMove || next.from !== engine.bestMove.from || next.to !== engine.bestMove.to)
        list.push({ from: next.from, to: next.to, color: PLAYED_ARROW, type: 'played' });
    }
    setArrows(list);
  }, [engine.bestMove, mode, moveIndex, allMoves]);

  // ── Chess.com fetch ──────────────────────────────────────────
  const fetchGames = useCallback(async () => {
    const user = usernameInput.trim().toLowerCase();
    if (!user) return;
    setGamesLoading(true); setGamesError(''); setGames([]);
    try {
      const archRes = await fetch(`https://api.chess.com/pub/player/${user}/games/archives`);
      if (!archRes.ok) throw new Error('Player not found — check the username.');
      const { archives = [] } = await archRes.json();
      if (!archives.length) throw new Error('No games found for this player.');
      const gamesRes = await fetch(archives[archives.length - 1]);
      if (!gamesRes.ok) throw new Error('Failed to fetch game list.');
      const { games: raw = [] } = await gamesRes.json();
      const fetched: ChessComGame[] = raw.filter((g: ChessComGame) => g.pgn).reverse();
      if (!fetched.length) throw new Error('No games with PGN data found.');
      setGames(fetched); setShowGameList(true);
    } catch (err: unknown) { setGamesError(err instanceof Error ? err.message : 'Unknown error'); }
    setGamesLoading(false);
  }, [usernameInput]);

  const loadGame = useCallback((game: ChessComGame) => {
    const moves = parseChessComPgn(game.pgn);
    if (!moves) { setGamesError('Failed to parse game PGN.'); return; }
    const posArr = buildPositions(moves);
    setCurrentGame(game); setAllMoves(moves); setPositions(posArr);
    setMoveIndex(0); setBoard(parseFenToBoard(posArr[0])); setLastMove(null);
    setSelectedSquare(null); setLegalMoveSquares([]);
    setMode('review'); setShowGameList(false);
    analyzePosition(posArr[0]);
  }, [analyzePosition]);

  const goToMove = useCallback((idx: number) => {
    const i = Math.max(0, Math.min(positions.length - 1, idx));
    setMoveIndex(i); setBoard(parseFenToBoard(positions[i]));
    setLastMove(i > 0 ? { from: allMoves[i-1].from, to: allMoves[i-1].to } : null);
    setSelectedSquare(null); setLegalMoveSquares([]);
    analyzePosition(positions[i]);
  }, [positions, allMoves, analyzePosition]);

  const navDir = useCallback((dir: 'first' | 'prev' | 'next' | 'last') => {
    goToMove({ first: 0, prev: moveIndex - 1, next: moveIndex + 1, last: positions.length - 1 }[dir]);
  }, [moveIndex, positions.length, goToMove]);

  useEffect(() => {
    if (mode !== 'review') return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); navDir('prev'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navDir('next'); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); navDir('first'); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); navDir('last'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [mode, navDir]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (mode !== 'free') return;
    const square = gridToSq(row, col);
    const piece  = board[row]?.[col];
    const chess  = chessRef.current;
    if (selectedSquare) {
      const isLegal = legalMoveSquares.some(m => m.row === row && m.col === col);
      if (isLegal) {
        const from = gridToSq(selectedSquare.row, selectedSquare.col);
        try {
          const result = chess.move({ from, to: square, promotion: 'q' });
          if (result) { setBoard(parseFenToBoard(chess.fen())); setLastMove({ from, to: square }); setSelectedSquare(null); setLegalMoveSquares([]); analyzePosition(chess.fen()); }
        } catch { setSelectedSquare(null); setLegalMoveSquares([]); }
      } else if (piece) {
        setSelectedSquare({ row, col });
        setLegalMoveSquares(chess.moves({ square: square as import('chess.js').Square, verbose: true }).map(m => sqToGrid(m.to)));
      } else { setSelectedSquare(null); setLegalMoveSquares([]); }
    } else if (piece) {
      setSelectedSquare({ row, col });
      setLegalMoveSquares(chess.moves({ square: square as import('chess.js').Square, verbose: true }).map(m => sqToGrid(m.to)));
    }
  }, [mode, board, selectedSquare, legalMoveSquares, analyzePosition]);

  const resetFreeBoard = useCallback(() => {
    chessRef.current.reset(); setBoard(parseFenToBoard(INITIAL_FEN));
    setLastMove(null); setSelectedSquare(null); setLegalMoveSquares([]);
    analyzePosition(INITIAL_FEN);
  }, [analyzePosition]);

  const downloadPgn = useCallback(() => {
    const source = mode === 'review' ? (currentGame?.pgn ?? '') : chessRef.current.pgn();
    if (!source) return;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([source], { type: 'text/plain' })),
      download: mode === 'review' && currentGame ? `${currentGame.white.username}_vs_${currentGame.black.username}.pgn` : 'analysis.pgn',
    });
    a.click(); URL.revokeObjectURL(a.href);
  }, [mode, currentGame]);

  const evalText   = formatScore(engine.score, engine.isMate, engine.mateIn);
  const currentFen = mode === 'review' ? (positions[moveIndex] ?? INITIAL_FEN) : chessRef.current.fen();
  const timeIconMap: Record<string, JSX.Element> = {
  bullet: <Zap style={{ width: 14, height: 14, display: 'inline-block' }} />,
  blitz: <Flame style={{ width: 14, height: 14, display: 'inline-block' }} />,
  rapid: <TimerIcon style={{ width: 14, height: 14, display: 'inline-block' }} />,
  daily: <CalendarDays style={{ width: 14, height: 14, display: 'inline-block' }} />,
};
const timeIcon = (tc: string): JSX.Element => timeIconMap[tc] ?? <span>♟</span>;

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────
  return (
    // ↓ Changed from minHeight:'100vh' to height:'100vh' + overflow:'hidden'
    //   The inner content div handles its own scrolling
    <div style={{ height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg, hsl(270 50% 18%) 0%, hsl(240 15% 6%) 50%, hsl(260 40% 14%) 100%)', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Welcome modal */}
      <AnimatePresence>
        {showWelcome && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWelcome(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
            <WelcomeBanner onDismiss={() => setShowWelcome(false)} />
          </>
        )}
      </AnimatePresence>

      {/* Header — fixed height, never scrolls */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>
            <span style={{ fontSize: 18 }}>←</span> Home
          </button>
          <button onClick={() => navigate('/practice')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 8, cursor: 'pointer', color: '#c4b5fd', fontSize: 14, padding: '4px 10px' }}>
            <Swords style={{ width: 16, height: 16, display: 'inline-block', marginRight: 4 }} /> Practice
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>♔</span>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.5, color: '#c4b5fd' }}>Analysis Board</span>
        </div>
        {/* Engine pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 20, background: engine.ready ? 'rgba(34,255,136,0.08)' : 'rgba(148,163,184,0.08)', border: `1px solid ${engine.ready ? 'rgba(34,255,136,0.28)' : 'rgba(148,163,184,0.15)'}`, fontSize: 11, color: engine.ready ? '#22ff88' : '#64748b', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 160 }}>
          <span style={{ width: 7, height: 7, minWidth: 7, borderRadius: '50%', display: 'inline-block', background: engine.ready ? (engine.isAnalyzing ? '#facc15' : '#22ff88') : '#475569', animation: engine.isAnalyzing ? 'sfPulse 0.9s infinite' : 'none' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {engine.ready ? (engine.isAnalyzing ? `d${engine.depth}` : `SF d${engine.depth}`) : 'Loading…'}
          </span>
        </div>
      </header>

      {/* ↓ This div now handles all scrolling — body itself stays locked */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '12px 10px 24px', alignItems: 'flex-start', justifyContent: 'center', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '0 0 auto', maxWidth: 540, width: '100%', minWidth: 0 }}>

            {/* Chess.com loader strip */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.07)', borderRadius: '12px 12px 0 0' }}>
                <span style={{ fontSize: 14 }}>♟</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', letterSpacing: 0.5 }}>CHESS.COM GAMES</span>
                {games.length > 0 && (
                  <button onClick={() => setShowGameList(g => !g)} style={{ marginLeft: 'auto', padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(196,181,253,0.2)', background: 'rgba(124,58,237,0.1)', color: '#c4b5fd', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                    {showGameList ? '▲ Hide' : '▼ Show'} {games.length} game{games.length !== 1 ? 's' : ''}
                  </button>
                )}
                {mode === 'review' && (
                  <button onClick={() => { setMode('free'); chessRef.current.reset(); setBoard(parseFenToBoard(INITIAL_FEN)); setLastMove(null); setSelectedSquare(null); setLegalMoveSquares([]); analyzePosition(INITIAL_FEN); }} style={{ marginLeft: games.length > 0 ? 0 : 'auto', padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: 10, cursor: 'pointer' }}>
                    ← Free Play
                  </button>
                )}
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchGames()}
                  placeholder="Enter username…"
                  style={{ flex: 1, minWidth: 110, padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 12, outline: 'none' }}
                />
                <button onClick={fetchGames} disabled={gamesLoading || !usernameInput.trim()} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: (gamesLoading || !usernameInput.trim()) ? 'not-allowed' : 'pointer', opacity: (gamesLoading || !usernameInput.trim()) ? 0.55 : 1, flexShrink: 0 }}>
                  {gamesLoading ? '…' : 'Load'}
                </button>
                <button onClick={downloadPgn} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(250,204,21,0.25)', background: 'rgba(250,204,21,0.08)', color: '#fbbf24', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}><Download style={{ width: 12, height: 12, display: 'inline-block', marginRight: 3 }} />PGN</button>
              </div>
              {gamesError && <div style={{ padding: '0 14px 10px', color: '#f87171', fontSize: 11 }}><TriangleAlert className="w-4 h-4 inline-block mr-1" />{gamesError}</div>}
            </div>

            {/* Board row */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', width: '100%' }}>
              <EvalBar score={engine.score} isMate={engine.isMate} mateIn={engine.mateIn} isAnalyzing={engine.isAnalyzing} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <AnalysisChessBoard board={board} flipped={flipped}
                  selectedSquare={mode === 'free' ? selectedSquare : null}
                  legalMoveSquares={mode === 'free' ? legalMoveSquares : []}
                  lastMove={lastMove} errorSquare={errorSquare}
                  arrows={arrows} onSquareClick={handleSquareClick}
                  interactive={mode === 'free'}
                />
              </div>
            </div>

            {/* Review nav */}
            {mode === 'review' && (
              <div style={{ display: 'flex', gap: 6 }}>
                {(['first','prev','next','last'] as const).map(d => (
                  <button key={d} onClick={() => navDir(d)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 20, cursor: 'pointer', touchAction: 'manipulation' }}>
                    {{ first: <ChevronsLeft style={{ width: 14, height: 14 }} />, prev: <ChevronLeft style={{ width: 14, height: 14 }} />, next: <ChevronRight style={{ width: 14, height: 14 }} />, last: <ChevronsRight style={{ width: 14, height: 14 }} /> }[d]}
                  </button>
                ))}
                <button onClick={() => setFlipped(f => !f)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 18, cursor: 'pointer', touchAction: 'manipulation' }}><FlipHorizontal2 style={{ width: 18, height: 18 }} /></button>
              </div>
            )}

            {/* Free play buttons */}
            {mode === 'free' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={resetFreeBoard} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }}><RotateCcw style={{ width: 14, height: 14, display: 'inline-block', marginRight: 4 }} />Reset</button>
                <button onClick={() => setFlipped(f => !f)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }}><FlipHorizontal2 style={{ width: 14, height: 14, display: 'inline-block', marginRight: 4 }} />Flip</button>
                <button onClick={() => analyzePosition(chessRef.current.fen())} disabled={!engine.ready} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(124,58,237,0.35)', background: engine.ready ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)', color: engine.ready ? '#c4b5fd' : '#475569', fontSize: 13, fontWeight: 600, cursor: engine.ready ? 'pointer' : 'not-allowed', touchAction: 'manipulation' }}><Zap style={{ width: 13, height: 13, display: 'inline-block', marginRight: 3 }} />Analyze</button>
              </div>
            )}

            {/* Game info bar */}
            {mode === 'review' && currentGame && (
              <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>♙ {currentGame.white.username} ({currentGame.white.rating ?? '?'}) <span style={{ color: '#475569', margin: '0 4px' }}>vs</span> ♟ {currentGame.black.username} ({currentGame.black.rating ?? '?'})</span>
                <span style={{ color: '#64748b' }}>Move {Math.min(moveIndex, allMoves.length)}/{allMoves.length} <span style={{ marginLeft: 5, color: '#475569' }}>← →</span></span>
              </div>
            )}

            {/* FEN */}
            <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', fontSize: 9, fontFamily: 'monospace', color: '#3a4a5a', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {currentFen}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ flex: '1 1 260px', minWidth: 0, maxWidth: 540, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Game list */}
            {showGameList && games.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.25)', display: 'flex', flexDirection: 'column', maxHeight: 340 }}>
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'rgba(124,58,237,0.07)', borderRadius: '12px 12px 0 0' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', letterSpacing: 0.5 }}>SELECT GAME</span>
                  <button onClick={() => setShowGameList(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 16, lineHeight: 1, padding: '2px 6px' }}>✕</button>
                </div>
                <div style={{ overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {games.slice(0, 40).map((game, i) => (
                    <button key={i} onClick={() => loadGame(game)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.06)', background: currentGame === game ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', width: '100%' }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{timeIcon(game.time_class)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {game.white.username} ({game.white.rating ?? '?'}) vs {game.black.username} ({game.black.rating ?? '?'})
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{new Date(game.end_time * 1000).toLocaleDateString()} · {game.time_class}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Move list */}
            {mode === 'review' && (
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', maxHeight: 330 }}>
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', letterSpacing: 0.5 }}>MOVES</span>
                  <span style={{ fontSize: 10, color: '#475569' }}>click or ← →</span>
                </div>
                <MoveList moves={allMoves} currentIndex={moveIndex} onMoveClick={goToMove} />
              </div>
            )}

            {/* Arrow legend */}
            {mode === 'review' && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.5 }}>ARROWS</div>
                {[
                  { neon: '#22ff88', label: 'Best move (engine)',    w: '3.2', w2: '1.4', wc: '0.7', gc: '#22ff88' },
                  { neon: '#ffdd00', label: 'Move played in game',  w: '2.5', w2: '1.1', wc: '0.55', gc: '#ffdd00' },
                ].map(({ neon, label, w, w2, wc, gc }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="40" height="12" viewBox="0 0 40 12">
                      <defs>
                        <marker id={`lh-${label}`} markerWidth="4" markerHeight="3.2" refX="3.6" refY="1.6" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0.5 L3.6,1.6 L0,2.7 L0.8,1.6 Z" fill={gc} />
                        </marker>
                      </defs>
                      <path d="M 3 9 Q 18 3 32 6" fill="none" stroke={neon} strokeWidth={w} strokeOpacity="0.18" strokeLinecap="round" />
                      <path d="M 3 9 Q 18 3 32 6" fill="none" stroke={neon} strokeWidth={w2} strokeOpacity="0.3" strokeLinecap="round" />
                      <path d="M 3 9 Q 18 3 32 6" fill="none" stroke={neon} strokeWidth={wc} strokeOpacity="0.95" strokeLinecap="round" markerEnd={`url(#lh-${label})`} />
                    </svg>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Engine panel */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', letterSpacing: 0.5 }}>ENGINE</span>
                {engine.isAnalyzing && <span style={{ fontSize: 10, color: '#facc15' }}>● analyzing</span>}
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color: engine.isMate ? '#f87171' : (engine.score ?? 0) >= 0 ? '#22ff88' : '#60a5fa' }}>{evalText}</span>
                  {engine.depth > 0 && <span style={{ fontSize: 10, color: '#475569' }}>depth {engine.depth}</span>}
                </div>
                {engine.bestMove && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(34,255,136,0.06)', border: '1px solid rgba(34,255,136,0.18)' }}>
                    <span style={{ fontSize: 16 }}>→</span>
                    <div>
                      <div style={{ fontSize: 10, color: '#475569' }}>Best move</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#22ff88' }}>{engine.bestMove.from} → {engine.bestMove.to}</div>
                    </div>
                  </div>
                )}
                {engine.pv && (
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', wordBreak: 'break-word', lineHeight: 1.7 }}>
                    <span style={{ color: '#475569', marginRight: 5, fontSize: 9 }}>PV</span>{engine.pv}
                  </div>
                )}
                {!engine.ready && <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '6px 0' }}>Loading Stockfish…</div>}
              </div>
            </div>

            {/* Free mode hint */}
            {mode === 'free' && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>FREE PLAY MODE</div>
                Move pieces freely. The <span style={{ color: '#22ff88' }}>green neon arrow</span> shows the engine's best move.<br /><br />
                Load Chess.com games above, or download a PGN from chess.com and upload it in the <strong style={{ color: '#c4b5fd' }}>Practice</strong> page to drill those lines.
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sfPulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        input::placeholder { color:#475569; }
        input:focus { border-color:rgba(124,58,237,0.5)!important; box-shadow:0 0 0 2px rgba(124,58,237,0.15); }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
        button { -webkit-tap-highlight-color: transparent; }
        * { box-sizing: border-box; }
        @media (max-width: 480px) {
          input { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default Analysis;