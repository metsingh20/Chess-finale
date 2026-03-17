import { Upload, ClipboardPaste, X, Check } from 'lucide-react';
import React, { useState } from 'react';
import { GameData } from '@/lib/pgn-parser';

interface GameSidebarProps {
  title: React.ReactNode;
  games: GameData[];
  currentGameIndex: number;
  onSelectGame: (index: number) => void;
  onBack: () => void;
  showUpload?: boolean;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPgnText?: (text: string) => void; // NEW: handles pasted PGN text
}

export default function GameSidebar({
  title,
  games,
  currentGameIndex,
  onSelectGame,
  onBack,
  showUpload = false,
  onFileUpload,
  onPgnText,
}: GameSidebarProps) {
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteValue, setPasteValue] = useState('');

  const handlePasteLoad = () => {
    if (!pasteValue.trim() || !onPgnText) return;
    onPgnText(pasteValue.trim());
    setPasteValue('');
    setShowPasteArea(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-elevated p-3 w-[240px] max-h-[520px] flex flex-col">
      {/* BACK BUTTON */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        className="flex items-center gap-2 w-full p-3 bg-muted rounded-lg text-foreground font-semibold text-sm hover:bg-surface-elevated active:bg-muted/70 transition-colors duration-200 font-body mb-3"
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          position: 'relative',
          zIndex: 10,
          minHeight: '44px',
        }}
      >
        ← Back
      </button>

      {/* Title */}
      <h2
        className="font-display text-base font-bold text-foreground mb-2"
        style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}
      >
        {title}
      </h2>

      {showUpload && (onFileUpload || onPgnText) && (
        <div className="mb-2 space-y-1.5" style={{ position: 'relative', zIndex: 1 }}>

          {/* Paste PGN — works on every mobile platform */}
          {!showPasteArea ? (
            <button
              onClick={() => setShowPasteArea(true)}
              className="block w-full py-2 gradient-gold text-primary-foreground text-center rounded-lg cursor-pointer font-semibold text-xs hover:shadow-gold hover:scale-[1.02] transition-all duration-300 font-body"
            >
              <ClipboardPaste className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Paste PGN
            </button>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-foreground text-xs font-semibold font-body">Paste PGN text:</span>
                <button
                  onClick={() => { setShowPasteArea(false); setPasteValue(''); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder={'[Event "..."]\n[White "..."]\n\n1. e4 e5 ...'}
                className="w-full h-24 p-2 bg-muted text-foreground text-[10px] font-mono rounded-lg border border-border resize-none focus:outline-none focus:border-primary/50"
                autoFocus
              />
              <button
                onClick={handlePasteLoad}
                disabled={!pasteValue.trim()}
                className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 font-body"
              >
                <Check className="w-3.5 h-3.5" /> Load PGN
              </button>
            </div>
          )}

          {/* File upload — kept as fallback for desktop / file manager */}
          {onFileUpload && !showPasteArea && (
            <label
              className="block w-full py-2 bg-muted text-muted-foreground text-center rounded-lg cursor-pointer font-semibold text-xs hover:bg-surface-elevated transition-all duration-300 font-body border border-border"
              style={{ pointerEvents: 'auto' }}
            >
              <Upload className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Upload File
              <input
                type="file"
                accept="*/*"
                onChange={onFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto space-y-1.5"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {games.length === 0 ? (
          <div className="text-muted-foreground text-center py-6 text-xs italic font-body">
            {showUpload ? 'Paste or upload a PGN to see your lines' : 'Loading openings...'}
          </div>
        ) : (
          games.map((game, index) => (
            <button
              key={index}
              onClick={() => onSelectGame(index)}
              className={`w-full text-left p-2.5 rounded-lg transition-all duration-300 border-2 cursor-pointer ${
                index === currentGameIndex
                  ? 'bg-primary/20 border-primary/40'
                  : 'bg-muted border-transparent hover:bg-surface-elevated hover:border-border'
              }`}
            >
              <div className="text-primary font-semibold text-xs font-body truncate">
                {showUpload ? `Line ${index + 1}` : game.white}
              </div>
              <div className="text-primary/70 text-[10px] font-body mt-0.5">
                {game.totalMoves} moves
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}