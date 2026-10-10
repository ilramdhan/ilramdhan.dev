import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/ThemeContext';

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

/**
 * Theme button. Where the View Transitions API exists and motion is allowed, the new
 * theme is revealed as a circle growing from the button; otherwise it switches instantly.
 * The icon rotates (CSS, motion-safe) on every change.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const doc = document as ViewTransitionDoc;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) {
      toggleTheme();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = doc.startViewTransition(() => flushSync(toggleTheme));
    void transition.ready
      .then(() =>
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 400, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        ),
      )
      .catch(() => undefined);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors active:scale-[0.96]"
    >
      <span key={theme} className="block motion-safe:animate-icon-spin">
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </span>
    </button>
  );
}
