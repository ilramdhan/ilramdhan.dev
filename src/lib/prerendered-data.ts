import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Element id of the JSON block a prerendered page carries its query data in (T-35). */
export const PRERENDERED_DATA_ID = 'prerendered-data';

export interface PrerenderedQuery {
  key: QueryKey;
  data: unknown;
  /** When the build fetched it. */
  updatedAt: number;
}

/** JSON for a `<script type="application/json">` block (`<` escaped so it can't close the tag). */
export const serializePrerenderedData = (queries: PrerenderedQuery[]) =>
  JSON.stringify(queries).replace(/</g, '\\u003c');

/**
 * Seeds `client` with the data a prerendered page was built with, so hydration renders
 * exactly the static HTML (no loading flash) and Supabase being down doesn't blank it.
 * Mounted queries refresh it in the background once the browser is idle, so edits made
 * since the build show up without waiting for the next deploy. Malformed or missing data
 * is ignored: the page just fetches as usual.
 */
export function seedPrerenderedData(client: QueryClient, doc: Document = document): void {
  const text = doc.getElementById(PRERENDERED_DATA_ID)?.textContent;
  if (!text) return;
  try {
    for (const { key, data, updatedAt } of JSON.parse(text) as PrerenderedQuery[]) {
      client.setQueryData(key, data, { updatedAt });
    }
    // Refreshed once the page has loaded and the browser is idle, so the refresh never
    // competes with hydration for the main thread.
    const refresh = () => void client.invalidateQueries();
    const whenIdle = () =>
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback(refresh, { timeout: 3000 })
        : setTimeout(refresh, 1000);
    if (doc.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
  } catch {
    // ignore: fall back to fetching
  }
}
