import { describe, expect, it } from 'vitest';
import { applyHeadToHtml } from './head-html';
import { buildHead } from './seo-head';

const meta = (head: ReturnType<typeof buildHead>, key: string) =>
  head.meta.find(([, k]) => k === key)?.[2];

describe('buildHead', () => {
  it('uses a self-referencing absolute canonical per path', () => {
    expect(buildHead({}, '/blog').canonical).toBe('https://ilramdhan.dev/blog');
    expect(buildHead({}, '/blog/a').canonical).toBe('https://ilramdhan.dev/blog/a');
    expect(buildHead({ path: '/x' }, '/blog').canonical).toBe('https://ilramdhan.dev/x');
  });

  it('templates the title and keeps og:url in sync with the canonical', () => {
    const head = buildHead({ title: 'About' }, '/about');
    expect(head.title).toBe('About | Ilham Ramadhan');
    expect(meta(head, 'og:url')).toBe('https://ilramdhan.dev/about');
  });

  it('noindex drops canonical and url tags', () => {
    const head = buildHead({ noindex: true }, '/login');
    expect(head.canonical).toBeNull();
    expect(meta(head, 'robots')).toMatch(/noindex/);
    expect(meta(head, 'og:url')).toBeUndefined();
  });

  it('makes images absolute', () => {
    expect(meta(buildHead({}, '/'), 'og:image')).toBe('https://ilramdhan.dev/og.png');
    expect(meta(buildHead({ image: 'https://cdn.x/a.png' }, '/'), 'og:image')).toBe(
      'https://cdn.x/a.png',
    );
  });
});

describe('applyHeadToHtml', () => {
  const template = [
    '<html><head>',
    '<title>Site</title>',
    '<meta name="description" content="site" />',
    '<meta property="og:title" content="Site" />',
    '<meta name="author" content="me" />',
    '</head><body></body></html>',
  ].join('\n');

  it('replaces the defaults instead of duplicating them and keeps other tags', () => {
    const html = applyHeadToHtml(template, buildHead({ title: 'A "post"' }, '/blog/a'));
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain('<title>A &quot;post&quot; | ');
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html).toContain('<meta name="author" content="me" />');
    expect(html).toContain('<link rel="canonical" href="https://ilramdhan.dev/blog/a" />');
  });

  it('writes no canonical for noindex pages', () => {
    const html = applyHeadToHtml(template, buildHead({ noindex: true }, '/login'));
    expect(html).not.toContain('rel="canonical"');
    expect(html).toContain('content="noindex, nofollow"');
  });
});

describe('og image + json-ld', () => {
  it('declares size only for the default 1200x630 image, plus alt', () => {
    const html = (props: Parameters<typeof buildHead>[0]) =>
      applyHeadToHtml('<html><head></head></html>', buildHead(props, '/about'));
    const d = html({ title: 'A' });
    expect(d).toContain('og:image:width" content="1200"');
    expect(d).toContain('og:image:height" content="630"');
    expect(d).toContain('og:image:alt" content="A | Ilham Ramadhan"');
    expect(d).toContain('twitter:image:alt" content="A | Ilham Ramadhan"');
    expect(html({ image: '/x.png' })).not.toContain('og:image:width');
  });

  it('writes json-ld into prerendered html, replacing old blocks', () => {
    const node = { '@context': 'https://schema.org', '@type': 'Person', name: '</script>' };
    const tpl = '<html><head><script type="application/ld+json">{}</script></head></html>';
    const html = applyHeadToHtml(tpl, { ...buildHead({}, '/'), jsonLd: [node] });
    expect(html.match(/ld\+json/g)).toHaveLength(1);
    expect(html).not.toContain('</script>"');
  });
});
