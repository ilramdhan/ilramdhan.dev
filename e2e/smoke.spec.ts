import { expect, test } from './fixtures/test';
import {
  cumulativeLayoutShift,
  horizontalOverflow,
  observeLayoutShift,
  overflowingElements,
  runningAnimations,
} from './helpers/layout';
import { PUBLIC_ROUTES } from './routes';

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} (${route.path}) renders its H1 and footer version, no console errors, no horizontal scroll`, async ({
    page,
    consoleErrors,
  }, testInfo) => {
    await page.clock.install();
    await page.goto(route.path);
    const h1 = page.getByRole('heading', { level: 1 }).first();
    if (route.h1 === null) {
      await expect(h1).toBeVisible();
    } else {
      await expect(h1).toHaveText(route.h1);
    }
    await page.waitForLoadState('networkidle');
    expect(consoleErrors, 'console errors').toEqual([]);
    // Footer shows the deployed version, linking to its GitHub Release (T-57).
    const version = page.getByTestId('app-version');
    await expect(version).toHaveText(/^v\d+\.\d+\.\d+/);
    await expect(version).toHaveAttribute('href', /\/releases\/tag\/v\d+\.\d+\.\d+/);
    // Freeze timers/animation frames: the home page's WebGL loops otherwise make
    // every following page.evaluate crawl under software rendering.
    await page.clock.pauseAt(Date.now() + 60_000);

    if (testInfo.project.name === 'reduced-motion') {
      // Report-only until the motion system work lands (PLAN §3.8).
      testInfo.annotations.push({
        type: 'running animations (reduced motion)',
        description: String(await runningAnimations(page)),
      });
    }

    const overflow = await horizontalOverflow(page);
    const culprits = overflow > 0 ? (await overflowingElements(page)).join(', ') : '';
    expect(overflow, `px of horizontal overflow (elements past the right edge: ${culprits})`).toBe(
      0,
    );

    // Navbar: every visible control stays inside the viewport (no clipped links at 768).
    const clipped = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      return [...document.querySelectorAll<HTMLElement>('nav button, nav a')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && (r.left < -1 || r.right > vw + 1)).length;
    });
    expect(clipped, 'navbar controls outside the viewport').toBe(0);
  });
}

// T-26 (#41): CLS < 0.1 on home and every list/detail page at every matrix width. Data
// arrives 600 ms late (like a cold Supabase request) so skeleton -> content swaps count.
const CLS_ROUTES = PUBLIC_ROUTES.filter((r) => !['login', 'privacy', 'terms'].includes(r.name));
for (const route of CLS_ROUTES) {
  test(`${route.name} (${route.path}) layout shift stays under 0.1`, async ({ page }) => {
    await observeLayoutShift(page);
    await page.route('https://mock.supabase.co/**', async (r) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await r.fallback();
    });
    await page.goto(route.path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    // Let late images/fonts settle; CLS is read after everything has rendered.
    await page.waitForTimeout(500);
    const cls = await cumulativeLayoutShift(page);
    expect(cls.value, `CLS (moved: ${[...new Set(cls.sources)].join(', ')})`).toBeLessThan(0.1);
  });
}

for (const path of ['/this-page-does-not-exist', '/blog/unknown-slug', '/projects/unknown-slug']) {
  test(`unknown URL ${path} shows the 404 page with navbar and footer`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/page not found/i);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByTestId('app-version')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
}

test('hero: copy and CTA never overlap the 3D card, which only renders from lg', async ({
  page,
}, testInfo) => {
  await page.clock.install();
  await page.goto('/');
  const h1 = page.getByRole('heading', { level: 1 }).first();
  await expect(h1).toBeVisible();
  const width = page.viewportSize()?.width ?? 0;
  const canvas = page.locator('section').first().locator('canvas');
  if (width < 1024) {
    await expect(canvas).toHaveCount(0);
    return;
  }
  if (testInfo.project.name === 'reduced-motion') {
    // T-25: no WebGL under reduced motion; a static poster fills the card's box instead.
    await expect(page.getByTestId('hero-card-poster')).toBeVisible();
    await expect(canvas).toHaveCount(0);
  } else {
    await expect(canvas.first()).toBeAttached();
  }
  const cta = page.getByRole('button', { name: /view projects/i });
  const box = async (l: import('@playwright/test').Locator) => (await l.boundingBox())!;
  const [h, c] = [await box(h1), await box(cta)];
  // The card is parked in the right half (x offset 2.5 of a >= 10 wide canvas).
  const half = width / 2;
  expect(h.x + h.width, 'H1 stays in the left column').toBeLessThanOrEqual(half + 40);
  expect(c.x + c.width, 'CTA stays in the left column').toBeLessThanOrEqual(half + 40);
});
