import { expect, test } from './fixtures/test';

// T-30 (#45): scroll restoration, anchor scrolling under the fixed navbar, transitions.

test('back/forward restores the previous scroll position', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Project 1', { exact: true }).first()).toBeAttached();
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(600);
  const before = await page.evaluate(() => Math.round(window.scrollY));

  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Privacy Policy');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.goBack();
  await expect(page.getByText('Project 1', { exact: true }).first()).toBeAttached();
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5000 })
    .toBeGreaterThan(before - 40);
});

test('/#contact from another page lands with the heading below the navbar', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  const contact = page.getByRole('link', { name: 'Contact', exact: true }).first();
  if (!(await contact.isVisible())) {
    await page.locator('nav button:has(svg.lucide-menu)').click();
  }
  await contact.click();
  const heading = page.getByRole('heading', { name: 'Get In Touch' });
  await expect(heading).toBeVisible();
  await expect
    .poll(
      async () => {
        const [box, nav] = await Promise.all([
          heading.boundingBox(),
          page.locator('nav').first().boundingBox(),
        ]);
        return box && nav ? box.y >= nav.y + nav.height : false;
      },
      { timeout: 5000 },
    )
    .toBe(true);
  await expect(page).toHaveURL(/\/#contact$/);
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('route change plays no transition animation', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    const running = await page.evaluate(() =>
      document.getAnimations().map((a) => (a as CSSAnimation).animationName ?? a.constructor.name),
    );
    expect(running).toEqual([]);
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  });
});
