// src/hooks/useLineNotes.ts
//
// Provides cloud-synced line notes for logged-in users.
// Falls back to localStorage for guests — identical UX, no data loss.
//
// Strategy:
//   • On mount (or when the user logs in) fetch ALL notes for this user
//     from Supabase and populate local state.
//   • Every save / delete is applied optimistically to local state first
//     so the UI responds instantly, then the Supabase call happens in the
//     background.
//   • Guests: all reads/writes go to localStorage exactly as before.

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  getLineNote,
  saveLineNote,
  deleteLineNote,
} from '@/lib/line-notes';

// ─── public API ──────────────────────────────────────────────────────────────

export interface UseLineNotesReturn {
  /** All notes for the current game list, keyed by fingerprint. */
  notes: Record<string, string>;
  /** True while the initial Supabase fetch is in-flight (logged-in users only). */
  loading: boolean;
  /** Save (or clear, if note is empty) a note for a fingerprint. */
  saveNote: (fingerprint: string, note: string) => Promise<void>;
  /** Delete the note for a fingerprint. */
  deleteNote: (fingerprint: string) => Promise<void>;
  /** Read a single note (from local state — synchronous, no extra fetch). */
  getNote: (fingerprint: string) => string;
}

// ─── hook ────────────────────────────────────────────────────────────────────

/**
 * @param fingerprints  List of fingerprints for the currently-loaded game list.
 *                      Used only in guest mode to seed the state from localStorage.
 *                      Logged-in users always get ALL their notes, regardless.
 */
export function useLineNotes(fingerprints: string[]): UseLineNotesReturn {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Track the user id we last fetched for so we re-fetch on login/logout.
  const lastFetchedUidRef = useRef<string | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const uid = user?.id ?? null;

    if (uid) {
      // ── Logged-in: fetch all notes from Supabase ────────────────────────
      if (uid === lastFetchedUidRef.current) return; // already loaded for this user
      lastFetchedUidRef.current = uid;

      setLoading(true);
      supabase
        .from('line_notes')
        .select('fingerprint, note')
        .then(({ data, error }) => {
          if (!error && data) {
            const map: Record<string, string> = {};
            for (const row of data) {
              map[row.fingerprint] = row.note;
            }
            setNotes(map);
          }
          setLoading(false);
        });
    } else {
      // ── Guest: seed from localStorage using the supplied fingerprints ───
      lastFetchedUidRef.current = null;
      const map: Record<string, string> = {};
      for (const fp of fingerprints) {
        const n = getLineNote(fp);
        if (n) map[fp] = n;
      }
      setNotes(map);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Re-seed from localStorage when the game list changes (guest only) ────
  useEffect(() => {
    if (user) return; // Supabase already has everything; no re-seed needed.
    const map: Record<string, string> = {};
    for (const fp of fingerprints) {
      const n = getLineNote(fp);
      if (n) map[fp] = n;
    }
    setNotes(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprints, user]);

  // ── saveNote ─────────────────────────────────────────────────────────────
  const saveNote = useCallback(
    async (fingerprint: string, note: string) => {
      const trimmed = note.trim();

      // Optimistic update — UI is instant
      setNotes((prev) => {
        const next = { ...prev };
        if (trimmed) {
          next[fingerprint] = trimmed;
        } else {
          delete next[fingerprint];
        }
        return next;
      });

      if (user) {
        // Cloud save
        if (trimmed) {
          await supabase.from('line_notes').upsert(
            {
              user_id: user.id,
              fingerprint,
              note: trimmed,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,fingerprint' }
          );
        } else {
          // Empty note = delete the row
          await supabase
            .from('line_notes')
            .delete()
            .eq('user_id', user.id)
            .eq('fingerprint', fingerprint);
        }
      } else {
        // Guest: localStorage
        saveLineNote(fingerprint, note);
      }
    },
    [user]
  );

  // ── deleteNote ───────────────────────────────────────────────────────────
  const deleteNote = useCallback(
    async (fingerprint: string) => {
      // Optimistic update
      setNotes((prev) => {
        const next = { ...prev };
        delete next[fingerprint];
        return next;
      });

      if (user) {
        await supabase
          .from('line_notes')
          .delete()
          .eq('user_id', user.id)
          .eq('fingerprint', fingerprint);
      } else {
        deleteLineNote(fingerprint);
      }
    },
    [user]
  );

  // ── getNote ──────────────────────────────────────────────────────────────
  const getNote = useCallback(
    (fingerprint: string): string => notes[fingerprint] ?? '',
    [notes]
  );

  return { notes, loading, saveNote, deleteNote, getNote };
}
