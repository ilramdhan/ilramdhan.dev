/**
 * Plain text from a short Markdown field (service descriptions, the profile bio) for places that show one quiet
 * line, not rendered Markdown. ponytail: strips the inline marks this content uses (emphasis, code, links, headings);
 * render through `Markdown` if richer content needs to show here.
 */
export function plainText(md: string | null | undefined): string {
  return (md ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The first paragraph of Markdown that is not a heading, as plain text ("" when there is none). */
export function firstParagraph(md: string | null | undefined): string {
  for (const block of (md ?? '').split(/\n\s*\n|\n(?=#)/)) {
    const lines = block
      .split('\n')
      .filter((l) => l.trim() && !/^\s*#/.test(l) && !/^\s*(```|>|[-*+]\s|\d+\.\s|\|)/.test(l));
    const text = plainText(lines.join(' '));
    if (text) return text;
  }
  return '';
}
