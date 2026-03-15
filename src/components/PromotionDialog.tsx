import { motion } from 'framer-motion';

const PIECES = {
  white: [
    { symbol: '♛', code: 'q' },
    { symbol: '♜', code: 'r' },
    { symbol: '♝', code: 'b' },
    { symbol: '♞', code: 'n' },
  ],
  black: [
    { symbol: '♛', code: 'q' },
    { symbol: '♜', code: 'r' },
    { symbol: '♝', code: 'b' },
    { symbol: '♞', code: 'n' },
  ],
};

interface PromotionDialogProps {
  isWhite: boolean;
  onSelect: (piece: string) => void;
  onCancel: () => void;
}

export default function PromotionDialog({ isWhite, onSelect, onCancel }: PromotionDialogProps) {
  const pieces = isWhite ? PIECES.white : PIECES.black;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-xl p-6 shadow-elevated border border-border"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-foreground text-center mb-4">
          Choose Promotion Piece
        </h3>
        <div className="flex gap-3 justify-center">
          {pieces.map(piece => (
            <button
              key={piece.code}
              onClick={() => onSelect(piece.code)}
              className="text-5xl p-3 bg-muted rounded-lg hover:bg-surface-elevated hover:scale-110 transition-all duration-300 cursor-pointer"
              style={{
                textShadow: isWhite
                  ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
                  : '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
                color: isWhite ? 'white' : '#333',
              }}
            >
              {piece.symbol}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
