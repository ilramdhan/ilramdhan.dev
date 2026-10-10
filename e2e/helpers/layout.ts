import type { Page } from '@playwright/test';

/** Pixels the document is wider than the viewport (0 = no horizontal scroll). */
export function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
}

/**
 * Innermost elements whose box or content sticks out past the right edge of the
 * viewport and isn't clipped by a scrolling/hidden ancestor (for debugging overflow).
 */
export function overflowingElements(page: Page, limit = 5): Promise<string[]> {
  return page.evaluate((max) => {
    const vw = document.documentElement.clientWidth;
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (getComputedStyle(p).overflowX !== 'visible') return true;
      }
      return false;
    };
    const sticksOut = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const visible = getComputedStyle(el).overflowX === 'visible';
      return rect.left + (visible ? Math.max(rect.width, el.scrollWidth) : rect.width) > vw + 1;
    };
    return [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => sticksOut(el) && !clipped(el) && ![...el.children].some(sticksOut))
      .slice(0, max)
      .map((el) => {
        const classes = [...el.classList].slice(0, 4).join('.');
        const text = (el.textContent ?? '').trim().slice(0, 30);
        return `${el.tagName.toLowerCase()}${classes ? '.' + classes : ''}${text ? ` "${text}"` : ''}`;
      });
  }, limit);
}

/** Number of CSS/WAAPI animations currently running (for reduced-motion checks). */
export function runningAnimations(page: Page): Promise<number> {
  return page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === 'running').length,
  );
}

/**
 * Starts a layout-shift observer in the page; call the returned function later
 * to read the cumulative layout shift (CLS) so far.
 */
export async function observeCls(page: Page): Promise<() => Promise<number>> {
  await page.evaluate(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (!entry.hadRecentInput) w.__cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  return () => page.evaluate(() => (window as unknown as { __cls: number }).__cls);
}
