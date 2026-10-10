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
    // Clipped = inside a scroll/hidden container that itself fits in the viewport.
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (
          getComputedStyle(p).overflowX !== 'visible' &&
          p.getBoundingClientRect().right <= vw + 1
        ) {
          return true;
        }
      }
      return false;
    };
    const sticksOut = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const visible = getComputedStyle(el).overflowX === 'visible';
      return rect.left + (visible ? Math.max(rect.width, el.scrollWidth) : rect.width) > vw + 1;
    };
    const candidates = [...document.querySelectorAll<HTMLElement>('body *')].filter(
      (el) => sticksOut(el) && !clipped(el),
    );
    return candidates
      .filter((el) => !candidates.some((other) => other !== el && el.contains(other)))
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

interface ShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: { node?: Node | null }[];
}

/**
 * Starts collecting Cumulative Layout Shift before the page boots (call before `goto`).
 * Read it with `cumulativeLayoutShift`.
 */
export async function observeLayoutShift(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: { value: number; sources: string[] } };
    w.__cls = { value: 0, sources: [] };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as ShiftEntry[]) {
        if (entry.hadRecentInput) continue;
        w.__cls.value += entry.value;
        for (const s of entry.sources ?? []) {
          const el = s.node instanceof Element ? s.node : s.node?.parentElement;
          if (el) w.__cls.sources.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80));
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

/** CLS so far and the elements that moved (for assertion messages). */
export function cumulativeLayoutShift(page: Page): Promise<{ value: number; sources: string[] }> {
  return page.evaluate(
    () => (window as unknown as { __cls: { value: number; sources: string[] } }).__cls,
  );
}
