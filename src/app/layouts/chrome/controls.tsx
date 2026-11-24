import type { MouseEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { loadLocale, LOCALES, useLocale, useT } from '@/i18n';
import { useHydrated } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { samePageIn } from './nav-items';

/** 44px icon button for chrome utilities (menu, close, theme). No fill, no ring: the glyph is the button. */
export const CHROME_ICON_BTN =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink/80 transition-[color] duration-200 hover:text-ink';

/** Drawn 2-line menu glyph (Apple's hamburger is two strokes, not three). */
export function MenuGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className={cn('size-[18px]', className)}
    >
      <path d="M2.5 6.5h13M2.5 11.5h13" />
    </svg>
  );
}

export function CloseGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className={cn('size-[18px]', className)}
    >
      <path d="m4 4 10 10M14 4 4 14" />
    </svg>
  );
}

/**
 * Language switch (mutugading LocaleSwitcher): real links to the same page in the other locale (crawlable, work
 * without JS). A click loads that locale's dictionary first, then navigates client-side, so the page never renders
 * half-translated. `bar` = "EN / ID" codes at 12px; `names` = full language names (sheet, footer). Each link's
 * accessible name starts with its visible text (WCAG 2.5.3).
 */
export function LocaleSwitcher({
  variant = 'bar',
  className,
}: {
  variant?: 'bar' | 'names';
  className?: string;
}) {
  const active = useLocale();
  const location = useLocation();
  // Prerendered HTML has no search/hash; add them once hydrated so the first client render matches the markup.
  const hydrated = useHydrated();
  const loc = hydrated ? location : { ...location, search: '', hash: '' };
  const navigate = useNavigate();
  const t = useT().nav;
  const items: ReactNode[] = [];
  LOCALES.forEach((l, i) => {
    const on = l === active;
    const href = samePageIn(l, loc);
    const name = t.localeName[l];
    if (i > 0)
      items.push(
        <span key={`sep-${l}`} aria-hidden="true" className="text-ink/30 select-none">
          /
        </span>,
      );
    const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (on) return;
      try {
        localStorage.setItem('locale-preference', l);
      } catch {
        // storage unavailable: the banner may ask again next visit
      }
      void loadLocale(l).then(() => navigate(href));
    };
    items.push(
      <a
        key={l}
        href={href}
        hrefLang={l}
        lang={l}
        aria-current={on ? 'true' : undefined}
        onClick={onClick}
        onPointerEnter={() => void loadLocale(l)}
        data-locale-link={l}
        className={cn(
          'inline-flex min-h-11 items-center justify-center transition-[color] duration-200',
          variant === 'bar' ? 'min-w-11' : 'px-0.5',
          on ? 'text-ink' : 'text-ink-muted hover:text-ink',
        )}
      >
        {variant === 'bar' ? (
          <>
            {l.toUpperCase()}
            <span className="sr-only"> {name}</span>
          </>
        ) : (
          name
        )}
      </a>,
    );
  });
  return (
    <nav
      aria-label={t.switchLocale}
      className={cn(
        'flex items-center',
        variant === 'bar' ? '-mx-1.5 text-fine' : 'gap-1',
        className,
      )}
    >
      {items}
    </nav>
  );
}
