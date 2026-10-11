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
    .replace(/\s*<link rel="canonical"[^>]*>/g, '');
  const tags: string[] = [];
  for (const [attr, key, content] of head.meta) {
    const pattern = new RegExp(`\\s*<meta ${attr}="${key.replace(/[.:]/g, '\\$&')}"[^>]*>`, 'g');
    out = out.replace(pattern, '');
    tags.push(`<meta ${attr}="${key}" content="${escapeAttr(content)}" />`);
  }
  if (head.canonical) tags.push(`<link rel="canonical" href="${escapeAttr(head.canonical)}" />`);
  return out.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
}
