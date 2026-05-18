import { BookOpen, Target, BarChart2, TrendingUp, Menu } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChessBoard from '@/components/ChessBoard';
import GameSidebar from '@/components/GameSidebar';
import ControlsPanel from '@/components/ControlsPanel';
import PromotionDialog from '@/components/PromotionDialog';
import GuestLimitDialog from '@/components/GuestLimitDialog';
import GuestBanner from '@/components/GuestBanner';
import { StatsTrackingToggle } from '@/components/StatsTrackingToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { ChessEngine } from '@/lib/chess-engine';
import { parsePGN, GameData } from '@/lib/pgn-parser';
import { recordOpeningAttempt, recordLineAttempt, setFileUploaded, buildGameKey } from '@/lib/stats-tracker';
import { useAuth } from '@/hooks/useAuth';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

const BOARD_COLORS: Record<string, { light: string; dark: string }> = {
  classic: { light: '#f0d9b5', dark: '#b58863' },
  purple: { light: '#e0c3fc', dark: '#8b5cf6' },
  blue: { light: '#bfdbfe', dark: '#3b82f6' },
  red: { light: '#fecaca', dark: '#dc2626' },
};

type SidebarView = 'menu' | 'lines' | 'openings';

function parseFEN(fen: string): (string | null)[][] {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const boardRow: (string | null)[] = [];
    for (const char of row) {
      if (isNaN(Number(char))) {
        boardRow.push(char);
      } else {
        for (let i = 0; i < parseInt(char); i++) {
          boardRow.push(null);
        }
      }
    }
    return boardRow;
  });
}

