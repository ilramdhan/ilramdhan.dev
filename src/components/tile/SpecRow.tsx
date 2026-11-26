import type { ReactNode } from 'react';
import { CountUpValue } from '@/components/motion/CountUpValue';
import { cn } from '@/lib/utils';
import { colVar } from './stagger';

export type SpecItem = {
  /** Already formatted for the locale. null / undefined / "" hides the item (never invent a figure). */
  value: string | number | null | undefined;
  label: string;
  /** Custom rendering of `value` (e.g. a count-up); shown instead of it when present. */
  node?: ReactNode;
  /** Optional one-line explanation under the label. */
  detail?: string;
};

const cols: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

/**
 * Apple "compare"-style specs row: 2–4 big tabular figures, small muted labels under them. No boxes.
 * `countUp` (default true) uses an item's `node`; a plain numeric value counts up once in view (CountUpValue, final value
 * in the DOM for AT and the prerendered HTML). With countUp={false} every value prints as is.
 */
export function SpecRow({
  items,
  countUp = true,
  stagger = true,
  wrap = false,
  className,
}: {
  items: SpecItem[];
  countUp?: boolean;
  /** Row stagger (`.stagger-row`, scroll-driven CSS). Pass false in a hero (it sits on the first screen). */
  stagger?: boolean;
  /** Values are words, not just figures: smaller size and allowed to wrap. */
  wrap?: boolean;
  className?: string;
}) {
  const shown = items
    .filter((i) => i.value !== null && i.value !== undefined && i.value !== '')
    .slice(0, 4);
  if (shown.length === 0) return null;
  return (
    <dl
      className={cn(
        'grid w-full gap-x-8 gap-y-10 text-center',
        cols[shown.length],
        stagger && 'stagger-row',
        className,
      )}
    >
      {shown.map((s, i) => (
        <div
          key={s.label}
          style={stagger ? colVar(i, shown.length) : undefined}
          className="flex flex-col-reverse items-center justify-end gap-2"
        >
          <dt className="max-w-[22ch] text-caption text-tile-muted">
            {s.label}
            {s.detail ? <span className="mt-1 block text-pretty">{s.detail}</span> : null}
          </dt>
          <dd
            data-count-up={countUp && !s.node && typeof s.value === 'number' ? '' : undefined}
            className={cn(
              'tabular font-semibold tracking-[-0.02em] text-tile-ink',
              wrap
                ? 'text-[clamp(1.375rem,1rem+1.4vw,2.25rem)] leading-[1.1] text-balance'
                : 'text-[clamp(1.75rem,1rem+2.6vw,3rem)] leading-none whitespace-nowrap',
            )}
          >
            {countUp
              ? (s.node ??
                (typeof s.value === 'number' ? <CountUpValue value={s.value} /> : s.value))
              : s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
