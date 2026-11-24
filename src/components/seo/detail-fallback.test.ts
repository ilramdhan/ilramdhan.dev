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
    expect(html).toContain('<meta property="og:image" content="https://ilramdhan.dev/og.png" />');
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

  const jsonLd = (html: string | null) =>
    [...(html ?? '').matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1]!) as Record<string, unknown>,
    );

  it('writes BlogPosting + BreadcrumbList JSON-LD like the prerendered page', () => {
    const [post, crumbs] = jsonLd(
      buildDetailHtml(
        template,
        'blog',
        'my-post',
        {
          title: 'Judul',
          description: 'E',
          images: ['https://cdn.x/c.png'],
          tags: ['go', 'react'],
          date: '2026-01-02T00:00:00Z',
        },
        'id',
      ),
    );
    expect(post).toMatchObject({
      '@type': 'BlogPosting',
      headline: 'Judul',
      inLanguage: 'id',
      datePublished: '2026-01-02T00:00:00Z',
      keywords: 'go, react',
      url: 'https://ilramdhan.dev/id/blog/my-post',
    });
    expect(crumbs).toMatchObject({ '@type': 'BreadcrumbList' });
    expect(
      (crumbs!.itemListElement as Array<{ name: string; item: string }>).map((i) => i.item),
    ).toEqual([
      'https://ilramdhan.dev/id',
      'https://ilramdhan.dev/id/blog',
      'https://ilramdhan.dev/id/blog/my-post',
    ]);
  });

  it('writes CreativeWork, or SoftwareSourceCode when the project has a repo', () => {
    const row = { title: 'App', description: null, images: null };
    expect(jsonLd(buildDetailHtml(template, 'project', 'app', row))[0]).toMatchObject({
      '@type': 'CreativeWork',
      inLanguage: 'en',
    });
    expect(
      jsonLd(buildDetailHtml(template, 'project', 'app', { ...row, repo: 'github.com/x/app' }))[0],
    ).toMatchObject({ '@type': 'SoftwareSourceCode', codeRepository: 'https://github.com/x/app' });
  });

  it('returns null for a missing row', () => {
    expect(buildDetailHtml(template, 'blog', 'gone', null)).toBeNull();
  });
});

describe('fetchDetailRow', () => {
  it('queries the published row by slug with the anon key', async () => {
    const fetchFn = respond([{ title: 'T', excerpt: 'E', images: ['a.png'] }]);
    await expect(fetchDetailRow('blog', 'a b', supabase, fetchFn)).resolves.toMatchObject({
      title: 'T',
      description: 'E',
      images: ['a.png'],
    });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe(
      'https://ref.supabase.co/rest/v1/blogs?select=title%2Cimages%2Cexcerpt%2Ctags%2Cpublished_at&slug=eq.a+b&limit=1',
    );
    expect(init?.headers).toMatchObject({ apikey: 'anon', Authorization: 'Bearer anon' });
  });

  it('maps a project short_description', async () => {
    const fetchFn = respond([
      { title: 'P', short_description: 'S', images: null, created_at: 'D', repo_url: 'r' },
    ]);
    const row = await fetchDetailRow('project', 'p', supabase, fetchFn);
    expect(row).toEqual({
      title: 'P',
      description: 'S',
      images: null,
      tags: null,
      date: 'D',
      repo: 'r',
    });
    expect(fetchFn.mock.calls[0]![0]).toContain('/rest/v1/projects?');
  });

  it('serves the id translation, per field, and asks for the column only for id', async () => {
    const fetchFn = respond([
      { title: 'T', excerpt: 'E', images: null, translations: { id: { title: 'Judul' } } },
    ]);
    await expect(fetchDetailRow('blog', 'a', supabase, fetchFn, 'id')).resolves.toMatchObject({
      title: 'Judul',
      description: 'E',
      images: null,
    });
    expect(fetchFn.mock.calls[0]![0]).toContain('published_at%2Ctranslations');
  });

  it('falls back to the English row when the translations column does not exist yet', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{}', { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ title: 'T', excerpt: 'E' }])));
    const row = await fetchDetailRow('blog', 'a', supabase, fetchFn, 'id');
    expect(row?.title).toBe('T');
    expect(fetchFn.mock.calls[1]![0]).not.toContain('translations');
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
