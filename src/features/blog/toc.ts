export interface TocHeading {
  /** Rendered level: Markdown `#` is shown as an h2 on the article page. */
  level: 2 | 3;
  /** Plain heading text. */
  text: string;
  /** Unique, URL-safe element id. */
  id: string;
  /** 1-based source line of the heading (matches react-markdown's node positions). */
  line: number;
}

/** Heading text without inline Markdown (links, images, code, emphasis, escapes). */
export function headingText(source: string): string {
  return source
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(?<!\\)(\*\*|__|~~|[*_`])/g, '')
    .replace(/\\(.)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Anchor slug of a heading, like GitHub's: lowercase, letters and digits of any script
 * kept (Latin accents folded), everything else a "-" separator.
 */
export function headingSlug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns an id generator: the slug of the text ("section" when it has no letters or
 * digits), with "-2", "-3"… for repeats, like GitHub's heading anchors.
 */
export function createSlugger(): (text: string) => string {
  const counts = new Map<string, number>();
  const used = new Set<string>();
  return (text) => {
    const base = headingSlug(text) || 'section';
    let n = counts.get(base) ?? 0;
    let id = n ? `${base}-${n + 1}` : base;
    while (used.has(id)) id = `${base}-${++n + 1}`;
    counts.set(base, n + 1);
    used.add(id);
    return id;
  };
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const ATX = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;

/**
 * The article's h1–h3 headings (Markdown `#`/`##` render as h2, `###` as h3) in document
 * order with the ids the article page gives them. Headings inside fenced code blocks are
 * ignored; ATX (`## Title`) and setext (`Title\n---`) headings are both recognised.
 */
export function extractHeadings(markdown: string | null | undefined): TocHeading[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const slug = createSlugger();
  const headings: TocHeading[] = [];
  let fence: string | null = null;
  const add = (depth: number, raw: string, index: number) => {
    const text = headingText(raw);
    if (!text || depth > 3) return;
    headings.push({ level: depth <= 2 ? 2 : 3, text, id: slug(text), line: index + 1 });
  };

  lines.forEach((line, i) => {
    const marker = FENCE.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      return;
    }
    if (marker) {
      fence = marker;
      return;
    }
    if (/^( {4}|\t)/.test(line)) return;
    const atx = ATX.exec(line);
    if (atx) return add(atx[1]!.length, atx[2] ?? '', i);
    const next = lines[i + 1];
    const prev = lines[i - 1];
    // Setext: a paragraph line underlined by === or --- (not a list item / thematic break).
    if (
      next !== undefined &&
      SETEXT.test(next) &&
      line.trim() &&
      !/^ {0,3}([-*+>]|\d+[.)])\s/.test(line) &&
      (prev === undefined || !prev.trim())
    ) {
      add(next.trim().startsWith('=') ? 1 : 2, line, i);
    }
  });
  return headings;
}
