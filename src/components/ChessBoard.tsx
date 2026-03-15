import { useMemo, useRef, useEffect } from 'react';

interface ChessBoardProps {
  board: (string | null)[][];
  flipped: boolean;
  selectedSquare: { row: number; col: number } | null;
  legalMoveSquares: { row: number; col: number }[];
  lastMove: { from: string; to: string } | null;
  errorSquare: { row: number; col: number } | null;
  onSquareClick: (row: number, col: number) => void;
  lightColor: string;
  darkColor: string;
}

const PIECES: Record<string, string> = {
  K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function ChessBoard({
  board,
  flipped,
  selectedSquare,
  legalMoveSquares,
  lastMove,
  errorSquare,
  onSquareClick,
  lightColor,
  darkColor,
}: ChessBoardProps) {
  const lastMoveSquares = useMemo(() => {
    if (!lastMove) return { from: null, to: null };
    const fromCol = lastMove.from.charCodeAt(0) - 97;
    const fromRow = 8 - parseInt(lastMove.from[1]);
    const toCol = lastMove.to.charCodeAt(0) - 97;
    const toRow = 8 - parseInt(lastMove.to[1]);
    return {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
    };
  }, [lastMove]);

  // Prevent page scroll when touching the board on mobile.
  // Must be a non-passive listener — React's synthetic events are passive by default
  // so they can't call preventDefault() on touchmove.
  const boardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchmove', prevent, { passive: false });
    el.addEventListener('touchstart', prevent, { passive: false });
    return () => {
      el.removeEventListener('touchmove', prevent);
      el.removeEventListener('touchstart', prevent);
    };
  }, []);

  const squares = [];

  for (let displayRow = 0; displayRow < 8; displayRow++) {
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const row = flipped ? 7 - displayRow : displayRow;
      const col = flipped ? 7 - displayCol : displayCol;

      const isLight = (row + col) % 2 === 0;
      const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
      const isLegalMove = legalMoveSquares.some(m => m.row === row && m.col === col);
      const isLastMoveFrom = lastMoveSquares.from?.row === row && lastMoveSquares.from?.col === col;
      const isLastMoveTo = lastMoveSquares.to?.row === row && lastMoveSquares.to?.col === col;
      const isError = errorSquare?.row === row && errorSquare?.col === col;
      const isBottomRow = displayRow === 7;
      const isLeftCol = displayCol === 0;

      const piece = board[row]?.[col];

      let bgColor = isLight ? lightColor : darkColor;
      if (isSelected) bgColor = 'hsl(var(--chess-selected))';
      else if (isLegalMove) bgColor = 'hsl(var(--chess-legal))';
      else if (isLastMoveFrom || isLastMoveTo) bgColor = 'hsl(var(--chess-last-move))';

      squares.push(
        <div
          key={`${row}-${col}`}
          className={`relative flex items-center justify-center cursor-pointer transition-all duration-150 hover:brightness-110 ${
            isError ? 'animate-shake' : ''
          }`}
          style={{
            backgroundColor: isError ? 'hsl(var(--chess-error))' : bgColor,
            width: '100%',
            aspectRatio: '1',
          }}
          onClick={() => onSquareClick(row, col)}
          onTouchEnd={(e) => { e.stopPropagation(); onSquareClick(row, col); }}
        >
          {/* Coordinates */}
          {isBottomRow && (
            <span className="absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none select-none opacity-60"
              style={{ color: isLight ? darkColor : lightColor }}>
              {files[col]}
            </span>
          )}
          {isLeftCol && (
            <span className="absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none select-none opacity-60"
              style={{ color: isLight ? darkColor : lightColor }}>
              {ranks[row]}
            </span>
          )}

          {/* Legal move dot */}
          {isLegalMove && !piece && (
            <div className="w-[25%] h-[25%] rounded-full bg-foreground/20" />
          )}

          {/* Piece */}
          {piece && (
            <span
              className={`text-[calc(min(6vw,37px))] sm:text-[37px] select-none pointer-events-none ${
                piece === piece.toUpperCase() ? 'piece-white' : 'piece-black'
              }`}
              style={{
                textShadow: piece === piece.toUpperCase()
                  ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 5px rgba(0,0,0,0.5)'
                  : '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 5px rgba(255,255,255,0.3)',
                color: piece === piece.toUpperCase() ? 'white' : '#333',
              }}
            >
              {PIECES[piece]}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div ref={boardRef} className="bg-card p-3 sm:p-4 rounded-xl shadow-elevated border border-border" style={{ touchAction: 'none' }}>
      <div
        className="grid grid-cols-8 border-2 border-border rounded-sm overflow-hidden"
        style={{ maxWidth: '464px', width: '100%', touchAction: 'none' }}
      >
        {squares}
      </div>
    </div>
  );
}