/** The TOC is shown from this many headings on. */
export const TOC_MIN_HEADINGS = 3;
/**
 * Newsroom article body (mutugading insights article): TOC rail (13rem) | 680px column | empty rail, so the column
 * sits on the centre line of the 1180px wrap. Below 1024px: one column, TOC as a disclosure above the text.
 */
export const ARTICLE_GRID =
  'grid w-full gap-10 lg:grid-cols-[13rem_minmax(0,42.5rem)_13rem] lg:justify-between lg:gap-10';
/** The 680px reading column (17px text). */
export const ARTICLE_COLUMN = 'min-w-0 w-full lg:order-2';
