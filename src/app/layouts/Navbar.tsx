import { useEffect, useRef, useState, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { prefetchRoute } from '@/app/prefetch';
import { Link } from '@/i18n/Link';
import { splitLocale, useT } from '@/i18n';
import { useIsAdmin } from '@/lib/useIsAdmin';
import { cn } from '@/lib/utils';
import { BrandLogo } from './chrome/Brand';
import { CHROME_ICON_BTN, LocaleSwitcher, MenuGlyph } from './chrome/controls';
import { MobileSheet } from './chrome/MobileSheet';
import { BRAND_NAME, useNavItems } from './chrome/nav-items';
import { ThemeMenu } from './chrome/ThemeControls';

/** Past this scroll depth the nav name retracts into the mark (mutugading P16); back above it, it expands. */
const BRAND_COLLAPSE_AT = 48;

/**
 * Flags the header with `data-brand-collapsed` once the page is scrolled past BRAND_COLLAPSE_AT. Reads the window
 * scroll position (Lenis drives the native position, so this follows it too) at most once a frame and writes an
 * attribute, not React state: the nav never re-renders while scrolling. CSS does the rest (global.css `.brand-name`).
 */
function useBrandCollapse(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      el.toggleAttribute('data-brand-collapsed', window.scrollY > BRAND_COLLAPSE_AT);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}

/** Admin pill (12px, drawn at 28px inside a 44px target). Only for allowlisted admins (T-08). */
function DashboardPill({ className }: { className?: string }) {
  const t = useT().nav;
  return (
    <Link
      to="/admin"
      onMouseEnter={() => prefetchRoute('/admin')}
      onFocus={() => prefetchRoute('/admin')}
      className={cn(
        'group/pill inline-flex min-h-11 shrink-0 items-center justify-center text-fine whitespace-nowrap',
        className,
      )}
    >
      <span className="inline-flex h-7 items-center justify-center rounded-full bg-pill px-3 text-pill-ink transition-[background-color,scale] duration-200 group-hover/pill:bg-pill-hover group-active/pill:scale-[0.98] motion-reduce:transition-none">
        {t.dashboard}
      </span>
    </Link>
  );
}

/**
 * Global nav (mutugading StickyMegaNavbar): one slim translucent bar, 44px (--nav-h). >= 834px: brand, 12px section
 * links, appearance menu, EN / ID. < 834px: brand and a hamburger that opens the full-screen sheet.
 */
export function Navbar() {
  const t = useT().nav;
  const { pathname, key } = useLocation();
  const path = splitLocale(pathname).path;
  const { isAdmin } = useIsAdmin();
  const items = useNavItems();
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useBrandCollapse(headerRef);

  const [open, setOpen] = useState(false);
  // Close the sheet on any navigation, `/#contact` on home included (adjust state during render; no effect needed).
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setOpen(false);
  }

  const isActive = (href: string) =>
    !href.includes('#') && href !== '/' && (path === href || path.startsWith(`${href}/`));
  const navLink =
    'relative inline-flex h-11 items-center px-2 text-fine tracking-[-0.01em] transition-[color] duration-200 lg:px-2.5';

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50" data-site-nav="">
      <div className="nav-glass h-(--nav-h) bg-white/80 backdrop-blur-xl backdrop-saturate-[1.8]">
        <div className="wrap flex h-full items-center">
          <Link
            to="/"
            aria-label={t.homeLink(BRAND_NAME)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-xs"
          >
            <BrandLogo />
          </Link>

          <nav aria-label={t.mainNav} className="flex flex-1 justify-center max-nav:hidden">
            <ul className="flex items-center lg:gap-2 xl:gap-4">
              {items.map((item) => {
                const current = isActive(item.href);
                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      aria-current={current ? 'page' : undefined}
                      onMouseEnter={() => prefetchRoute(item.href)}
                      onFocus={() => prefetchRoute(item.href)}
                      className={cn(navLink, current ? 'text-ink' : 'text-ink/80 hover:text-ink')}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex shrink-0 items-center nav:ml-0">
            <ThemeMenu className="max-nav:hidden" />
            <LocaleSwitcher className="mr-1 max-nav:hidden" />
            {isAdmin ? <DashboardPill className="max-nav:hidden" /> : null}
            <button
              ref={triggerRef}
              type="button"
              aria-label={t.openMenu}
              aria-expanded={open}
              aria-controls="mobile-sheet"
              aria-haspopup="dialog"
              data-mobile-menu-trigger=""
              onClick={() => setOpen(true)}
              className={cn(CHROME_ICON_BTN, '-mr-3 nav:hidden')}
            >
              <MenuGlyph />
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <MobileSheet
          items={items}
          isActive={isActive}
          isAdmin={isAdmin}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      ) : null}
    </header>
  );
}
