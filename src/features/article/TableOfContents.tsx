import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
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

function TocList({ headings, active }: { headings: TocHeading[]; active?: string | null }) {
  return (
    <ol className="space-y-1 text-sm">
      {headings.map((h) => (
        <li key={h.id} className={h.level === 3 ? 'pl-5' : undefined}>
          {/* Router link (PUSH with a hash): ScrollManager scrolls to the heading. A plain
              `#id` anchor would reach the router as a POP and restore the old position. */}
          <Link
            to={{ hash: h.id }}
            aria-current={active === h.id ? 'location' : undefined}
            className={cn(
              'block border-l-2 py-1 px-3 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400',
              active === h.id
                ? 'border-indigo-600 font-medium text-indigo-600 dark:text-indigo-400'
                : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-400',
            )}
          >
            {h.text}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Classes for the `<aside>` wrapping `TocSidebar`: the sticky part lives on the wrapper. */
export const TOC_ASIDE_CLASS =
  'hidden lg:block w-64 shrink-0 self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto';

const TITLE = 'On this page';

/** Sticky "On this page" sidebar (lg+), with the heading being read highlighted. */
export function TocSidebar({ headings }: { headings: TocHeading[] }) {
  const active = useActiveHeading(headings.map((h) => h.id).join('\n'));
  return (
    <nav aria-label={TITLE} className="w-full">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {TITLE}
      </p>
      <TocList headings={headings} active={active} />
    </nav>
  );
}

/** Collapsible "On this page" list above the article (below lg). */
export function TocDisclosure({ headings }: { headings: TocHeading[] }) {
  return (
    <details className="mb-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900 lg:hidden">
      <summary className="font-semibold">{TITLE}</summary>
      <nav aria-label={TITLE} className="mt-4">
        <TocList headings={headings} />
      </nav>
    </details>
  );
}
