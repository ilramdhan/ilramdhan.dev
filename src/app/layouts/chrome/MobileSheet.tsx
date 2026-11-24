import { useEffect, useRef } from 'react';
import { useLenis } from '@/components/motion/SmoothScrollProvider';
import { Link } from '@/i18n/Link';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { BRAND_NAME, type NavItem } from './nav-items';
import { BrandLogo } from './Brand';
import { CHROME_ICON_BTN, CloseGlyph, LocaleSwitcher } from './controls';
import { ThemeSegmented } from './ThemeControls';

const FOCUSABLE =
  'a[href]:not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"])';
const DESKTOP = '(min-width: 52.125rem)';

/**
 * Mobile sheet (< 834px, mutugading MobileSheet): a full-screen raised dialog. Sections at 28px (no drill-down: no
 * section has children), then language names and the appearance control. Focus is trapped, Esc closes, page scroll
 * is locked and Lenis stopped while open, and the parent returns focus to the hamburger. A navigation unmounts it.
 */
export function MobileSheet({
  items,
  isActive,
  isAdmin,
  onClose,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const t = useT().nav;
  const { stop, start } = useLenis();
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Lenis + body scroll follow the sheet's lifetime (route change unmounts it, which starts them again).
  useEffect(() => {
    stop();
    return start;
  }, [stop, start]);

  useEffect(() => {
    const node = ref.current;
    const list = () => Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    list()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const els = list();
        const first = els[0];
        const last = els[els.length - 1];
        if (!first || !last) return;
        const inside = node?.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === first || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    // Widening past the breakpoint hides the sheet (CSS); close it so scroll comes back.
    const mql = window.matchMedia?.(DESKTOP);
    const onWide = (e: MediaQueryListEvent) => e.matches && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    mql?.addEventListener?.('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      mql?.removeEventListener?.('change', onWide);
    };
  }, []);

  const big =
    'flex min-h-12 w-full items-center text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-ink';

  return (
    <div
      ref={ref}
      id="mobile-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={t.menu}
      data-lenis-prevent=""
      className="fixed inset-0 z-60 flex flex-col bg-raised motion-safe:animate-page-in nav:hidden"
    >
      <div className="wrap flex h-(--nav-h) shrink-0 items-center justify-between">
        <Link
          to="/"
          aria-label={t.homeLink(BRAND_NAME)}
          className="inline-flex min-h-11 items-center rounded-xs"
        >
          <BrandLogo />
        </Link>
        <button
          type="button"
          aria-label={t.closeMenu}
          onClick={onClose}
          className={cn(CHROME_ICON_BTN, '-mr-3')}
        >
          <CloseGlyph />
        </button>
      </div>

      <nav
        aria-label={t.mainNav}
        className="wrap flex-1 overflow-y-auto overscroll-contain pt-4 pb-8"
      >
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={big}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {isAdmin ? (
            <li>
              <Link to="/admin" className={big}>
                {t.dashboard}
              </Link>
            </li>
          ) : null}
        </ul>
        <div className="mt-10 flex flex-col gap-6">
          <LocaleSwitcher variant="names" className="gap-2 text-caption" />
          <ThemeSegmented className="max-w-sm" />
        </div>
      </nav>
    </div>
  );
}
