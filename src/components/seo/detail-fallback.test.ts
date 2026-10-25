import { describe, expect, it, vi } from 'vitest';
import { siteConfig } from '@/config/site';
import { buildDetailHtml, detailParams, fetchDetailRow } from './detail-fallback';

const template = [
  '<html><head>',
  '<title>Ilham Ramadhan | Web Developer &amp; Portfolio</title>',
  '<meta name="description" content="site" />',
  '<meta property="og:title" content="Site" />',
  '</head><body><div id="root"></div></body></html>',
].join('\n');

const supabase = { url: 'https://ref.supabase.co/', anonKey: 'anon' };
const respond = (body: unknown, status = 200) =>
  vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('buildDetailHtml', () => {
  it('writes a blog post head like <Seo> on the detail page', () => {
    const html = buildDetailHtml(template, 'blog', 'my-post', {
      title: 'My post',
      description: 'An excerpt',
      images: ['https://cdn.x/cover.png'],
    });
    expect(html).toContain('<title>My post | Ilham Ramadhan</title>');
    expect(html).toContain('<meta name="description" content="An excerpt" />');
    expect(html).toContain('<meta property="og:type" content="article" />');
    expect(html).toContain('<meta property="og:image" content="https://cdn.x/cover.png" />');
    expect(html).toContain('<link rel="canonical" href="https://ilramdhan.dev/blog/my-post" />');
    expect(html?.match(/property="og:title"/g)).toHaveLength(1);
    expect(html).toContain('<div id="root"></div>');
  });

  it('writes a project head, falling back to the site defaults', () => {
    const html = buildDetailHtml(template, 'project', 'app', {
      title: 'App',
      description: null,
      images: [],
    });
    expect(html).toContain('<link rel="canonical" href="https://ilramdhan.dev/projects/app" />');
    expect(html).toContain('<meta property="og:image" content="https://ilramdhan.dev/logo.png" />');
    expect(html).toContain(`<meta name="description" content="${siteConfig.metaDescription}" />`);
  });

  it('escapes row content', () => {
    const html = buildDetailHtml(template, 'blog', 'x', {
      title: '<script>"a" & b</script>',
      description: '"quoted" <b>',
      images: null,
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('<title>&lt;script&gt;&quot;a&quot; &amp; b&lt;/script&gt; | ');
    expect(html).toContain('content="&quot;quoted&quot; &lt;b&gt;"');
  });

  it('returns null for a missing row', () => {
    expect(buildDetailHtml(template, 'blog', 'gone', null)).toBeNull();
  });
});

describe('fetchDetailRow', () => {
  it('queries the published row by slug with the anon key', async () => {
    const fetchFn = respond([{ title: 'T', excerpt: 'E', images: ['a.png'] }]);
    await expect(fetchDetailRow('blog', 'a b', supabase, fetchFn)).resolves.toEqual({
      title: 'T',
      description: 'E',
      images: ['a.png'],
    });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe(
      'https://ref.supabase.co/rest/v1/blogs?select=title%2Cimages%2Cexcerpt&slug=eq.a+b&limit=1',
    );
    expect(init?.headers).toMatchObject({ apikey: 'anon', Authorization: 'Bearer anon' });
  });

  it('maps a project short_description', async () => {
    const fetchFn = respond([{ title: 'P', short_description: 'S', images: null }]);
    const row = await fetchDetailRow('project', 'p', supabase, fetchFn);
    expect(row).toEqual({ title: 'P', description: 'S', images: null });
    expect(fetchFn.mock.calls[0]![0]).toContain('/rest/v1/projects?');
  });

  it('returns null when no published row matches', async () => {
    await expect(fetchDetailRow('blog', 'gone', supabase, respond([]))).resolves.toBeNull();
  });

  it('throws on a Supabase error', async () => {
    await expect(fetchDetailRow('blog', 'a', supabase, respond({}, 500))).rejects.toThrow(/500/);
  });
});

describe('detailParams', () => {
  it('reads the rewrite query, else the original path', () => {
    expect(detailParams(new URL('https://x.dev/api/detail-page?kind=blog&slug=a'))).toEqual({
      kind: 'blog',
      slug: 'a',
    });
    expect(detailParams(new URL('https://x.dev/projects/caf%C3%A9'))).toEqual({
      kind: 'project',
      slug: 'café',
    });
    expect(detailParams(new URL('https://x.dev/blog/a/b'))).toEqual({ kind: null, slug: null });
  });
});
