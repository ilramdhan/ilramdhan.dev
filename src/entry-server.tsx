/**
 * Prerender entry (T-35), loaded by `scripts/prerender.mjs` after `vite build`.
 *
 * `render(url)` renders one public route to HTML with the data its page reads: the page
 * is rendered, every query it asked for is fetched, and it is rendered again until no new
 * query appears (detail pages need the post before its comments, …). Queries that fail or
 * are skipped stay pending, so the page shows its normal loading state and the browser
 * fetches them after hydration.
 */
import { Writable } from 'node:stream';
import { StrictMode, type ReactElement } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import type { Query, QueryClient } from '@tanstack/react-query';
import { Providers } from '@/app/providers';
import { createQueryClient, QUERY_DEFAULTS } from '@/app/query-client';
import { GuardedRoutes } from '@/app/routes';
import { HeadCollectorContext } from '@/components/seo/head-collector';
import type { HeadDescriptor } from '@/components/seo/seo-head';
import { supabase } from '@/lib/supabase/client';
import type { PrerenderedQuery } from '@/lib/prerendered-data';

export { applyHeadToHtml } from '@/components/seo/seo-head';

/** Public routes without parameters; `login` is prerendered too (noindex). */
export const STATIC_ROUTES = [
  '/',
  '/about',
  '/certificates',
  '/projects',
  '/blog',
  '/privacy',
  '/terms',
  '/login',
];

/** Query keys never fetched at build time (third-party, per-visitor). */
const CLIENT_ONLY_KEYS = new Set(['wakatime', 'is-admin']);
const MAX_PASSES = 4;

async function slugs(table: 'projects' | 'blogs'): Promise<string[]> {
  // RLS only returns published posts to the anon key.
  const { data, error } = await supabase.from(table).select('slug');
  if (error) throw new Error(`Could not list ${table}: ${error.message}`);
  return (data ?? []).flatMap((row) => (row.slug ? [row.slug] : []));
}

/** Every route to prerender: static pages plus each published project and post. */
export async function prerenderRoutes(withContent: boolean): Promise<string[]> {
  if (!withContent) return STATIC_ROUTES;
  const [projects, blogs] = await Promise.all([slugs('projects'), slugs('blogs')]);
  return [
    ...STATIC_ROUTES,
    ...projects.map((s) => `/projects/${encodeURIComponent(s)}`),
    ...blogs.map((s) => `/blog/${encodeURIComponent(s)}`),
  ];
}

function toHtml(element: ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        html += chunk.toString();
        callback();
      },
      final(callback) {
        resolve(html);
        callback();
      },
    });
    // Piped only once everything (lazy pages included) is ready: complete markup, no
    // streaming placeholders or inline scripts (CSP).
    const stream = renderToPipeableStream(element, {
      onAllReady: () => stream.pipe(sink),
      onShellError: reject,
      onError: reject,
    });
  });
}

const isEnabled = (query: Query) => {
  const { enabled } = query.options as { enabled?: boolean | ((q: Query) => boolean) };
  return typeof enabled === 'function' ? enabled(query) : enabled !== false;
};

function pendingQueries(client: QueryClient, tried: Set<string>): Query[] {
  return client
    .getQueryCache()
    .getAll()
    .filter(
      (q) =>
        q.state.status === 'pending' &&
        !tried.has(q.queryHash) &&
        !CLIENT_ONLY_KEYS.has(String(q.queryKey[0])) &&
        isEnabled(q),
    );
}

export interface RenderResult {
  /** Markup for `#root`. */
  html: string;
  /** The page's `<Seo>`, or `null` when it rendered none. */
  head: HeadDescriptor | null;
  /** Successful queries, to seed the browser's cache (`lib/prerendered-data.ts`). */
  data: PrerenderedQuery[];
}

export async function render(url: string, withContent: boolean): Promise<RenderResult> {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { ...QUERY_DEFAULTS, retry: false } });
  const collector: { current: HeadDescriptor | null } = { current: null };
  const app = () => (
    <StrictMode>
      <HeadCollectorContext.Provider value={collector}>
        <Providers client={client}>
          <StaticRouter location={url}>
            <GuardedRoutes />
          </StaticRouter>
        </Providers>
      </HeadCollectorContext.Provider>
    </StrictMode>
  );

  const tried = new Set<string>();
  let html = await toHtml(app());
  for (let pass = 0; withContent && pass < MAX_PASSES; pass++) {
    const pending = pendingQueries(client, tried);
    if (pending.length === 0) break;
    for (const q of pending) tried.add(q.queryHash);
    // A failed query is dropped: the page renders its loading state for it instead of
    // baking an error into the static HTML.
    await Promise.all(
      pending.map((q) => q.fetch().catch(() => client.removeQueries({ queryKey: q.queryKey }))),
    );
    collector.current = null;
    html = await toHtml(app());
  }

  const data = client
    .getQueryCache()
    .getAll()
    .filter((q) => q.state.status === 'success')
    .map((q) => ({ key: q.queryKey, data: q.state.data, updatedAt: q.state.dataUpdatedAt }));
  return { html, head: collector.current, data };
}
