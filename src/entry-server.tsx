/**
 * Prerender entry (T-35), loaded by `scripts/prerender.mjs` after `vite build`.
 *
 * `render(url)` renders one public route to HTML with the data its page reads: the page
 * is rendered, every query it asked for is fetched, and it is rendered again until no new
 * query appears (detail pages need the post before its comments, …). Queries that fail or
 * are skipped stay pending, so the page shows its normal loading state and the browser
 * fetches them after hydration.
 */
import { StrictMode, type ReactElement } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import type { Query, QueryClient } from '@tanstack/react-query';
import { Providers } from '@/app/providers';
import { createQueryClient, QUERY_DEFAULTS } from '@/app/query-client';
import { GuardedRoutes } from '@/app/routes';
import { HeadCollectorContext } from '@/components/seo/head-collector';
import type { HeadDescriptor } from '@/components/seo/seo-head';
import { supabase } from '@/lib/supabase/client';
import type { PrerenderedQuery } from '@/lib/prerendered-data';
import { loadLocale } from '@/i18n';
import { localePath, splitLocale } from '@/i18n/locale';
import { buildSitemap } from '@/i18n/sitemap';

export { applyHeadToHtml } from '@/components/seo/head-html';

/** Public routes without parameters, locale-free (each is prerendered for `en` and `id`). */
export const STATIC_ROUTES = [
  '/',
  '/about',
  '/certificates',
  '/projects',
  '/blog',
  '/privacy',
  '/terms',
  '/contact',
];

/** English-only: admin stays out of the locale routes; `login` is prerendered (noindex). */
const EN_ONLY_ROUTES = ['/login'];

export { buildSitemap };

/** Query keys never fetched at build time (third-party, per-visitor). */
const CLIENT_ONLY_KEYS = new Set(['wakatime', 'is-admin']);
const MAX_PASSES = 4;

async function slugs(table: 'projects' | 'blogs'): Promise<string[]> {
  // RLS only returns published posts to the anon key.
  const { data, error } = await supabase.from(table).select('slug');
  if (error) throw new Error(`Could not list ${table}: ${error.message}`);
  return (data ?? []).flatMap((row) => (row.slug ? [row.slug] : []));
}

/** Locale-free paths of every indexable page: static pages plus each published project and post. */
export async function contentPaths(withContent: boolean): Promise<string[]> {
  if (!withContent) return STATIC_ROUTES;
  const [projects, blogs] = await Promise.all([slugs('projects'), slugs('blogs')]);
  return [
    ...STATIC_ROUTES,
    ...projects.map((s) => `/projects/${encodeURIComponent(s)}`),
    ...blogs.map((s) => `/blog/${encodeURIComponent(s)}`),
  ];
}

/** Every URL to prerender, both locales (`/about`, `/id/about`, ...). */
export async function prerenderRoutes(withContent: boolean): Promise<string[]> {
  const paths = await contentPaths(withContent);
  return [...paths, ...EN_ONLY_ROUTES, ...paths.map((p) => localePath(p, 'id'))];
}

// Resolves once everything (lazy pages and Suspense boundaries included) is ready:
// complete markup, no streaming placeholders or inline scripts (CSP).
async function toHtml(element: ReactElement): Promise<string> {
  // Throwing inside onError would unwind React's work loop: record it, throw after the await.
  let failure: unknown;
  const { prelude } = await prerenderToNodeStream(element, {
    // React 19 outlines large completed boundaries (inline `$RC` reveal scripts); never do.
    progressiveChunkSize: Infinity,
    onError: (error) => {
      failure ??= error;
    },
  });
  if (failure)
    throw failure instanceof Error ? failure : new Error('prerender failed', { cause: failure });
  let html = '';
  for await (const chunk of prelude) html += String(chunk);
  return html;
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
  await loadLocale(splitLocale(url).locale);
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { ...QUERY_DEFAULTS, retry: false } });
  const collector: { current: HeadDescriptor | null } = { current: null };
  const collect = (head: HeadDescriptor) => {
    collector.current = head;
  };
  const app = () => (
    <StrictMode>
      <HeadCollectorContext.Provider value={collect}>
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