// ── Skeleton screen shown while the page initialises ──────────────────────────
function PracticeSkeleton() {
  return (
    <div
      className="h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: 'url(/wall.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay matching the live page */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4 sm:p-6 pl-20 sm:pl-24">
          <Skeleton className="h-5 w-20 rounded-md bg-white/20" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-28 rounded-md bg-white/20" />
            <Skeleton className="h-6 w-32 rounded-md bg-white/20" />
          </div>
        </div>

        {/* Body skeleton: sidebar stub + board + controls */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 justify-center items-start px-4 sm:px-6 pb-8 pt-4">

          {/* Sidebar stub */}
          <div className="hidden sm:block">
            <Skeleton className="w-14 h-64 rounded-r-xl bg-white/20" />
          </div>

          {/* Board skeleton */}
          <div className="flex flex-col items-center gap-4 w-full lg:w-auto">
            {/* Progress bar placeholder */}
            <Skeleton className="h-14 w-full max-w-[464px] rounded-xl bg-white/20" />

            {/* Chess board grid skeleton */}
            <div
              className="rounded-xl overflow-hidden shadow-elevated border border-white/10"
              style={{ width: 'min(464px, 90vw)', aspectRatio: '1' }}
            >
              <div className="grid grid-cols-8 h-full w-full">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const isLight = (row + col) % 2 === 0;
                  return (
                    <div
                      key={i}
                      className={`relative ${isLight ? 'bg-[#f0d9b5]/40' : 'bg-[#b58863]/40'}`}
                      style={{ aspectRatio: '1' }}
                    >
                      {/* Shimmer pulse overlay */}
                      <div className="absolute inset-0 animate-pulse bg-white/10" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls panel skeleton */}
          <div className="hidden sm:flex flex-col gap-3 w-[300px]">
            <Skeleton className="h-10 w-full rounded-xl bg-white/20" />
            <Skeleton className="h-24 w-full rounded-xl bg-white/20" />
            <Skeleton className="h-20 w-full rounded-xl bg-white/20" />
            <Skeleton className="h-16 w-full rounded-xl bg-white/20" />
            <Skeleton className="h-32 w-full rounded-xl bg-white/20" />
          </div>
        </div>
      </div>

      {/* Chess piece watermarks (match live page feel) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04] z-0">
        <span className="absolute top-10 left-10 text-[160px] text-white">♔</span>
        <span className="absolute bottom-10 right-10 text-[120px] text-white">♛</span>
      </div>
    </div>
  );
}

const Practice = () => {
  const navigate = useNavigate();
  const engineRef = useRef(new ChessEngine());
  const engine = engineRef.current;

  // ── Page-level loading state ────────────────────────────────────────────────
  const [pageReady, setPageReady] = useState(false);

  const [board, setBoard] = useState<(string | null)[][]>(parseFEN(INITIAL_FEN));
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<'view' | 'guess'>('guess');
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<{ row: number; col: number }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [errorSquare, setErrorSquare] = useState<{ row: number; col: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [currentMoveSan, setCurrentMoveSan] = useState<string | null>(null);
  const [boardColor, setBoardColor] = useState('classic');
  const [autoRespond, setAutoRespond] = useState(false);
  const [celebration, setCelebration] = useState(false);

  // Sidebar state
  const [sidebarView, setSidebarView] = useState<SidebarView>('menu');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [allGames, setAllGames] = useState<GameData[]>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  // Promotion state
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string; isWhite: boolean } | null>(null);

  // UI hint state
  const [showDoubleClickHint, setShowDoubleClickHint] = useState(false);
  const [pendingOpeningIndex, setPendingOpeningIndex] = useState<number | null>(null);

  // GUEST MODE
  const [showGuestLimitDialog, setShowGuestLimitDialog] = useState(false);
  const [guestLimitType, setGuestLimitType] = useState<'openings' | 'lines'>('openings');
  const {
    isGuest,
    canUseOpening,
    canUploadLine,
    trackOpeningUsage,
    trackLineUpload
  } = useAuth();

  // STATS TRACKING
  const [trackStats, setTrackStats] = useState(() => {
    return localStorage.getItem('trackStats') !== 'false';
  });

  // ── Show skeleton for a short tick while JS initialises, then reveal ────────
  useEffect(() => {
    const id = setTimeout(() => setPageReady(true), 800);
    return () => clearTimeout(id);
  }, []);

  // COMPLETELY LOCK SCROLLING
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    // Match wall.jpeg as the body background to avoid any black flash
    document.body.style.backgroundImage = 'url(/wall.jpeg)';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.documentElement.style.background = '#0e0a1a';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.documentElement.style.background = '';
    };
  }, []);

  // STATS TRACKING: Persist preference
  useEffect(() => {
    localStorage.setItem('trackStats', trackStats.toString());
  }, [trackStats]);

  const hasMadeMistakeRef = useRef(false);
  const hasRecordedAttemptRef = useRef(false);

  // Load openings automatically
  useEffect(() => {
    const loadOpenings = async () => {
      if (sidebarView === 'openings' && allGames.length === 0) {
        try {
          const response = await fetch('/Openings by name.pgn');
          if (!response.ok) {
            throw new Error('Failed to load openings file');
          }
          const text = await response.text();
          const games = parsePGN(text);

          if (games.length === 0) {
            showMessage('No valid games found in openings file', 'error');
            return;
          }

          setAllGames(games);
          selectGame(0);
          showMessage(`Loaded ${games.length} opening(s)!`, 'success');
        } catch (error) {
          console.error('Error loading openings:', error);
          showMessage('Failed to load openings', 'error');
        }
      }
    };

    loadOpenings();
  }, [sidebarView]);

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const updateBoardFromEngine = useCallback(() => {
    setBoard(parseFEN(engine.getFen()));
    setMoveIndex(engine.getMoveIndex());
  }, [engine]);

  const playOpponentMove = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = engine.playNextMove();
    if (result) {
      setBoard(parseFEN(result.fen));
      setMoveIndex(result.moveIndex);
      setLastMove(result.lastMove);
      if (result.moveSan) {
        showMessage('Opponent played: ' + result.moveSan, 'success');
      }
    }
  }, [engine, showMessage]);

  const selectGame = useCallback((index: number, gamesOverride?: GameData[]) => {
    const games = gamesOverride || allGames;
    if (!games[index]) return;

    if (isGuest && !canUseOpening(index)) {
      setGuestLimitType('openings');
      setShowGuestLimitDialog(true);
      return;
    }

    if (isGuest) {
      trackOpeningUsage(index);
    }

    const game = games[index];
    engine.loadGame(game.moves);
    setCurrentGameIndex(index);
    setBoard(parseFEN(engine.getFen()));
    setMoveIndex(0);
    setTotalMoves(game.moves.length);
    setLastMove(null);
    setSelectedSquare(null);
    setLegalMoveSquares([]);
    setCurrentMoveSan(null);
    setGameLoaded(true);
    hasMadeMistakeRef.current = false;
    hasRecordedAttemptRef.current = false;

    setShowDoubleClickHint(false);
    setPendingOpeningIndex(null);
    if (autoRespond && flipped) {
      setTimeout(() => playOpponentMove(), 300);
    }
  }, [allGames, engine, autoRespond, flipped, playOpponentMove, showMessage, sidebarView, isGuest, canUseOpening, trackOpeningUsage]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isGuest && !canUploadLine()) {
      setGuestLimitType('lines');
      setShowGuestLimitDialog(true);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const games = parsePGN(text);
      if (games.length === 0) {
        showMessage('No valid games found in PGN file', 'error');
        return;
      }

      if (isGuest) {
        trackLineUpload();
      }

      setFileUploaded(true);
      setAllGames(games);
      selectGame(0, games);
      showMessage(`Loaded ${games.length} game(s)!`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [selectGame, showMessage, isGuest, canUploadLine, trackLineUpload]);

  const handlePgnText = useCallback((text: string) => {
    if (isGuest && !canUploadLine()) {
      setGuestLimitType('lines');
      setShowGuestLimitDialog(true);
      return;
    }

    const games = parsePGN(text);
    if (games.length === 0) {
      showMessage('No valid games found in PGN text', 'error');
      return;
    }

    if (isGuest) {
      trackLineUpload();
    }

    setFileUploaded(true);
    setAllGames(games);
    selectGame(0, games);
    showMessage(`Loaded ${games.length} game(s)!`, 'success');
  }, [selectGame, showMessage, isGuest, canUploadLine, trackLineUpload]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!gameLoaded || mode !== 'guess') return;
    if (moveIndex >= totalMoves) {
      showMessage('Game already complete!', 'error');
      return;
    }

    const piece = board[row]?.[col];
    const file = String.fromCharCode(97 + col);
    const rank = String(8 - row);
    const square = file + rank;

    if (selectedSquare) {
      const isLegalMove = legalMoveSquares.some(m => m.row === row && m.col === col);

      if (isLegalMove) {
        const fromFile = String.fromCharCode(97 + selectedSquare.col);
        const fromRank = String(8 - selectedSquare.row);
        const from = fromFile + fromRank;
        const to = square;
        const movingPiece = board[selectedSquare.row]?.[selectedSquare.col];

        const isPawnPromotion =
          (movingPiece === 'P' && row === 0) ||
          (movingPiece === 'p' && row === 7);

        if (isPawnPromotion) {
          setPromotionPending({ from, to, isWhite: movingPiece === 'P' });
          return;
        }

        executeMove(from, to);
      } else if (piece) {
        setSelectedSquare({ row, col });
        const moves = engine.getLegalMovesFrom(square);
        setLegalMoveSquares(moves.map(m => ({
          row: 8 - parseInt(m.to[1]),
          col: m.to.charCodeAt(0) - 97,
        })));
      } else {
        setSelectedSquare(null);
        setLegalMoveSquares([]);
      }
    } else if (piece) {
      setSelectedSquare({ row, col });
      const moves = engine.getLegalMovesFrom(square);
      setLegalMoveSquares(moves.map(m => ({
        row: 8 - parseInt(m.to[1]),
        col: m.to.charCodeAt(0) - 97,
      })));
    }
  }, [gameLoaded, mode, moveIndex, totalMoves, board, selectedSquare, legalMoveSquares, engine, showMessage]);

  const executeMove = useCallback(async (from: string, to: string, promotion?: string) => {
    const result = engine.validateMove(from, to, promotion);

    const currentGame = allGames[currentGameIndex];
    const gameName = trackStats && gameLoaded && currentGame
      ? buildGameKey(currentGame.white, currentGame.event, currentGame.index ?? currentGameIndex)
      : '';

    if (result.valid && result.fen) {
      setBoard(parseFEN(result.fen));
      setMoveIndex(result.nextMoveIndex!);
      setLastMove(result.lastMove!);
      showMessage('Correct! ✓', 'success');

      const isCompleted = result.nextMoveIndex! >= totalMoves;

      if (isCompleted) {
        if (trackStats && gameLoaded && gameName && !hasRecordedAttemptRef.current) {
          const wasCorrect = !hasMadeMistakeRef.current;
          if (sidebarView === 'openings') {
            recordOpeningAttempt(gameName, wasCorrect);
          } else if (sidebarView === 'lines') {
            recordLineAttempt(gameName, wasCorrect);
          }
          hasRecordedAttemptRef.current = true;
        }
        setCelebration(true);
        setTimeout(() => setCelebration(false), 2000);
        showMessage('🎊 Congratulations! You completed the game! 🎊', 'success');
      } else if (autoRespond) {
        await playOpponentMove();
        if (engine.getMoveIndex() >= totalMoves) {
          if (trackStats && gameLoaded && gameName && !hasRecordedAttemptRef.current) {
            const wasCorrect = !hasMadeMistakeRef.current;
            if (sidebarView === 'openings') {
              recordOpeningAttempt(gameName, wasCorrect);
            } else if (sidebarView === 'lines') {
              recordLineAttempt(gameName, wasCorrect);
            }
            hasRecordedAttemptRef.current = true;
          }
          setCelebration(true);
          setTimeout(() => setCelebration(false), 2000);
          showMessage('🎊 Congratulations! You completed the game! 🎊', 'success');
        }
      }
    } else {
      if (trackStats && gameLoaded && gameName && !hasRecordedAttemptRef.current) {
        hasMadeMistakeRef.current = true;
        if (sidebarView === 'openings') {
          recordOpeningAttempt(gameName, false);
        } else if (sidebarView === 'lines') {
          recordLineAttempt(gameName, false);
        }
        hasRecordedAttemptRef.current = true;
      }

      const toCol = to.charCodeAt(0) - 97;
      const toRow = 8 - parseInt(to[1]);
      setErrorSquare({ row: toRow, col: toCol });
      setTimeout(() => setErrorSquare(null), 500);
      showMessage('Wrong move! Expected: ' + result.expectedMove, 'error');
    }

    setSelectedSquare(null);
    setLegalMoveSquares([]);
    setPromotionPending(null);
  }, [engine, totalMoves, autoRespond, playOpponentMove, showMessage, trackStats, gameLoaded, currentGameIndex, allGames, sidebarView]);

  const handleNavigate = useCallback((dir: 'first' | 'prev' | 'next' | 'last') => {
    if (mode !== 'view') return;
    const result = engine.navigateTo(dir);
    setBoard(parseFEN(result.fen));
    setMoveIndex(result.moveIndex);
    setLastMove(result.lastMove);
    setCurrentMoveSan(result.currentMoveSan);
  }, [mode, engine]);

  const handleReset = useCallback(() => {
    engine.reset();
    setBoard(parseFEN(INITIAL_FEN));
    setSelectedSquare(null);
    setLegalMoveSquares([]);
    setMoveIndex(0);
    setLastMove(null);
    setCurrentMoveSan(null);
    hasMadeMistakeRef.current = false;
    hasRecordedAttemptRef.current = false;
    showMessage('Game reset!', 'success');
    if (autoRespond && flipped && gameLoaded) {
      setTimeout(() => playOpponentMove(), 300);
    }
  }, [engine, showMessage, autoRespond, flipped, gameLoaded, playOpponentMove]);

  const handleFlip = useCallback(() => {
    setFlipped(f => !f);
    showMessage(`Board flipped! Playing as ${!flipped ? 'Black' : 'White'}`, 'success');
    if (gameLoaded) {
      engine.reset();
      setBoard(parseFEN(INITIAL_FEN));
      setSelectedSquare(null);
      setLegalMoveSquares([]);
      setMoveIndex(0);
      setLastMove(null);

      if (autoRespond && !flipped) {
        setTimeout(() => playOpponentMove(), 300);
      }
    }
  }, [flipped, gameLoaded, autoRespond, engine, playOpponentMove, showMessage]);

  const handleToggleAutoRespond = useCallback(() => {
    const newVal = !autoRespond;
    setAutoRespond(newVal);
    showMessage(`Auto Respond ${newVal ? 'enabled' : 'disabled'}`, 'success');

    if (newVal && flipped && gameLoaded && engine.getMoveIndex() === 0) {
      setTimeout(() => playOpponentMove(), 300);
    }
  }, [autoRespond, flipped, gameLoaded, engine, playOpponentMove, showMessage]);

  const colors = BOARD_COLORS[boardColor] || BOARD_COLORS.classic;
  const progress = totalMoves > 0 ? (moveIndex / totalMoves) * 100 : 0;

  // ── Render skeleton while initialising ──────────────────────────────────────
  if (!pageReady) {
    return <PracticeSkeleton />;
  }

  return (
    <div
      className="h-screen flex flex-col relative"
      style={{
        backgroundImage: 'url(/wall.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay to keep the UI readable over the image */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" style={{ zIndex: 0 }} />

      <GuestBanner />

      <header className="flex items-center justify-between p-4 sm:p-6 pl-20 sm:pl-24 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-300 font-body text-sm"
        >
          ← Home
        </button>

        <div className="hidden lg:flex items-center gap-4">
          <StatsTrackingToggle
            trackStats={trackStats}
            setTrackStats={setTrackStats}
          />
          <div className="flex items-center gap-2">
            <span className="text-2xl">♔</span>
            <span className="font-display text-primary font-bold">Chess Lines</span>
          </div>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <span className="text-2xl">♔</span>
          <span className="font-display text-primary font-bold">Chess Lines</span>
        </div>
      </header>

      {/* SIDEBAR AREA */}
      <div
        className="fixed left-0 top-16 lg:top-32 z-[1000]"
        style={{ pointerEvents: sidebarView === 'menu' ? 'auto' : 'none' }}
      >
        <AnimatePresence mode="wait">
          {sidebarView === 'menu' && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ pointerEvents: 'auto' }}
            >

              {/* ── MOBILE ── */}
              <div className="block sm:hidden">
                <div className={`bg-card border border-border rounded-r-xl shadow-elevated transition-all duration-300 ${menuExpanded ? 'w-[250px]' : 'w-14'}`}>
                  <div
                    className="gradient-gold py-4 px-2 text-center text-primary-foreground font-bold flex flex-col items-center justify-center gap-1"
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!menuExpanded) {
                        setMenuExpanded(true);
                        setMenuReady(false);
                        setTimeout(() => setMenuReady(true), 500);
                      } else {
                        setMenuExpanded(false);
                        setMenuReady(false);
                      }
                    }}
                  >
                    <Menu className="w-6 h-6" />
                    <span className="text-[10px] font-semibold tracking-wide leading-none">MENU</span>
                  </div>
                  {menuExpanded && (
                    <div
                      className="p-3 space-y-2"
                      style={{ pointerEvents: menuReady ? 'auto' : 'none', opacity: menuReady ? 1 : 0.4, transition: 'opacity 0.2s' }}
                    >
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide px-1 pb-1 font-body">Practice</p>
                      <button
                        onTouchEnd={(e) => { e.stopPropagation(); setSidebarView('lines'); setMobileSidebarOpen(true); setMenuExpanded(false); setMenuReady(false); }}
                        className="w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm text-left font-body flex items-center gap-2"
                      >
                        <Target className="w-4 h-4 shrink-0" /> Your Lines
                      </button>
                      <button
                        onTouchEnd={(e) => { e.stopPropagation(); setSidebarView('openings'); setMobileSidebarOpen(true); setMenuExpanded(false); setMenuReady(false); }}
                        className="w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm text-left font-body flex items-center gap-2"
                      >
                        <span className="shrink-0">♟️</span> Openings
                      </button>
                      <div className="border-t border-border my-1" />
                      <button
                        onTouchEnd={(e) => { e.stopPropagation(); navigate('/analysis'); }}
                        className="w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm text-left font-body flex items-center gap-2"
                      >
                        <BarChart2 className="w-4 h-4 shrink-0" /> Analysis
                      </button>
                      <button
                        onTouchEnd={(e) => { e.stopPropagation(); navigate('/stats'); }}
                        className="w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm text-left font-body flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4 shrink-0" /> Stats
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── DESKTOP ── */}
              <div className="hidden sm:block group">
                <div className="bg-card border border-border rounded-r-xl shadow-elevated overflow-visible w-14 hover:w-[250px] transition-all duration-400 cursor-pointer">
                  <div className="gradient-gold py-4 px-2 text-center text-primary-foreground font-bold pointer-events-auto flex flex-col items-center justify-center gap-1">
                    <Menu className="w-6 h-6" />
                    <span className="text-[10px] font-semibold tracking-wide leading-none">MENU</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 p-3 space-y-2 pointer-events-auto">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide px-1 pb-1 font-body">Practice</p>
                    <button
                      onClick={() => { setSidebarView('lines'); setMobileSidebarOpen(true); }}
                      className="w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm text-left hover:bg-surface-elevated transition-all duration-300 font-body flex items-center gap-2"
                    >
                      <Target className="w-4 h-4 shrink-0" /> Your Lines
                    </button>
                    <button
                      onClick={() => { setSidebarView('openings'); setMobileSidebarOpen(true); }}
                      className="w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm text-left hover:bg-surface-elevated transition-all duration-300 font-body flex items-center gap-2"
                    >
                      <span className="shrink-0">♟️</span> Openings
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => navigate('/analysis')}
                      className="w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm text-left hover:bg-surface-elevated transition-all duration-300 font-body flex items-center gap-2"
                    >
                      <BarChart2 className="w-4 h-4 shrink-0" /> Analysis
                    </button>
                    <button
                      onClick={() => navigate('/stats')}
                      className="w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm text-left hover:bg-surface-elevated transition-all duration-300 font-body flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4 shrink-0" /> Stats
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ pointerEvents: sidebarView !== 'menu' ? 'auto' : 'none' }}>
          {/* Mobile: floating button to reopen sidebar when collapsed */}
          {sidebarView !== 'menu' && !mobileSidebarOpen && (
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[1001] gradient-gold text-primary-foreground rounded-r-xl px-2 py-4 shadow-elevated flex flex-col items-center gap-1"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-wide" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>LIST</span>
            </button>
          )}
          <AnimatePresence>
            {sidebarView === 'lines' && (
              <motion.div
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ duration: 0.3 }}
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50 }}
                className={sidebarView === 'lines' && !mobileSidebarOpen ? 'hidden lg:block' : ''}
              >
                <GameSidebar
                  title={<span className="flex items-center gap-1"><Target className="w-4 h-4" /> Your Lines</span>}
                  games={allGames}
                  currentGameIndex={currentGameIndex}
                  onSelectGame={selectGame}
                  onBack={() => {
                    setSidebarView('menu');
                    setMobileSidebarOpen(true);
                  }}
                  showUpload
                  onFileUpload={handleFileUpload}
                  onPgnText={handlePgnText}
                />
              </motion.div>
            )}
            {sidebarView === 'openings' && (
              <motion.div
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ duration: 0.3 }}
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50 }}
                className={sidebarView === 'openings' && !mobileSidebarOpen ? 'hidden lg:block' : ''}
              >
                <GameSidebar
                  title="Practice Openings"
                  games={allGames}
                  currentGameIndex={currentGameIndex}
                  onSelectGame={selectGame}
                  onBack={() => {
                    setSidebarView('menu');
                    setMobileSidebarOpen(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MAIN: board + ControlsPanel */}
      <main className={`flex-1 overflow-y-auto flex flex-col lg:flex-row gap-6 justify-center items-start px-4 sm:px-6 pb-8 pt-4 transition-all duration-300 relative z-10 ${
        sidebarView === 'lines' || sidebarView === 'openings' ? 'lg:ml-[260px]' : ''
      }`}>

        {/* Left: mobile toggle, hint, progress bar, board */}
        <div className="flex flex-col items-center gap-4 w-full lg:w-auto">
          <div className="w-full lg:hidden max-w-[464px]">
            <StatsTrackingToggle
              trackStats={trackStats}
              setTrackStats={setTrackStats}
            />
          </div>

          {gameLoaded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-3 w-full max-w-[464px] text-center"
            >
              <p className="text-foreground font-semibold text-sm font-body mb-2">
                Move {moveIndex} of {totalMoves}
              </p>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold-glow)))',
                  }}
                />
              </div>
            </motion.div>
          )}

          <ChessBoard
            board={board}
            flipped={flipped}
            selectedSquare={selectedSquare}
            legalMoveSquares={legalMoveSquares}
            lastMove={lastMove}
            errorSquare={errorSquare}
            onSquareClick={handleSquareClick}
            lightColor={colors.light}
            darkColor={colors.dark}
          />
        </div>

        {/* Right: ControlsPanel */}
        <ControlsPanel
          mode={mode}
          onSetMode={setMode}
          onReset={handleReset}
          onFlip={handleFlip}
          onNavigate={handleNavigate}
          autoRespond={autoRespond}
          onToggleAutoRespond={handleToggleAutoRespond}
          currentMoveSan={currentMoveSan}
          message={message}
          boardColor={boardColor}
          onSetBoardColor={setBoardColor}
        />
      </main>

      {promotionPending && (
        <PromotionDialog
          isWhite={promotionPending.isWhite}
          onSelect={(piece) => executeMove(promotionPending.from, promotionPending.to, piece)}
          onCancel={() => {
            setPromotionPending(null);
            setSelectedSquare(null);
            setLegalMoveSquares([]);
          }}
        />
      )}

      <GuestLimitDialog
        open={showGuestLimitDialog}
        onOpenChange={setShowGuestLimitDialog}
        limitType={guestLimitType}
      />

      {celebration && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[100px] z-50 pointer-events-none animate-celebrate">
          🎉🏆✨
        </div>
      )}
    </div>
  );
};

export default Practice;