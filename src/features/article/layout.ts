/** The TOC is shown from this many headings on. */
export const TOC_MIN_HEADINGS = 3;
/** Balanced title lines; inline because the shared CSS bundle is at its budget. */
export const BALANCE = { textWrap: 'balance' } as const;
/**
 * One frame for every section (#122): header, cover, tags/share, prev/next, related and
 * comments span it edge to edge, so they share the same left and right edges.
 */
export const CONTAINER = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8';
/** Body + TOC (16rem = the aside's w-64): the TOC's right edge is the frame's right edge. */
export const BODY_GRID = 'mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12';
/**
 * Article column (prose, gallery), left aligned with the frame. 44rem is ~70ch of the
 * prose-lg text: with the TOC the grid track (41rem at 1280 px) is narrower, so the column
 * fills it; without a TOC it keeps the measure instead of stretching to the frame.
 */
export const BODY_COLUMN = 'min-w-0 max-w-[44rem]';
