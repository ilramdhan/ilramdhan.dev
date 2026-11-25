import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Disclosure } from '@/components/tile/Disclosure';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import type { TocHeading } from './toc';

/**
 * Id of the heading the reader is in: the last one scrolled past the top third of the
 * viewport. Headings are looked up on every (rAF-throttled) scroll rather than observed
 * once, because the lazily loaded GFM renderer can replace the article's elements.
 */
function useActiveHeading(idsKey: string): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const ids = idsKey.split('\n');
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight / 3) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [idsKey]);
  return active;
}

function TocList({
  headings,
  active,
  onPick,
}: {
  headings: TocHeading[];
  active?: string | null;
  onPick?: () => void;
}) {
  const list = useRef<HTMLOListElement>(null);
  const [marker, setMarker] = useState<{ y: number; h: number } | null>(null);
  // The marker is one bar that slides (transform) to the active link, instead of a border that swaps.
  useEffect(() => {
    const link = list.current?.querySelector<HTMLElement>('[aria-current="location"]');
    setMarker(link ? { y: link.offsetTop, h: link.offsetHeight } : null);
  }, [active]);
  return (
    <ol ref={list} className="relative flex flex-col border-l-2 border-rule">
      {marker && (
        <li
          aria-hidden="true"
          data-toc-marker=""
          className="pointer-events-none absolute -left-0.5 top-0 w-0.5 bg-action transition-transform duration-300 ease-apple motion-reduce:transition-none"
          style={{ height: marker.h, transform: `translateY(${marker.y}px)` }}
        />
      )}
      {headings.map((h) => (
        <li key={h.id}>
          {/* Router link (PUSH with a hash): ScrollManager scrolls to the heading. A plain
              `#id` anchor would reach the router as a POP and restore the old position. */}
          <Link
            to={{ hash: h.id }}
            onClick={onPick}
            aria-current={active === h.id ? 'location' : undefined}
            className={cn(
              'flex min-h-11 items-center py-1 text-caption transition-colors focus-visible:outline-2 focus-visible:outline-tile-action',
              h.level === 3 ? 'pl-8' : 'pl-4',
              active === h.id
                ? 'font-semibold text-tile-ink'
                : 'text-tile-muted hover:text-tile-ink',
            )}
          >
            {h.text}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/**
 * Sticky "On this page" rail (lg+): the list scrolls inside the viewport-high aside, and the heading being read is
 * kept in view by moving the aside's own scroll (never the page's).
 */
export function TocSidebar({ headings }: { headings: TocHeading[] }) {
  const TITLE = useT().article.onThisPage;
  const active = useActiveHeading(headings.map((h) => h.id).join('\n'));
  const aside = useRef<HTMLElement>(null);
  useEffect(() => {
    const box = aside.current;
    const link = box?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!box || !link || box.scrollHeight <= box.clientHeight) return;
    const b = box.getBoundingClientRect();
    const l = link.getBoundingClientRect();
    if (l.top < b.top || l.bottom > b.bottom)
      box.scrollTo({ top: box.scrollTop + l.top - b.top - b.height / 2, behavior: 'instant' });
  }, [active]);
  return (
    <aside
      ref={aside}
      className="sticky top-[calc(var(--nav-h)+1.5rem)] hidden max-h-[calc(100dvh-var(--nav-h)-3rem)] overflow-y-auto overscroll-contain lg:block"
    >
      <nav aria-label={TITLE} className="w-full">
        <p className="mb-3 text-caption font-semibold text-tile-ink">{TITLE}</p>
        <TocList headings={headings} active={active} />
      </nav>
    </aside>
  );
}

/** Collapsible "On this page" list above the article (below lg): the shared Disclosure, parchment panel. */
export function TocDisclosure({ headings }: { headings: TocHeading[] }) {
  const TITLE = useT().article.onThisPage;
  const [open, setOpen] = useState(false);
  const active = useActiveHeading(headings.map((h) => h.id).join('\n'));
  return (
    <Disclosure
      open={open}
      onOpenChange={setOpen}
      heading="div"
      bare
      summary={TITLE}
      className="mb-8 rounded-lg bg-parchment lg:hidden"
      triggerClassName="min-h-12 px-4 text-caption font-semibold text-ink"
    >
      <nav aria-label={TITLE} className="px-4 pb-3">
        <TocList headings={headings} active={active} onPick={() => setOpen(false)} />
      </nav>
    </Disclosure>
  );
}
