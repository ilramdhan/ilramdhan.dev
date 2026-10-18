import { createContext, startTransition, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/lazy';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Whether this browser may hold a Supabase session: a stored `sb-<project>-auth-token`
 * (supabase-js's default storage key) or an OAuth redirect carrying tokens/an error.
 */
function hasSessionHint(): boolean {
  try {
    if (
      /[#&?](access_token|refresh_token|error_description|code)=/.test(
        location.hash + location.search,
      )
    ) {
      return true;
    }
    for (let i = 0; i < localStorage.length; i++) {
      if (/^sb-.+-auth-token$/.test(localStorage.key(i) ?? '')) return true;
    }
    return false;
  } catch {
    // Storage blocked: let supabase-js decide.
    return true;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Visitors without a stored session (almost everyone) never need the Supabase client
    // for auth, so it isn't downloaded for them (T-58): signed out, done.
    if (!hasSessionHint()) {
      startTransition(() => setIsLoading(false));
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void getSupabase().then(async (supabase) => {
      if (cancelled) return;
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        startTransition(() => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        });
      });
      unsubscribe = () => authListener.subscription.unsubscribe();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // A transition: the page may still be hydrating (T-35, see `useHydrated`).
      startTransition(() => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const login = async () => {
    const supabase = await getSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
    });
  };

  const logout = async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
