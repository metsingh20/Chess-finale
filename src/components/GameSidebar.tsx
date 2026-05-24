import { Upload, ClipboardPaste, X, Check, PenLine, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { GameData } from '@/lib/pgn-parser';
import {
  buildLineFingerprint,
  getLineNote,
  saveLineNote,
  deleteLineNote,
} from '@/lib/line-notes';

interface GameSidebarProps {
  title: React.ReactNode;
  games: GameData[];
  currentGameIndex: number;
  onSelectGame: (index: number) => void;
  onBack: () => void;
  showUpload?: boolean;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPgnText?: (text: string) => void;
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
  // ── PGN paste state ────────────────────────────────────────────────────────
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteValue, setPasteValue] = useState('');

  // ── Note editor state ──────────────────────────────────────────────────────
  // fingerprint of the line whose note editor is currently open (null = closed)
  const [openNoteFingerprint, setOpenNoteFingerprint] = useState<string | null>(null);
  // live draft text inside the open editor
  const [draftNote, setDraftNote] = useState('');
  // local mirror of saved notes so the UI re-renders on save/delete without
  // having to re-read localStorage on every render
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Populate the savedNotes mirror whenever the games list changes
  // (e.g. after a new PGN is loaded).
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const game of games) {
      const fp = buildLineFingerprint(game.moves);
      const note = getLineNote(fp);
      if (note) map[fp] = note;
    }
    setSavedNotes(map);
    // Also close any open editor that no longer belongs to the new game list
    if (openNoteFingerprint && !map.hasOwnProperty(openNoteFingerprint)) {
      // The fingerprint might still be valid (it just has no note yet), so
      // only close if the fingerprint is completely absent from the new games.
      const stillPresent = games.some(
        (g) => buildLineFingerprint(g.moves) === openNoteFingerprint
      );
      if (!stillPresent) {
        setOpenNoteFingerprint(null);
        setDraftNote('');
      }
    }
  }, [games]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the textarea when the editor opens
  useEffect(() => {
    if (openNoteFingerprint && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [openNoteFingerprint]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePasteLoad = () => {
    if (!pasteValue.trim() || !onPgnText) return;
    onPgnText(pasteValue.trim());
    setPasteValue('');
    setShowPasteArea(false);
  };

  const handleOpenNote = (e: React.MouseEvent, fingerprint: string) => {
    e.stopPropagation();
    if (openNoteFingerprint === fingerprint) {
      // Toggle off
      setOpenNoteFingerprint(null);
      setDraftNote('');
    } else {
      setOpenNoteFingerprint(fingerprint);
      setDraftNote(getLineNote(fingerprint));
    }
  };

  const handleSaveNote = (e: React.MouseEvent, fingerprint: string) => {
    e.stopPropagation();
    saveLineNote(fingerprint, draftNote);
    setSavedNotes((prev) => {
      const next = { ...prev };
      if (draftNote.trim()) {
        next[fingerprint] = draftNote.trim();
      } else {
        delete next[fingerprint];
      }
      return next;
    });
    setOpenNoteFingerprint(null);
    setDraftNote('');
  };

  const handleDeleteNote = (e: React.MouseEvent, fingerprint: string) => {
    e.stopPropagation();
    deleteLineNote(fingerprint);
    setSavedNotes((prev) => {
      const next = { ...prev };
      delete next[fingerprint];
      return next;
    });
    setOpenNoteFingerprint(null);
    setDraftNote('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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

      {/* PGN upload controls */}
      {showUpload && (onFileUpload || onPgnText) && (
        <div className="mb-2 space-y-1.5" style={{ position: 'relative', zIndex: 1 }}>

          {/* Paste PGN */}
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

          {/* File upload */}
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

      {/* ── Line list ─────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto space-y-1.5"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {games.length === 0 ? (
          <div className="text-muted-foreground text-center py-6 text-xs italic font-body">
            {showUpload ? 'Paste or upload a PGN to see your lines' : 'Loading openings...'}
          </div>
        ) : (
          games.map((game, index) => {
            const fingerprint = buildLineFingerprint(game.moves);
            const savedNote   = savedNotes[fingerprint] ?? '';
            const hasNote     = !!savedNote;
            const isNoteOpen  = openNoteFingerprint === fingerprint;
            const isSelected  = index === currentGameIndex;

            return (
              /* Outer wrapper — NOT a <button> so we can safely nest buttons */
              <div
                key={fingerprint || index}
                className={`rounded-lg border-2 transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? 'bg-primary/20 border-primary/40'
                    : 'bg-muted border-transparent hover:bg-surface-elevated hover:border-border'
                }`}
              >
                {/* ── Line header row ──────────────────────────────────── */}
                <div className="flex items-start gap-1 p-2.5">

                  {/* Clickable area — selects the line */}
                  <button
                    onClick={() => onSelectGame(index)}
                    className="flex-1 text-left min-w-0"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-primary font-semibold text-xs font-body truncate">
                        {showUpload ? `Line ${index + 1}` : game.white}
                      </span>
                      {/* Gold dot — note exists indicator */}
                      {hasNote && !isNoteOpen && (
                        <span
                          className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary"
                          title="Has a note"
                        />
                      )}
                    </div>
                    <div className="text-primary/70 text-[10px] font-body mt-0.5">
                      {game.totalMoves} moves
                    </div>
                  </button>

                  {/* Pencil icon — opens / closes note editor */}
                  <button
                    onClick={(e) => handleOpenNote(e, fingerprint)}
                    className={`flex-shrink-0 p-1 rounded-md transition-colors duration-200 ${
                      isNoteOpen
                        ? 'bg-primary/30 text-primary'
                        : hasNote
                        ? 'text-primary/70 hover:bg-primary/20 hover:text-primary'
                        : 'text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground'
                    }`}
                    title={isNoteOpen ? 'Close note' : hasNote ? 'Edit note' : 'Add note'}
                    style={{ minHeight: '28px', minWidth: '28px' }}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ── Collapsed note preview ───────────────────────────── */}
                {hasNote && !isNoteOpen && (
                  <div className="px-2.5 pb-2 -mt-1">
                    <p
                      className="text-[10px] text-primary/60 font-body italic leading-snug line-clamp-2 cursor-pointer"
                      onClick={(e) => handleOpenNote(e, fingerprint)}
                      title="Click to edit note"
                    >
                      {savedNote}
                    </p>
                  </div>
                )}

                {/* ── Inline note editor ───────────────────────────────── */}
                {isNoteOpen && (
                  <div
                    className="px-2.5 pb-2.5 space-y-1.5 border-t border-border/50 pt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      ref={textareaRef}
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="Write a note for this line…"
                      rows={3}
                      className="w-full p-2 bg-background text-foreground text-[11px] font-body rounded-lg border border-border/70 resize-none focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 leading-snug"
                    />

                    {/* Action buttons */}
                    <div className="flex gap-1.5">
                      {/* Save */}
                      <button
                        onClick={(e) => handleSaveNote(e, fingerprint)}
                        className="flex-1 py-1.5 bg-primary text-primary-foreground text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 font-body transition-colors hover:bg-primary/90"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>

                      {/* Delete — only shown when a note already exists */}
                      {hasNote && (
                        <button
                          onClick={(e) => handleDeleteNote(e, fingerprint)}
                          className="py-1.5 px-2 bg-destructive/20 text-destructive text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 font-body transition-colors hover:bg-destructive/30"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Cancel */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenNoteFingerprint(null); setDraftNote(''); }}
                        className="py-1.5 px-2 bg-muted text-muted-foreground text-[11px] rounded-md flex items-center justify-center font-body transition-colors hover:bg-surface-elevated"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}