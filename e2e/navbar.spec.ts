import { expect, test } from './fixtures/test';

test.describe('navbar pill and blog sort chevron', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  async function expectPillOnActive(page: import('@playwright/test').Page) {
    const pill = page.getByTestId('nav-pill');
    const active = page.locator('nav [aria-current="page"]').first();
    await expect
      .poll(
        async () => {
          const [p, a] = await Promise.all([pill.boundingBox(), active.boundingBox()]);
          if (!p || !a) return false;
          return (
            Math.abs(p.x - a.x) <= 1 &&
            Math.abs(p.y - a.y) <= 1 &&
            Math.abs(p.width - a.width) <= 1 &&
            Math.abs(p.height - a.height) <= 1
          );
        },
        { timeout: 5000 },
      )
      .toBe(true);
  }

  test('pill matches the active link after navigation and after the navbar compacts', async ({
    page,
  }) => {
    await page.goto('/blog');
    await expectPillOnActive(page);
    await page.locator('nav').getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expectPillOnActive(page);
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await expect(page.locator('nav[data-scrolled="true"]')).toBeVisible();
    await expectPillOnActive(page);
  });

  test('sort select chevron is visible with at least 12px inset', async ({ page }) => {
    await page.goto('/blog');
    const select = page.locator('#blog-sort');
    const chevron = select.locator('xpath=following-sibling::*[local-name()="svg"]');
    await expect(chevron).toBeVisible();
    const [s, c] = await Promise.all([select.boundingBox(), chevron.boundingBox()]);
    expect(s && c).toBeTruthy();
    expect(s!.x + s!.width - (c!.x + c!.width)).toBeGreaterThanOrEqual(12);
    expect(c!.x).toBeGreaterThan(s!.x);
    expect(c!.y).toBeGreaterThanOrEqual(s!.y);
    expect(c!.y + c!.height).toBeLessThanOrEqual(s!.y + s!.height);
  });
});
