import { flushSync } from 'react-dom';
import { Moon, Sun, SunMoon } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/app/ThemeContext';
import { useT } from '@/i18n';

/** What a click switches to (ThemeContext cycles dark -> light -> auto). */
const NEXT: Record<
  ThemePreference,
  { label: 'toLight' | 'toSystem' | 'toDark'; Icon: typeof Sun }
> = {
  dark: { label: 'toLight', Icon: Sun },
  light: { label: 'toSystem', Icon: SunMoon },
  system: { label: 'toDark', Icon: Moon },
};

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

/**
 * Theme button: cycles Dark -> Light -> Auto (the icon shows what a click selects). Where the View Transitions API exists and motion is allowed, the new
 * theme is revealed as a circle growing from the button; otherwise it switches instantly.
 * The icon rotates (CSS, motion-safe) on every change.
 */
export function ThemeToggle() {
  const { preference, toggleTheme } = useTheme();
  const t = useT();
  const { label: labelKey, Icon } = NEXT[preference];
  const label = t.theme[labelKey];

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
      aria-label={label}
      className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-on-dark/5 transition-colors active:scale-[0.96]"
    >
      <span key={preference} className="block motion-safe:animate-icon-spin">
        <Icon className="h-5 w-5" />
      </span>
    </button>
  );
}
