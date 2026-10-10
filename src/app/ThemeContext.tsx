import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  /** The theme currently applied (`system` resolved through the OS preference). */
  theme: ResolvedTheme;
  /** What the visitor chose; `system` follows the OS. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Cycles dark -> light -> system. */
  toggleTheme: () => void;
}

const STORAGE_KEY = 'theme';
const QUERY = '(prefers-color-scheme: dark)';
const CYCLE: Record<ThemePreference, ThemePreference> = {
  dark: 'light',
  light: 'system',
  system: 'dark',
};

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

const systemTheme = (): ResolvedTheme =>
  typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches ? 'dark' : 'light';

/**
 * Applies the theme to <html>. index.html runs the same logic before first paint
 * (no flash); this keeps it in sync afterwards.
 */
function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);
  const theme: ResolvedTheme = preference === 'system' ? system : preference;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(QUERY);
    const onChange = () => setSystem(media.matches ? 'dark' : 'light');
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => applyTheme(theme), [theme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable: the choice lasts for this page view only
    }
  }, []);

  const toggleTheme = useCallback(
    () => setPreference(CYCLE[preference]),
    [preference, setPreference],
  );

  const value = useMemo(
    () => ({ theme, preference, setPreference, toggleTheme }),
    [theme, preference, setPreference, toggleTheme],
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
