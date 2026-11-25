import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useHydrated, useMediaQuery } from '@/lib/hooks';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  /** The theme currently applied (`system` resolved through the OS preference). */
  theme: ResolvedTheme;
  /** What the visitor chose; `system` ("Auto") follows the OS, live. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const STORAGE_KEY = 'theme';
const QUERY = '(prefers-color-scheme: dark)';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // storage unavailable
  }
  return 'system';
}

/**
 * Applies the theme to <html> (same mechanism as mutugading): `data-theme` forces Light or Dark,
 * no attribute = Auto (the CSS follows `prefers-color-scheme` on its own). The `dark` class
 * mirrors the resolved theme for code and tests that read it. index.html runs the same logic
 * before first paint (no flash); this keeps it in sync afterwards.
 */
function applyTheme(preference: ThemePreference, theme: ResolvedTheme) {
  const root = document.documentElement;
  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);
  root.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Prerendered HTML is built with `system`/light; the stored choice and the OS preference
  // arrive after hydration as transitions (see `useHydrated`). The inline script in
  // index.html has already painted the right theme, so nothing flashes.
  const hydrated = useHydrated();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const prefersDark = useMediaQuery(QUERY);
  const system: ResolvedTheme = prefersDark ? 'dark' : 'light';
  const theme: ResolvedTheme = preference === 'system' ? system : preference;

  useEffect(() => {
    const saved = readPreference();
    startTransition(() => setPreferenceState(saved));
  }, []);

  // Layout effect: the DOM is updated synchronously inside a View Transition callback.
  // Not while hydrating: the server value is a guess, the inline script already set the class.
  useLayoutEffect(() => {
    if (hydrated) applyTheme(preference, theme);
  }, [preference, theme, hydrated]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable: the choice lasts for this page view only
    }
  }, []);

  const value = useMemo(
    () => ({ theme, preference, setPreference }),
    [theme, preference, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
