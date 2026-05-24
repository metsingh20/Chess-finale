// ─────────────────────────────────────────────────────────────────────────────
// Line Notes — persists user notes keyed by move content, not list position.
//
// KEY DESIGN: the note is attached to the EXACT sequence of moves
// (moves.join(',')).  This means if you re-upload a PGN with extra lines,
// or reorder lines, the note always follows the right line regardless of
// where it ends up in the list.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'chess-line-notes';

/** A stable fingerprint for a line based purely on its move sequence. */
export function buildLineFingerprint(moves: string[]): string {
  return moves.join(',');
}

/** Load the full notes map from localStorage. */
function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // corrupted data — start fresh
  }
  return {};
}

/** Persist the full notes map to localStorage. */
function persistNotes(notes: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('line-notes: failed to save', err);
  }
}

/** Retrieve the saved note for a fingerprint (empty string if none). */
export function getLineNote(fingerprint: string): string {
  return loadNotes()[fingerprint] ?? '';
}

/** Save (or overwrite) a note for a fingerprint. */
export function saveLineNote(fingerprint: string, note: string): void {
  const notes = loadNotes();
  const trimmed = note.trim();
  if (trimmed) {
    notes[fingerprint] = trimmed;
  } else {
    delete notes[fingerprint];          // empty note = delete
  }
  persistNotes(notes);
}

/** Delete any note stored for a fingerprint. */
export function deleteLineNote(fingerprint: string): void {
  const notes = loadNotes();
  delete notes[fingerprint];
  persistNotes(notes);
}

/** Check whether a note exists for a fingerprint. */
export function hasLineNote(fingerprint: string): boolean {
  return !!loadNotes()[fingerprint];
}