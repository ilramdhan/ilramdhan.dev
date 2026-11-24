import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { colVar } from './stagger';

export type FeatureColumn = {
  key: string;
  /** Optional big figure (already formatted; pass nothing when unknown). */
  figure?: ReactNode;
  title: string;
  body?: string;
  /** Small muted line (e.g. the named standard). */
  note?: string;
  /** A LinkChevron / ActionLink. */
  action?: ReactNode;
};

const cols: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Quiet text columns (Apple "why buy" row): optional big figure, a 21px title, one muted sentence, one link.
 * No boxes, no icons; air and alignment carry the structure. Heading level is h3 (inside a tile's h2).
 */
export function FeatureColumns({
  items,
  align = 'start',
  stagger = true,
  className,
}: {
  items: FeatureColumn[];
  align?: 'start' | 'center';
  /** Row stagger hook (`.stagger-row`, scroll-driven CSS). Default true. */
  stagger?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;
  const n = Math.min(items.length, 4);
  const center = align === 'center';
  const lgCols = items.length % 3 === 0 && items.length > 4 ? 3 : n;
  return (
    <ul
      className={cn(
        'grid w-full grid-cols-1 gap-x-10 gap-y-12',
        cols[lgCols],
        stagger && 'stagger-row',
        className,
      )}
    >
      {items.map((it, i) => (
        <li
          key={it.key}
          style={stagger ? colVar(i, lgCols) : undefined}
          className={cn(
            'flex flex-col',
            center ? 'items-center text-center' : 'items-start text-left',
          )}
        >
          {it.figure ? (
            <p className="tabular mb-4 text-[clamp(1.75rem,1.2rem+1.8vw,2.75rem)] leading-none font-semibold tracking-[-0.02em] text-tile-ink">
              {it.figure}
            </p>
          ) : null}
          <h3 className="text-title text-balance text-tile-ink">{it.title}</h3>
          {it.body ? (
            <p className="mt-2 max-w-[40ch] text-body text-pretty text-tile-muted">{it.body}</p>
          ) : null}
          {it.note ? <p className="mt-3 text-caption text-tile-muted">{it.note}</p> : null}
          {it.action ? <div className="mt-2">{it.action}</div> : null}
        </li>
      ))}
    </ul>
  );
}
