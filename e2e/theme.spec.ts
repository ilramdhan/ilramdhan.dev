import { expect, test } from './fixtures/test';

const isDark = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'));

test.describe('theme (T-20)', () => {
  test('the saved theme is applied before the app boots (no flash)', async ({ page }) => {
    for (const saved of ['light', 'dark'] as const) {
      await page.addInitScript((t) => localStorage.setItem('theme', t), saved);
      // Block the app bundle: only the inline script in index.html can set the class.
      await page.route('**/assets/*.js', (route) => route.abort());
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      expect(await isDark(page)).toBe(saved === 'dark');
      await page.unroute('**/assets/*.js');
    }
  });

  test.describe('first visit follows the OS preference', () => {
    test.use({ colorScheme: 'light' });
    test('light OS, nothing saved', async ({ page }) => {
      await page.addInitScript(() => localStorage.removeItem('theme'));
      await page.goto('/privacy');
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      expect(await isDark(page)).toBe(false);
    });
  });

  test('system mode follows OS changes', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'system'));
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    expect(await isDark(page)).toBe(false);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => isDark(page)).toBe(true);
  });

  test('the 404 page respects the saved theme', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/nope');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/page not found/i);
    expect(await isDark(page)).toBe(false);
  });
});
