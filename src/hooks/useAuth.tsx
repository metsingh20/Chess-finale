import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface GuestLimits {
  openingsUsed: Set<number>;
  linesUsed: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  guestLimits: GuestLimits;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  trackOpeningUsage: (gameIndex: number) => boolean;
  trackLineUpload: () => boolean;
  canUseOpening: (gameIndex: number) => boolean;
  canUploadLine: () => boolean;
  getOpeningsRemaining: () => number;
  getLinesRemaining: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_OPENINGS_LIMIT = 5;
const GUEST_LINES_LIMIT = 5;
const GUEST_STORAGE_KEY = 'royal-chess-guest-limits';

function loadGuestLimits(): GuestLimits {
  const stored = localStorage.getItem(GUEST_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        openingsUsed: new Set(parsed.openingsUsed || []),
        linesUsed: parsed.linesUsed || 0,
      };
    } catch {
      return { openingsUsed: new Set(), linesUsed: 0 };
    }
  }
  return { openingsUsed: new Set(), linesUsed: 0 };
}

function saveGuestLimits(limits: GuestLimits) {
  const toSave = {
    openingsUsed: Array.from(limits.openingsUsed),
    linesUsed: limits.linesUsed,
  };
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(toSave));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestLimits, setGuestLimits] = useState<GuestLimits>(loadGuestLimits());

  useEffect(() => {
    // Check for existing guest mode
    const guestMode = localStorage.getItem('royal-chess-guest-mode');
    if (guestMode === 'true' && !user) {
      setIsGuest(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Clear guest mode when user signs in
        if (session?.user) {
          setIsGuest(false);
          localStorage.removeItem('royal-chess-guest-mode');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setIsGuest(false);
        localStorage.removeItem('royal-chess-guest-mode');
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setIsGuest(false);
      localStorage.removeItem('royal-chess-guest-mode');
    }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    localStorage.removeItem('royal-chess-guest-mode');
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setLoading(false);
    localStorage.setItem('royal-chess-guest-mode', 'true');
  };

  const trackOpeningUsage = (gameIndex: number): boolean => {
    if (!isGuest) return true;
    
    const newLimits = { ...guestLimits };
    newLimits.openingsUsed.add(gameIndex);
    setGuestLimits(newLimits);
    saveGuestLimits(newLimits);
    return true;
  };

  const trackLineUpload = (): boolean => {
    if (!isGuest) return true;
    
    if (guestLimits.linesUsed >= GUEST_LINES_LIMIT) {
      return false;
    }
    
    const newLimits = {
      ...guestLimits,
      linesUsed: guestLimits.linesUsed + 1,
    };
    setGuestLimits(newLimits);
    saveGuestLimits(newLimits);
    return true;
  };

  const canUseOpening = (gameIndex: number): boolean => {
    if (!isGuest) return true;
    
    // If already used, allow
    if (guestLimits.openingsUsed.has(gameIndex)) {
      return true;
    }
    
    // Check if under limit
    return guestLimits.openingsUsed.size < GUEST_OPENINGS_LIMIT;
  };

  const canUploadLine = (): boolean => {
    if (!isGuest) return true;
    return guestLimits.linesUsed < GUEST_LINES_LIMIT;
  };

  const getOpeningsRemaining = (): number => {
    if (!isGuest) return Infinity;
    return GUEST_OPENINGS_LIMIT - guestLimits.openingsUsed.size;
  };

  const getLinesRemaining = (): number => {
    if (!isGuest) return Infinity;
    return GUEST_LINES_LIMIT - guestLimits.linesUsed;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isGuest,
      guestLimits,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      trackOpeningUsage,
      trackLineUpload,
      canUseOpening,
      canUploadLine,
      getOpeningsRemaining,
      getLinesRemaining,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}