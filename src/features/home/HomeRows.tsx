import { LinkedGroupRow, type LinkedItem } from '@/components/tile/LinkedGroup';
import { cn } from '@/lib/utils';

/** Frames of the row's real shape (2 columns under 1024px, then `columns`), so data arriving later shifts nothing. */
export function LinkedRowSkeleton({ columns = 4, label }: { columns?: 3 | 4; label: string }) {
  return (
    <>
      <span className="sr-only" role="status">
        {label}
      </span>
      <ul
        aria-hidden="true"
        className={cn(
          'grid w-full grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12',
          columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        )}
      >
        {Array.from({ length: columns }, (_, i) => (
          <li key={i} className="flex flex-col items-start sm:items-center">
            <div className="aspect-[4/3] w-full rounded-lg bg-tile-frame motion-safe:animate-pulse" />
            <div className="mt-4 h-[1.2em] w-2/3 rounded-sm bg-tile-frame text-title sm:mt-6" />
            <div className="mt-2 h-[2.8em] w-full rounded-sm bg-tile-frame text-[0.9375rem]" />
            <div className="mt-2 h-11 w-1/3" />
          </li>
        ))}
      </ul>
    </>
  );
}

/** A row of linked groups, or the tile's quiet one-line state when there is nothing to show. */
export function LinkedRowOrNote({
  items,
  moreLabel,
  note,
  error,
}: {
  items: LinkedItem[] | undefined;
  moreLabel: string;
  note: string;
  error?: string | false;
}) {
  if (error) return <p className="text-body text-tile-muted">{error}</p>;
  if (!items) return null;
  if (items.length === 0) return <p className="text-body text-tile-muted">{note}</p>;
  return (
    <LinkedGroupRow
      items={items}
      moreLabel={moreLabel}
      aspect="landscape"
      columns={items.length >= 4 ? 4 : items.length === 3 ? 3 : 2}
    />
  );
}
