import type { ReactNode } from 'react';
import { SegmentedControl, type SegmentedOption } from '@/components/tile/SegmentedControl';
import { StrokeIcon } from '@/components/ui/StrokeIcon';
import { cn } from '@/lib/utils';

// ponytail: the Tile/TileHeading markup written out (same classes) so the listing routes don't pull the split-text
// and motion registry into their first paint. Swap back to <Tile>/<TileHeading> when those stop importing eagerly.

/** Same hero on /projects, /blog, /certificates: white tile, centred h1 + lead, one rise entrance. */
export function ListingHero({ id, title, lead }: { id: string; title: string; lead: string }) {
  return (
    <section
      aria-labelledby={id}
      data-tone="white"
      data-enter=""
      className="w-full scroll-mt-(--nav-h) bg-white pb-0 pt-section text-ink"
    >
      <div className="wrap flex flex-col items-center text-center">
        <div className="animate-rise flex flex-col items-center text-center">
          <h1 id={id} className="text-hero max-w-[14ch] text-tile-ink">
            {title}
          </h1>
          <p className="mt-5 max-w-[34ch] text-lead text-tile-ink">{lead}</p>
        </div>
      </div>
    </section>
  );
}

/** The list tile under the hero (same white surface, so hero + list read as one). */
export function ListingSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      data-tone="white"
      className="w-full scroll-mt-(--nav-h) bg-white pb-section pt-stack text-ink"
    >
      <h2 id={id} className="sr-only">
        {title}
      </h2>
      <div className="wrap">{children}</div>
    </section>
  );
}

const FIELD =
  'h-11 w-full rounded-full bg-parchment px-5 text-body text-ink outline-hidden placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-0 focus-visible:outline-tile-action';
const LABEL = 'mb-2 block text-caption text-tile-muted';
/** More chips than this and the filter becomes a select. */
const MAX_CHIPS = 6;

type Opt = { value: string; label: string };

/**
 * One toolbar for every listing: search, sort, then the filter, all 44px / full radius / parchment, in that order.
 * Filter = one scrollable segmented control, or a select past MAX_CHIPS values. Visible labels on every control.
 */
export function ListingToolbar({
  id,
  search,
  sort,
  filter,
  resultLine,
  clear,
}: {
  id: string;
  search: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    clearLabel: string;
  };
  sort: {
    label: string;
    value: 'newest' | 'oldest';
    onChange: (v: 'newest' | 'oldest') => void;
    options: readonly Opt[];
  };
  /** Omitted while there is nothing to filter by. */
  filter?: {
    label: string;
    /** The "all" option first (value ''). */
    options: readonly SegmentedOption<string>[];
    value: string;
    onChange: (v: string) => void;
  } | null;
  resultLine: ReactNode;
  /** Shown only while something is filtered. */
  clear?: { label: string; onClick: () => void } | null;
}) {
  const asSelect = filter && filter.options.length - 1 > MAX_CHIPS;
  return (
    <div className="w-full space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div>
          <label htmlFor={`${id}-search`} className={LABEL}>
            {search.label}
          </label>
          <div className="relative">
            <input
              id={`${id}-search`}
              type="text"
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className={cn(FIELD, 'pr-12')}
            />
            {search.value && (
              <button
                type="button"
                aria-label={search.clearLabel}
                onClick={() => search.onChange('')}
                className="absolute right-0 top-0 grid size-11 place-items-center rounded-full text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-tile-action"
              >
                <StrokeIcon name="x" className="size-4" />
              </button>
            )}
          </div>
        </div>
        <Select id={`${id}-sort`} {...sort} />
      </div>
      {filter && asSelect ? (
        <div className="sm:max-w-[14rem]">
          <Select id={`${id}-filter`} {...filter} options={filter.options as readonly Opt[]} />
        </div>
      ) : filter ? (
        <div>
          <span className={LABEL}>{filter.label}</span>
          <SegmentedControl {...filter} />
        </div>
      ) : null}
      <div className="flex min-h-11 flex-wrap items-center gap-x-4 text-caption text-tile-muted">
        <p aria-live="polite">{resultLine}</p>
        {clear && (
          <button
            type="button"
            onClick={clear.onClick}
            className="inline-flex min-h-11 items-center text-tile-action underline-offset-4 hover:text-tile-action-hover hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-tile-action"
          >
            {clear.label}
          </button>
        )}
      </div>
    </div>
  );
}

function Select<V extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: readonly Opt[];
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as V)}
          className={cn(FIELD, 'appearance-none pr-11')}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <StrokeIcon
          name="down"
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        />
      </div>
    </div>
  );
}
