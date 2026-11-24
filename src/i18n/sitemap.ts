import { absoluteUrl } from '../config/site';
import { alternatesFor } from './locale';

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** sitemap.xml for locale-free `paths`: one `<url>` per language version, each listing all alternates. */
export function buildSitemap(paths: string[]): string {
  const urls = paths.flatMap((path) => {
    const alternates = alternatesFor(path);
    const links = alternates
      .map(
        (a) =>
          `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escapeXml(absoluteUrl(a.path))}" />`,
      )
      .join('\n');
    return alternates
      .filter((a) => a.hreflang !== 'x-default')
      .map((a) => `  <url>\n    <loc>${escapeXml(absoluteUrl(a.path))}</loc>\n${links}\n  </url>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}
