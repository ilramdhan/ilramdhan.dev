/** The TOC is shown from this many headings on. */
export const TOC_MIN_HEADINGS = 3;
/** Balanced title lines; inline because the shared CSS bundle is at its budget. */
export const BALANCE = { textWrap: 'balance' } as const;
/**
 * Legacy frame (the project page, until R6a moves it onto tiles): header, cover, tags/share, prev/next, related and
 * comments span it edge to edge, so they share the same left and right edges (#122).
 */
export const CONTAINER = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8';
/** Legacy body + TOC grid (16rem = the aside's w-64). */
export const BODY_GRID = 'mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12';
/** Legacy article column (prose, gallery). */
export const BODY_COLUMN = 'min-w-0 max-w-176';
/**
 * Newsroom article body (mutugading insights article): TOC rail (13rem) | 680px column | empty rail, so the column
 * sits on the centre line of the 1180px wrap. Below 1024px: one column, TOC as a disclosure above the text.
 */
export const ARTICLE_GRID =
  'grid w-full gap-10 lg:grid-cols-[13rem_minmax(0,42.5rem)_13rem] lg:justify-between lg:gap-10';
/** The 680px reading column (17px text). */
export const ARTICLE_COLUMN = 'min-w-0 w-full lg:order-2';
