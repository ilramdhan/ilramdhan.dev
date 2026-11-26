import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { BrandMark } from '@/app/layouts/chrome/Brand';
import { CHROME_ICON_BTN, CloseGlyph, MenuGlyph } from '@/app/layouts/chrome/controls';
import { useLenis } from '@/components/motion/SmoothScrollProvider';
import { Seo } from '@/components/seo/Seo';
import { confirmDiscard } from '@/features/admin/unsaved';
import { messageQueries } from '@/features/messages/queries';
import { Link } from '@/i18n/Link';
import { cn } from '@/lib/utils';

export interface AdminNavItem {
  /** URL segment (`/admin/<id>`); `overview` lives at `/admin`. */
  id: string;
  label: string;
  Tab: ComponentType;
}

const hrefOf = (id: string) => (id === 'overview' ? '/admin' : `/admin/${id}`);
const FOCUSABLE =
  'a[href]:not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),input:not([disabled])';

/** Unsaved edits ask before a link leaves the form. */
const guard = (e: MouseEvent) => {
  if (!confirmDiscard()) e.preventDefault();
};

/**
 * Dashboard chrome: a parchment sidebar from 834px (the public `nav:` breakpoint), below it a 44px bar with the
 * public sheet pattern (full-screen raised dialog, focus trapped, Esc closes, focus returns to the menu button).
 * The tab is the URL; a tab change moves focus to the new tab's heading.
 */
export function AdminLayout({ nav, item }: { nav: AdminNavItem[]; item: AdminNavItem }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLDivElement>(null);
  const { data: messages } = useQuery(messageQueries.list());
  const unread = messages?.filter((m) => !m.is_read).length ?? 0;

  // Focus the heading after a tab change (not on the first load: the skip link and page start stay first).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let tries = 0;
    const id = window.setInterval(() => {
      const h1 = main.current?.querySelector<HTMLElement>('h1');
      if (h1 || ++tries > 50) window.clearInterval(id);
      h1?.focus({ preventScroll: true });
    }, 40);
    window.scrollTo({ top: 0 });
    return () => window.clearInterval(id);
  }, [item.id]);

  const Tab = item.Tab;
  const links = (onPick?: () => void) => (
    <NavLinks nav={nav} current={item.id} unread={unread} onPick={onPick} />
  );

  return (
    <div className="flex min-h-svh bg-white text-ink">
      <Seo title={`${item.label} | Admin`} noindex />
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col overflow-y-auto bg-parchment px-4 py-6 nav:flex">
        <AdminBrand />
        <nav aria-label="Dashboard" className="mt-8 flex-1">
          {links()}
        </nav>
        <Footer />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-(--nav-h) items-center justify-between bg-white/80 px-(--gutter) backdrop-blur-xl backdrop-saturate-[1.8] nav:hidden">
          <AdminBrand />
          <button
            ref={trigger}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="admin-sheet"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className={cn(CHROME_ICON_BTN, '-mr-3')}
          >
            <MenuGlyph />
          </button>
        </header>
        <div ref={main} className="w-full max-w-[880px] px-(--gutter) py-8 nav:px-16 nav:py-12">
          <Suspense
            fallback={
              <p role="status" className="text-body text-ink-muted">
                Loading...
              </p>
            }
          >
            <Tab />
          </Suspense>
        </div>
      </div>

      {open && (
        <Sheet
          onClose={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
        >
          {links(() => setOpen(false))}
        </Sheet>
      )}
    </div>
  );
}

function AdminBrand() {
  return (
    <span className="flex items-center gap-2 px-3 text-body font-semibold text-ink">
      <BrandMark />
      Admin
    </span>
  );
}

function NavLinks({
  nav,
  current,
  unread,
  onPick,
}: {
  nav: AdminNavItem[];
  current: string;
  unread: number;
  onPick?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {nav.map((t) => {
        const active = t.id === current;
        const badge = t.id === 'messages' && unread > 0;
        return (
          <li key={t.id}>
            <Link
              to={hrefOf(t.id)}
              aria-current={active ? 'page' : undefined}
              onClick={(e) => {
                guard(e);
                if (!e.defaultPrevented) onPick?.();
              }}
              className={cn(
                'flex min-h-11 items-center justify-between gap-3 rounded-full px-4 text-body transition-colors duration-200',
                active ? 'bg-pill font-semibold text-pill-ink' : 'text-ink hover:bg-chip',
              )}
            >
              {t.label}
              {/* Name: "Messages 2 unread" (visible text first, WCAG 2.5.3). */}
              {badge && (
                <span
                  className={cn(
                    'min-w-6 rounded-full px-2 text-center text-fine tabular',
                    active ? 'bg-pill-ink text-pill' : 'bg-pill text-pill-ink',
                  )}
                >
                  {unread}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Back to the site and logout: the foot of the sidebar and of the sheet. ponytail: no appearance control here (the
 * dashboard follows the site's Light/Dark/Auto choice); importing ThemeSegmented re-splits the entry (+0.3 KiB on
 * every public route).
 */
function Footer() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = async () => {
    if (!confirmDiscard()) return;
    // Home first: AdminRoute also sends a deliberate logout home (F12 B1), never to /login.
    await logout();
    void navigate('/');
    toast.info('Logged out successfully');
  };
  return (
    <div className="mt-8 border-t border-rule pt-6">
      <div className="flex flex-col gap-1">
        <Link
          to="/"
          onClick={guard}
          className="flex min-h-11 items-center rounded-full px-4 text-body text-action hover:bg-chip"
        >
          Back to Website
        </Link>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="flex min-h-11 items-center rounded-full px-4 text-left text-body text-danger hover:bg-chip"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

/** The public MobileSheet pattern, scoped to the dashboard links. */
function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const { stop, start } = useLenis();
  useEffect(() => {
    onCloseRef.current = onClose;
  });
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
        const firstEl = els[0];
        const last = els[els.length - 1];
        if (!firstEl || !last) return;
        const inside = node?.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === firstEl || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    // Widening past the breakpoint shows the sidebar: close the sheet.
    const mql = window.matchMedia?.('(min-width: 52.125rem)');
    const onWide = (e: MediaQueryListEvent) => e.matches && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    mql?.addEventListener?.('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      mql?.removeEventListener?.('change', onWide);
    };
  }, []);

  return (
    <div
      ref={ref}
      id="admin-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Dashboard menu"
      data-lenis-prevent=""
      className="fixed inset-0 z-60 flex flex-col overflow-y-auto bg-raised px-(--gutter) pb-8 motion-safe:animate-page-in nav:hidden"
    >
      <div className="flex h-(--nav-h) shrink-0 items-center justify-between">
        <AdminBrand />
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className={cn(CHROME_ICON_BTN, '-mr-3')}
        >
          <CloseGlyph />
        </button>
      </div>
      <nav aria-label="Dashboard" className="mt-4 flex-1">
        {children}
      </nav>
      <Footer />
    </div>
  );
}
