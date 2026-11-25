import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { useTheme, type ThemePreference } from '@/app/ThemeContext';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { CHROME_ICON_BTN } from './controls';

/** Menu order (mutugading THEME_CHOICES). `system` is shown as "Auto". */
const CHOICES: readonly ThemePreference[] = ['light', 'dark', 'system'];
const KEY = { light: 'light', dark: 'dark', system: 'auto' } as const;

let switchTimer: number | undefined;
let reveal: ViewTransition | undefined;

/**
 * Picks a theme. With View Transitions the new theme grows as a circle from `from`'s centre (`html.theme-vt`,
 * global.css; the class scopes it, route fades are untouched). Without: a one-off colour cross-fade
 * (`html.theme-switching`). Reduced motion: instant.
 */
function useChoose() {
  const { setPreference } = useTheme();
  return (choice: ThemePreference, from?: Element | null) => {
    const root = document.documentElement;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setPreference(choice);
    if (!document.startViewTransition) {
      root.classList.add('theme-switching');
      window.clearTimeout(switchTimer);
      switchTimer = window.setTimeout(() => root.classList.remove('theme-switching'), 400);
      return setPreference(choice);
    }
    const r = from?.getBoundingClientRect();
    // CSSOM custom properties, not an inline <style>: no CSP hash needed.
    root.style.setProperty('--vt-x', `${r ? r.left + r.width / 2 : innerWidth / 2}px`);
    root.style.setProperty('--vt-y', `${r ? r.top + r.height / 2 : 0}px`);
    root.classList.add('theme-vt');
    const vt = (reveal = document.startViewTransition(() =>
      flushSync(() => setPreference(choice)),
    ));
    void vt.finished.finally(() => {
      if (reveal === vt) root.classList.remove('theme-vt');
    });
  };
}

/** Drawn glyphs, one stroke weight with the other chrome icons (1.4). */
export function ThemeGlyph({ choice, className }: { choice: ThemePreference; className?: string }) {
  const cls = cn('size-[17px] shrink-0', className);
  if (choice === 'light')
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className={cls}
      >
        <circle cx="9" cy="9" r="3.25" />
        <path d="M9 1.75v1.5M9 14.75v1.5M1.75 9h1.5M14.75 9h1.5M3.87 3.87l1.06 1.06M13.07 13.07l1.06 1.06M3.87 14.13l1.06-1.06M13.07 4.93l1.06-1.06" />
      </svg>
    );
  if (choice === 'dark')
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        className={cls}
      >
        <path d="M15.25 10.6A6.5 6.5 0 0 1 7.4 2.75a6.5 6.5 0 1 0 7.85 7.85Z" />
      </svg>
    );
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={cls}
    >
      <circle cx="9" cy="9" r="6.25" />
      <path d="M9 2.75a6.25 6.25 0 0 1 0 12.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Nav appearance control (>= 834px, mutugading ThemeMenu): a 44px icon button showing the current choice; it opens a
 * small parchment menu of three radio items (Light / Dark / Auto). Arrows / Home / End move, Enter / Space picks,
 * Esc or Tab closes and focus returns to the button.
 */
export function ThemeMenu({ className }: { className?: string }) {
  const t = useT().theme;
  const { preference } = useTheme();
  const choose = useChoose();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    items.current[Math.max(0, CHOICES.indexOf(preference))]?.focus();
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
    // focus only when the menu opens, not when the theme changes underneath it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  };
  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = CHOICES.length;
    const cur = items.current.findIndex((el) => el === document.activeElement);
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = (cur + 1) % n;
    else if (e.key === 'ArrowUp') next = (cur - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    } else if (e.key === 'Tab') {
      close(false);
      return;
    }
    if (next === null) return;
    e.preventDefault();
    items.current[next]?.focus();
  };

  return (
    <div ref={wrap} className={cn('relative', className)}>
      <button
        ref={btn}
        type="button"
        aria-label={t.current(t[KEY[preference]])}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-theme-toggle=""
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={CHROME_ICON_BTN}
      >
        <ThemeGlyph choice={preference} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={t.label}
          onKeyDown={onMenuKey}
          className="absolute top-full right-0 z-10 mt-1 flex w-44 flex-col rounded-lg bg-parchment p-1.5 motion-safe:animate-menu-in"
        >
          {CHOICES.map((c, i) => (
            <button
              key={c}
              ref={(el) => {
                items.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={preference === c}
              tabIndex={-1}
              onClick={() => {
                choose(c, btn.current);
                close();
              }}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-caption transition-colors duration-200',
                preference === c ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              <ThemeGlyph choice={c} />
              <span className="flex-1">{t[KEY[c]]}</span>
              {preference === c ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5 text-action"
                >
                  <path d="m3.5 8.5 3 3 6-7" />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Mobile sheet appearance control: a labelled radio group with the three choices as words (parchment track,
 * page-surface thumb). Arrow keys move and pick.
 */
export function ThemeSegmented({ className }: { className?: string }) {
  const t = useT().theme;
  const { preference } = useTheme();
  const choose = useChoose();
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = CHOICES.length;
    const cur = CHOICES.indexOf(preference);
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? (cur + 1) % n
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? (cur - 1 + n) % n
          : null;
    if (next === null) return;
    e.preventDefault();
    choose(CHOICES[next]!, refs.current[next]);
    refs.current[next]?.focus();
  };
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p id={labelId} className="text-fine text-ink-muted">
        {t.label}
      </p>
      <div
        role="radiogroup"
        tabIndex={-1}
        aria-labelledby={labelId}
        onKeyDown={onKey}
        className="grid grid-cols-3 rounded-full bg-parchment p-1"
      >
        {CHOICES.map((c, i) => {
          const on = preference === c;
          return (
            <button
              key={c}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={(e) => choose(c, e.currentTarget)}
              className={cn(
                'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-caption transition-colors duration-200',
                on ? 'bg-thumb font-semibold text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              <ThemeGlyph choice={c} className="size-4" />
              {t[KEY[c]]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
