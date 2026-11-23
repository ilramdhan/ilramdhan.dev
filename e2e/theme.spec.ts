import { expect, test } from './fixtures/test';

type Page = import('@playwright/test').Page;
const isDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'));
/** The forced theme; `null` = Auto (the CSS follows the OS). */
const dataTheme = (page: Page) =>
  page.evaluate(() => document.documentElement.getAttribute('data-theme'));
/** What the page actually paints (the token the whole palette hangs off). */
const pageSurface = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('theme (T-20)', () => {
  test('the saved theme is applied before the app boots (no flash)', async ({ page }) => {
    for (const saved of ['light', 'dark'] as const) {
      await page.addInitScript((t) => localStorage.setItem('theme', t), saved);
      // Block the app bundle: only the inline script in index.html can set the class.
      await page.route('**/assets/*.js', (route) => route.abort());
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      expect(await isDark(page)).toBe(saved === 'dark');
      expect(await dataTheme(page)).toBe(saved);
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
    expect(await dataTheme(page)).toBeNull();
    await expect.poll(() => pageSurface(page)).toBe('rgb(0, 0, 0)');
  });

  test('the toggle cycles Dark -> Light -> Auto and Auto follows the OS', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/privacy');
    const toggle = page
      .getByRole('button', { name: /^Switch to / })
      .filter({ visible: true })
      .first();
    await expect(toggle).toHaveAccessibleName('Switch to light theme');
    await toggle.click();
    await expect.poll(() => dataTheme(page)).toBe('light');
    expect(await isDark(page)).toBe(false);
    expect(await pageSurface(page)).toBe('rgb(255, 255, 255)');

    await expect(toggle).toHaveAccessibleName(/automatic theme/);
    await toggle.click();
    await expect.poll(() => dataTheme(page)).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('system');
    await expect.poll(() => isDark(page)).toBe(true);
    await expect.poll(() => pageSurface(page)).toBe('rgb(0, 0, 0)');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => isDark(page)).toBe(false);
    await expect.poll(() => pageSurface(page)).toBe('rgb(255, 255, 255)');

    await expect(toggle).toHaveAccessibleName('Switch to dark theme');
  });

  test('the 404 page respects the saved theme', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/nope');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/page not found/i);
    expect(await isDark(page)).toBe(false);
  });
});
