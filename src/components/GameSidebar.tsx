import { Upload } from 'lucide-react';
import React, { useRef } from 'react';
import { GameData } from '@/lib/pgn-parser';

interface GameSidebarProps {
  title: React.ReactNode;
  games: GameData[];
  currentGameIndex: number;
  onSelectGame: (index: number) => void;
  onBack: () => void;
  showUpload?: boolean;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function GameSidebar({
  title,
  games,
  currentGameIndex,
  onSelectGame,
  onBack,
  showUpload = false,
  onFileUpload,
}: GameSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!onFileUpload) return;

    // Modern Android Chrome (86+) and desktop Chrome support showOpenFilePicker.
    // This opens the real Files/Documents app directly — no media picker, no
    // greyed-out files — because we bypass the <input> accept filter entirely.
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'PGN Chess Files',
              accept: { 'text/plain': ['.pgn', '.txt'] },
            },
          ],
          excludeAcceptAllOption: false,
          multiple: false,
        });
        const file: File = await fileHandle.getFile();

        // Build a synthetic ChangeEvent so the existing onFileUpload handler
        // in Practice.tsx works without any changes.
        const dt = new DataTransfer();
        dt.items.add(file);
        const input = fileInputRef.current!;
        Object.defineProperty(input, 'files', { value: dt.files, writable: true });
        const syntheticEvent = {
          target: input,
          currentTarget: input,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileUpload(syntheticEvent);
        return;
      } catch (err: any) {
        // AbortError = user cancelled — do nothing.
        // Any other error = fall through to the legacy <input> picker below.
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback for browsers without showOpenFilePicker (older Android, Firefox,
    // Safari <15.2). accept="*/*" keeps all files selectable even though it
    // shows the "Choose an action" sheet — user can tap Files from there.
    fileInputRef.current?.click();
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

      {showUpload && onFileUpload && (
        <div className="mb-2" style={{ position: 'relative', zIndex: 1 }}>
          {/* Button triggers showOpenFilePicker (real Files app) on modern Android/Chrome */}
          <button
            onClick={handleUploadClick}
            className="block w-full py-2 gradient-gold text-primary-foreground text-center rounded-lg cursor-pointer font-semibold text-xs hover:shadow-gold hover:scale-[1.02] transition-all duration-300 font-body"
            style={{ pointerEvents: 'auto' }}
          >
            <Upload className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Upload PGN
          </button>

          {/* Hidden fallback input for browsers without showOpenFilePicker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={onFileUpload}
            className="hidden"
          />
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto space-y-1.5"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {games.length === 0 ? (
          <div className="text-muted-foreground text-center py-6 text-xs italic font-body">
            {showUpload ? 'Upload a PGN file to see your lines' : 'Loading openings...'}
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