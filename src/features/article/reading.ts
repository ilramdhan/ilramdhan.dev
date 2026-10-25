/** Average adult silent-reading speed for technical prose. */
export const WORDS_PER_MINUTE = 200;

/**
 * Markdown reduced to its readable words: code fences and inline code keep their text,
 * images, link targets, HTML tags and markup characters are dropped.
 */
export function markdownToPlainText(markdown: string | null | undefined): string {
  if (!markdown) return '';
  return (
    markdown
      // Fence delimiters (the code itself is still read).
      .replace(/^ {0,3}(`{3,}|~{3,}).*$/gm, ' ')
      // Images: alt text only.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Links: label only (inline and reference style).
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
      .replace(/^ {0,3}\[[^\]]+\]:\s*\S+.*$/gm, ' ')
      // Raw HTML tags and bare URLs.
      .replace(/<[^>]+>/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      // Headings, quotes, list bullets, table pipes, emphasis and other markup characters.
      .replace(/^ {0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, ' ')
      .replace(/[|*_~`#>=]+/g, ' ')
      .replace(/^\s*:?-{3,}:?\s*$/gm, ' ')
  );
}

/** Number of words in a Markdown document (see `markdownToPlainText`). */
export function countWords(markdown: string | null | undefined): number {
  const text = markdownToPlainText(markdown);
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu)?.length ?? 0;
}

/** Whole minutes to read `markdown` at `WORDS_PER_MINUTE`, at least 1. */
export function readingTime(markdown: string | null | undefined): number {
  return Math.max(1, Math.round(countWords(markdown) / WORDS_PER_MINUTE));
}
