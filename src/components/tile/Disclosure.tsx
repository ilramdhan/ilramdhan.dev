import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Disclosure: the ONE expand/collapse on the site (FAQ-style lists, experience rows, footer columns on phones, TOC).
 *
 * - Markup (WAI-ARIA APG accordion): a heading wrapping a <button aria-expanded aria-controls>, then a role="region"
 *   panel labelled by the button. The content is always in the prerendered HTML.
 * - Motion: the panel animates grid rows 0fr <-> 1fr both ways (300ms, ease-apple), the content fades, the chevron
 *   turns 180deg. CSS in global.css ([data-disclosure-panel]); reduced motion = instant.
 * - Single-open: every Disclosure inside one <DisclosureGroup> shares one open id. Outside a group a row is
 *   independent (or fully controlled with `open` + `onOpenChange`).
 * - Closed content is `hidden="until-found"` once hydrated (find-in-page opens the row via `beforematch`) and
 *   `visibility: hidden` before hydration, so it is never in the tab order while closed.
 * - Deep links: a row with an `id` opens when the URL hash names it.
 */

type GroupContext = {
  openId: string | null;
  setOpenId: (update: (current: string | null) => string | null) => void;
  staticFrom?: 'nav';
};

const DisclosureContext = createContext<GroupContext | null>(null);

export type DisclosureGroupProps = ComponentPropsWithoutRef<'div'> & {
  /** id of the row open on first render (default: none). */
  defaultOpenId?: string | null;
  /**
   * "nav": from 834px every row renders as a plain, always-open column (heading text instead of the button);
   * below it the rows are disclosures (footer link columns).
   */
  staticFrom?: 'nav';
};

/** Single-open group: opening one row closes the others. */
export function DisclosureGroup({
  defaultOpenId = null,
  staticFrom,
  children,
  ...rest
}: DisclosureGroupProps) {
  const [openId, setOpenIdState] = useState<string | null>(defaultOpenId);
  const setOpenId = useCallback(
    (update: (current: string | null) => string | null) => setOpenIdState(update),
    [],
  );
  return (
    <DisclosureContext.Provider value={{ openId, setOpenId, staticFrom }}>
      <div data-disclosure-group="" data-disclosure-static={staticFrom} {...rest}>
        {children}
      </div>
    </DisclosureContext.Provider>
  );
}

type DataAttrs = { [key: `data-${string}`]: string | undefined };

export type DisclosureProps = {
  /** Stable id: the group's open state, deep links (#id) and the row's DOM id. */
  id?: string;
  /** The row title (inside the button). */
  summary: ReactNode;
  /** The content. Always rendered; hidden from view and AT while closed. */
  children: ReactNode;
  /** Uncontrolled initial state (only outside a group; inside one use the group's `defaultOpenId`). */
  defaultOpen?: boolean;
  /** Controlled state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Heading element that wraps the button (APG). Default h3. */
  heading?: 'h2' | 'h3' | 'h4' | 'div';
  /** bare = no row rules and no row padding (the caller styles the trigger). Default: rows with 1px rules. */
  bare?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  iconClassName?: string;
  /** Extra data-* hooks for QA / SEO scripts. */
  itemAttrs?: DataAttrs;
  triggerAttrs?: DataAttrs;
  contentAttrs?: DataAttrs;
};

const REDUCED = '(prefers-reduced-motion: reduce)';

export function Disclosure({
  id,
  summary,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  heading: Heading = 'h3',
  bare,
  className,
  triggerClassName,
  contentClassName,
  iconClassName,
  itemAttrs,
  triggerAttrs,
  contentAttrs,
}: DisclosureProps) {
  const group = useContext(DisclosureContext);
  const uid = useId();
  const key = id ?? uid;
  const [own, setOwn] = useState(defaultOpen);
  const open = openProp ?? (group ? group.openId === key : own);
  const staticMode = group?.staticFrom === 'nav';
  const panelRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp !== undefined) return;
      if (group) group.setOpenId((current) => (next ? key : current === key ? null : current));
      else setOwn(next);
    },
    [group, key, onOpenChange, openProp],
  );

  // Opening: drop `hidden` before paint so the rows transition from 0fr with the content already laid out.
  useLayoutEffect(() => {
    if (staticMode) return;
    if (open) clipRef.current?.removeAttribute('hidden');
  }, [open, staticMode]);

  // Closing: after the height transition, hide the content until found (find-in-page reopens it).
  useEffect(() => {
    const clip = clipRef.current;
    const panel = panelRef.current;
    if (!clip || !panel || staticMode) return;
    panel.dataset.hydrated = '';
    const first = !mounted.current;
    mounted.current = true;
    if (open) return;
    const delay = first || window.matchMedia?.(REDUCED).matches ? 0 : 320;
    const t = window.setTimeout(() => clip.setAttribute('hidden', 'until-found'), delay);
    return () => window.clearTimeout(t);
  }, [open, staticMode]);

  // find-in-page match inside a closed row, and #id deep links.
  useEffect(() => {
    const clip = clipRef.current;
    if (!clip || staticMode) return;
    const onMatch = () => setOpen(true);
    const onHash = () => {
      if (id && window.location.hash === `#${id}`) setOpen(true);
    };
    clip.addEventListener('beforematch', onMatch);
    window.addEventListener('hashchange', onHash);
    const t = window.setTimeout(onHash, 0);
    return () => {
      clip.removeEventListener('beforematch', onMatch);
      window.removeEventListener('hashchange', onHash);
      window.clearTimeout(t);
    };
  }, [id, setOpen, staticMode]);

  const btnId = `${key}-trigger`.replace(/:/g, '');
  const panelId = `${key}-panel`.replace(/:/g, '');

  return (
    <div
      id={id}
      data-disclosure=""
      data-open={open ? '' : undefined}
      className={cn(
        'scroll-mt-(--nav-h)',
        !bare && 'border-b border-rule first:border-t',
        className,
      )}
      {...itemAttrs}
    >
      <Heading className="m-0">
        {staticMode ? <span className="max-nav:hidden">{summary}</span> : null}
        <button
          type="button"
          id={btnId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
          className={cn(
            'flex min-h-11 w-full cursor-pointer items-center justify-between gap-6 text-left',
            !bare && 'py-5',
            staticMode && 'nav:hidden',
            triggerClassName,
          )}
          {...triggerAttrs}
        >
          <span className="min-w-0">{summary}</span>
          <DisclosureChevron open={open} className={iconClassName} />
        </button>
      </Heading>
      <div
        ref={panelRef}
        id={panelId}
        // A static column (>= 834px footer) is not a region landmark; a real disclosure panel is.
        role={staticMode ? undefined : 'region'}
        aria-labelledby={staticMode ? undefined : btnId}
        data-disclosure-panel=""
        data-open={open ? '' : undefined}
      >
        <div ref={clipRef} data-disclosure-clip="">
          <div data-disclosure-content="" className={contentClassName} {...contentAttrs}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Drawn chevron that turns 180deg when open (300ms, ease-apple; instant under reduced motion). */
export function DisclosureChevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 14 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'h-2 w-3.5 shrink-0 text-tile-action transition-[rotate] duration-300 ease-apple motion-reduce:transition-none',
        open && 'rotate-180',
        className,
      )}
    >
      <path d="m1.5 1.5 5.5 5 5.5-5" />
    </svg>
  );
}
