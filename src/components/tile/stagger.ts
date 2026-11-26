import type { CSSProperties } from 'react';

/**
 * Row stagger helper: the item's column index on the ≥1024px grid (`--col`), read by `.stagger-row` CSS so each visual
 * row restarts its scroll offset. It only sets a variable; the scroll-driven CSS is in global.css.
 */
export function colVar(index: number, columns: number): CSSProperties {
  return { '--col': index % Math.max(columns, 1) } as CSSProperties;
}
