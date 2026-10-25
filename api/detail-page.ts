// Fallback for `/blog/:slug` and `/projects/:slug` URLs with no prerendered file, i.e.
// content published after the last deploy (vercel.json rewrites; the filesystem wins first,
// so prerendered pages never reach this). Serves the SPA shell with the page's head so
// social previews work until the next build; unknown slugs or errors get 404.html as before.
import {
  buildDetailHtml,
  detailParams,
  fetchDetailRow,
  isDetailKind,
} from '../src/components/seo/detail-fallback';

const html = (body: string, status: number, cache: string) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache },
  });

// Static files of this same deployment, fetched over HTTP: the build output (dist/) is not
// part of the function bundle. `/spa` and `/404` are spa.html / 404.html under cleanUrls.
// On previews behind Deployment Protection this needs "Protection Bypass for Automation".
async function staticPage(origin: string, page: 'spa' | '404'): Promise<string> {
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const res = await fetch(new URL(`/${page}`, origin), {
    headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {},
  });
  const text = await res.text();
  if (page === 'spa' && !res.ok) throw new Error(`/${page}: HTTP ${res.status}`);
  return text;
}

async function notFound(origin: string, cache: string): Promise<Response> {
  const body = await staticPage(origin, '404').catch(() => 'Not found');
  return html(body, 404, cache);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { kind, slug } = detailParams(url);
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!isDetailKind(kind) || !slug || !supabaseUrl || !anonKey) {
    return notFound(url.origin, 'no-store');
  }
  try {
    const [row, template] = await Promise.all([
      fetchDetailRow(kind, slug, { url: supabaseUrl, anonKey }),
      staticPage(url.origin, 'spa'),
    ]);
    const page = buildDetailHtml(template, kind, slug, row);
    // A short CDN cache: the next deploy prerenders the page and takes over anyway.
    if (page) return html(page, 200, 'public, s-maxage=300, stale-while-revalidate=3600');
    return notFound(url.origin, 'public, s-maxage=60');
  } catch (error) {
    console.error('[detail-page]', error);
    return notFound(url.origin, 'no-store');
  }
}
