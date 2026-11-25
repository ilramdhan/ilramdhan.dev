import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { LinkChevron } from './LinkChevron';
import { MediaFrame, type MediaAspect } from './MediaFrame';
import { colVar } from './stagger';

export type LinkedItem = {
  id: string;
  title: string;
  /** One muted line under the title. */
  line?: string;
  /** In-app path. */
  href: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    position?: string;
  } | null;
  /** View-transition name for the photo (shared-element morph; build it with `morphName`). */
  morph?: string;
};

/**
 * One linked group (the site's "card", minus the card): a clickable MediaFrame, a title, one muted line and a
 * non-interactive LinkChevron. Hover zooms the photo 1.02 and underlines the chevron; the group itself gets no lift,
 * background or shadow.
 */
export function LinkedGroup({
  item,
  moreLabel,
  aspect = 'portrait',
  className,
}: {
  item: LinkedItem;
  /** The chevron text, e.g. "Learn more" (from the caller's messages). */
  moreLabel: string;
  aspect?: MediaAspect;
  className?: string;
}) {
  return (
    <Link
      to={item.href}
      className={cn(
        'group flex h-full flex-col items-start text-left sm:items-center sm:text-center',
        className,
      )}
    >
      <MediaFrame
        src={item.image?.src ?? null}
        alt={item.image?.alt ?? ''}
        width={item.image?.width ?? 4}
        height={item.image?.height ?? 5}
        position={item.image?.position}
        aspect={aspect}
        className={aspect === 'portrait' ? 'max-sm:aspect-square' : undefined}
        interactive
        morph={item.morph}
      />
      <span className={cn('mt-4 line-clamp-2 text-title text-tile-ink sm:mt-6')}>{item.title}</span>
      {item.line ? (
        <span className="mt-2 line-clamp-3 flex-1 text-[0.9375rem] leading-[1.4] text-pretty text-tile-muted">
          {item.line}
        </span>
      ) : null}
      <LinkChevron className="mt-2 group-hover:underline">{moreLabel}</LinkChevron>
    </Link>
  );
}

const cols: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
};

/**
 * Image-led row of linked groups (Apple "Which iPhone is right for you" pattern, mutugading FamilyRow).
 * 2 columns under 1024px, then one row of up to 5.
 */
export function LinkedGroupRow({
  items,
  moreLabel,
  stagger = true,
  columns,
  aspect,
  oneRow = false,
  className,
}: {
  items: LinkedItem[];
  moreLabel: string;
  /** Row stagger hook (`.stagger-row`, scroll-driven CSS). Default true. */
  stagger?: boolean;
  /** Force the ≥1024px column count (2–5); default = item count capped at 5. */
  columns?: 2 | 3 | 4 | 5;
  aspect?: MediaAspect;
  /**
   * Exactly one row at every width: the items beyond the 2 that fit under 1024px are hidden there, and the text
   * rows (title / line / link) line up across the row through a subgrid.
   */
  oneRow?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;
  const n = columns ?? Math.min(Math.max(items.length, 2), 5);
  return (
    <ul
      className={cn(
        'grid w-full grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12',
        cols[n],
        stagger && 'stagger-row',
        oneRow && 'grid-rows-[repeat(4,auto)] gap-y-0',
        className,
      )}
    >
      {items.map((item, i) => (
        <li
          key={item.id}
          style={stagger ? colVar(i, n) : undefined}
          className={
            oneRow
              ? 'row-span-4 grid grid-rows-subgrid max-lg:nth-[n+3]:hidden [&>a]:row-span-4 [&>a]:grid [&>a]:grid-rows-subgrid [&>a]:justify-items-start sm:[&>a]:justify-items-center'
              : undefined
          }
        >
          <LinkedGroup item={item} moreLabel={moreLabel} aspect={aspect} />
        </li>
      ))}
    </ul>
  );
}
