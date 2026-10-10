import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const NAV_BTN =
  'p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed';

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
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex justify-center gap-2">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={NAV_BTN}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      {getPageItems(currentPage, totalPages).map((page, i) =>
        page === null ? (
          <span key={`gap-${i}`} aria-hidden="true" className="w-10 h-10 grid place-items-center">
            …
          </span>
        ) : (
          <button
            type="button"
            key={page}
            aria-current={currentPage === page ? 'page' : undefined}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              currentPage === page
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Next page"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={NAV_BTN}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
