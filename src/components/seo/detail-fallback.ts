// Relative imports on purpose: bundled into the Vercel function (api/), which ignores tsconfig paths.
import { localePath, type Locale } from '../../i18n/locale';
import { applyHeadToHtml } from './head-html';
import { buildHead, type SeoProps } from './seo-head';

/**
 * Head for a post or project published after the last deploy, so it has no prerendered
 * `blog/<slug>.html` yet (api/detail-page.ts). The tags match what `<Seo>` on the detail
 * pages writes; the body stays the empty SPA shell, which the browser renders as usual.
 */
export type DetailKind = 'blog' | 'project';

export interface DetailRow {
  title: string;
  /** `blogs.excerpt` or `projects.short_description`. */
  description: string | null;
  images: string[] | null;
}

const SOURCES = {
  blog: { table: 'blogs', description: 'excerpt', path: '/blog/' },
  project: { table: 'projects', description: 'short_description', path: '/projects/' },
} as const;

export const isDetailKind = (value: unknown): value is DetailKind =>
  value === 'blog' || value === 'project';

/**
 * `kind` and `slug` from the rewrite's query (`/api/detail-page?kind=blog&slug=…`), or from
 * the original `/blog/<slug>` / `/projects/<slug>` path if the query didn't come through.
 */
export function detailParams(url: URL): { kind: string | null; slug: string | null } {
  const kind = url.searchParams.get('kind');
  const slug = url.searchParams.get('slug');
  if (kind && slug) return { kind, slug };
  const match = /^(?:\/id)?\/(blog|projects)\/([^/]+)$/.exec(url.pathname);
  if (!match?.[1] || !match[2]) return { kind: null, slug: null };
  try {
    return { kind: match[1] === 'blog' ? 'blog' : 'project', slug: decodeURIComponent(match[2]) };
  } catch {
    return { kind: null, slug: null };
  }
}

/** The `translations.<locale>` text for `key`, when it is a non-empty string. */
function translated(row: Record<string, unknown>, locale: Locale, key: string): string | null {
  const all = row.translations;
  if (typeof all !== 'object' || all === null) return null;
  const mine = (all as Record<string, unknown>)[locale];
  if (typeof mine !== 'object' || mine === null) return null;
  const value = (mine as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Fetches the row through Supabase REST; RLS only returns published rows to the anon key.
 * For a non-default `locale` the `translations` column is requested too (title and
 * description come back translated when present); if the column does not exist yet
 * (T-41 migration not applied: HTTP 400) the English row is fetched instead.
 */
export async function fetchDetailRow(
  kind: DetailKind,
  slug: string,
  supabase: { url: string; anonKey: string },
  fetchFn: typeof fetch = fetch,
  locale: Locale = 'en',
): Promise<DetailRow | null> {
  const source = SOURCES[kind];
  const request = (withTranslations: boolean) => {
    const query = new URLSearchParams({
      select: `title,images,${source.description}${withTranslations ? ',translations' : ''}`,
      slug: `eq.${slug}`,
      limit: '1',
    });
    return fetchFn(`${supabase.url.replace(/\/$/, '')}/rest/v1/${source.table}?${query}`, {
      headers: { apikey: supabase.anonKey, Authorization: `Bearer ${supabase.anonKey}` },
    });
  };
  let res = await request(locale !== 'en');
  if (!res.ok && res.status === 400 && locale !== 'en') res = await request(false);
  if (!res.ok) throw new Error(`Supabase ${source.table}: HTTP ${res.status}`);
  const [row] = (await res.json()) as Array<Record<string, unknown>>;
  if (!row || typeof row.title !== 'string') return null;
  const description = translated(row, locale, source.description) ?? row[source.description];
  return {
    title: translated(row, locale, 'title') ?? row.title,
    description: typeof description === 'string' ? description : null,
    images: Array.isArray(row.images) ? row.images.filter((i) => typeof i === 'string') : null,
  };
}

/** The SPA shell with the detail page's head, or `null` when there is no such row. */
export function buildDetailHtml(
  template: string,
  kind: DetailKind,
  slug: string,
  row: DetailRow | null,
  locale: Locale = 'en',
): string | null {
  if (!row) return null;
  const props: SeoProps = {
    title: row.title,
    description: row.description || undefined,
    image: row.images?.[0] || undefined,
    type: 'article',
  };
  return applyHeadToHtml(
    template,
    buildHead(props, localePath(`${SOURCES[kind].path}${encodeURIComponent(slug)}`, locale)),
  );
}
