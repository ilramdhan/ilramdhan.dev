import { describe, expect, it } from 'vitest';
import { buildSitemap } from './sitemap';

describe('buildSitemap', () => {
  it('lists both locales with hreflang alternates', () => {
    const xml = buildSitemap(['/', '/blog/a&b']);
    expect(xml).toContain('<loc>https://ilramdhan.dev/</loc>');
    expect(xml).toContain('<loc>https://ilramdhan.dev/id</loc>');
    expect(xml).toContain('<loc>https://ilramdhan.dev/id/blog/a&amp;b</loc>');
    expect(xml).toContain('hreflang="x-default" href="https://ilramdhan.dev/blog/a&amp;b"');
    expect(xml.match(/<url>/g)).toHaveLength(4);
  });
});
