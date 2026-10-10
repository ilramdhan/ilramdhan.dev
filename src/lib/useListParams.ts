import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/lib/hooks';

const SEARCH_DELAY = 300;

export function parsePage(value: string | null): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/**
 * List-page state (search `q`, one filter param, `page`) kept in the URL, so refresh,
 * back/forward and shared links restore the same view. The search box is typed into
 * immediately and written to the URL (replacing the entry) after a short debounce.
 */
export function useListParams(filterKey: string) {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const filter = params.get(filterKey);
  const page = parsePage(params.get('page'));

  const [input, setInput] = useState(urlQuery);
  const debounced = useDebounce(input, SEARCH_DELAY);
  const lastWritten = useRef(urlQuery);

  const update = useCallback(
    (changes: Record<string, string | null>, replace = false) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  // Back/forward or a pasted link changed the URL: show it in the search box.
  useEffect(() => {
    if (urlQuery !== lastWritten.current) {
      lastWritten.current = urlQuery;
      setInput(urlQuery);
    }
  }, [urlQuery]);

  // Typing settled: write it to the URL and go back to page 1.
  useEffect(() => {
    if (debounced === lastWritten.current) return;
    lastWritten.current = debounced;
    update({ q: debounced, page: null }, true);
  }, [debounced, update]);

  return {
    /** Value for the search input. */
    input,
    setInput,
    /** Committed search term (what the list query should use). */
    query: urlQuery,
    filter,
    page,
    setFilter: (value: string | null) => update({ [filterKey]: value, page: null }),
    setPage: (value: number) => update({ page: value > 1 ? String(value) : null }),
  };
}
