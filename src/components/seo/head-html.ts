import { absoluteUrl, siteConfig } from '../../config/site';
import type { HeadDescriptor } from './seo-head';

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Writes `head` into a built `index.html` (prerendering, T-35): the template's own title,
 * canonical and every meta tag that `head` sets are replaced; other tags are kept.
 */
export function applyHeadToHtml(html: string, head: HeadDescriptor): string {
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(head.title)}</title>`)
    .replace(/\s*<link rel="canonical"[^>]*>/g, '')
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const tags: string[] = [];
  // Crawler-only extras (kept out of the client bundle): image alt, and size for the default 1200x630 image.
  const image = head.meta.find(([, k]) => k === 'og:image')?.[2];
  const extra: HeadDescriptor['meta'] = [['property', 'og:image:alt', head.title]];
  if (image === absoluteUrl(siteConfig.ogDefaultImage)) {
    extra.push(['property', 'og:image:width', '1200'], ['property', 'og:image:height', '630']);
  }
  head = { ...head, meta: [...head.meta, ...extra] };
  for (const [attr, key, content] of head.meta) {
    const pattern = new RegExp(`\\s*<meta ${attr}="${key.replace(/[.:]/g, '\\$&')}"[^>]*>`, 'g');
    out = out.replace(pattern, '');
    tags.push(`<meta ${attr}="${key}" content="${escapeAttr(content)}" />`);
  }
  for (const a of head.alternates) {
    tags.push(`<link rel="alternate" hreflang="${a.hreflang}" href="${escapeAttr(a.href)}" />`);
  }
  for (const node of head.jsonLd) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(node).replace(/</g, '\\u003c')}</script>`,
    );
  }
  if (head.canonical) tags.push(`<link rel="canonical" href="${escapeAttr(head.canonical)}" />`);
  out = out.replace(/<html lang="[^"]*"/, `<html lang="${head.lang}"`);
  return out.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
}
