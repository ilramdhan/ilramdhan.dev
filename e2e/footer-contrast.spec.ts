import { expect, test } from './fixtures/test';

/**
 * F-9: the curtain lift is only felt when the page's last tile is a different tone from the parchment footer under
 * it. Reads the painted background at the bottom edge of `main` (first opaque ancestor of the element there) and
 * the footer's, on every public route, EN + ID, both themes.
 */
const PATHS = [
  '/',
  '/projects',
  '/projects/project-1',
  '/blog',
  '/blog/blog-post-1',
  '/about',
  '/certificates',
  '/privacy',
  '/terms',
  '/contact',
  '/nope',
];

for (const theme of ['light', 'dark'] as const) {
  test.describe(`last tile vs footer (${theme})`, () => {
    test.use({ theme, colorScheme: theme });
    for (const base of PATHS) {
      for (const path of [base, base === '/' ? '/id' : `/id${base}`]) {
        test(path, async ({ page }) => {
          await page.goto(path);
          await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
          const { last, footer } = await page.evaluate(() => {
            const opaque = (el: Element | null) => {
              for (; el; el = el.parentElement) {
                const bg = getComputedStyle(el).backgroundColor;
                if (bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
              }
              return null;
            };
            // Deepest element under main's bottom edge at its centre (geometry: no scrolling, no hit testing).
            const main = document.getElementById('main')!;
            const r = main.getBoundingClientRect();
            const x = r.left + r.width / 2;
            let hit: Element = main;
            for (const el of main.querySelectorAll('*')) {
              const b = el.getBoundingClientRect();
              if (
                b.width &&
                b.bottom >= r.bottom - 2 &&
                b.top < r.bottom - 2 &&
                b.left <= x &&
                b.right >= x
              )
                hit = el;
            }
            return {
              last: opaque(hit),
              footer: opaque(document.querySelector('[data-reveal-footer]')),
            };
          });
          expect(last, 'the bottom of main paints a background').not.toBeNull();
          expect(last).not.toBe(footer);
        });
      }
    }
  });
}
