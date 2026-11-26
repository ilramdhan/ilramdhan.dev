import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { StrokeIcon } from './StrokeIcon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** 44px round targets in the tile action colour (mutugading catalogue pager); the current page sits on parchment. */
const BTN =
  'inline-grid min-h-11 min-w-11 place-items-center rounded-full px-3 text-body tabular transition-[color,background-color] duration-200 ease-apple motion-reduce:transition-none';
const NAV_BTN = `${BTN} text-tile-action hover:bg-parchment disabled:cursor-not-allowed disabled:text-tile-muted disabled:hover:bg-transparent`;

/** Page numbers to render; `null` marks an ellipsis. Short ranges are listed in full. */
function getPageItems(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] ?? 0) > 1) items.push(null);
    items.push(p);
  });
  return items;
}

/** Previous / numbered / next page controls. Renders nothing for a single page. */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const t = useT().pagination;
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t.label} className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label={t.previous}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={NAV_BTN}
      >
        <StrokeIcon name="left" className="h-5 w-5" />
      </button>
      {getPageItems(currentPage, totalPages).map((page, i) =>
        page === null ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="grid min-h-11 min-w-6 place-items-center text-tile-muted sm:min-w-11"
          >
            …
          </span>
        ) : (
          <button
            type="button"
            key={page}
            aria-current={currentPage === page ? 'page' : undefined}
            onClick={() => onPageChange(page)}
            className={cn(
              BTN,
              currentPage === page
                ? 'bg-parchment font-semibold text-tile-ink'
                : 'text-tile-action hover:underline underline-offset-4',
              // Phones keep one row of 44px targets: first, current, last (+ ellipses and arrows).
              page !== currentPage && page !== 1 && page !== totalPages && 'max-sm:hidden',
            )}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label={t.next}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={NAV_BTN}
      >
        <StrokeIcon name="right" className="h-5 w-5" />
      </button>
    </nav>
  );
}
