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

/** Picks Light / Dark / Auto in the chrome: the nav menu (>= 834px) or the mobile sheet's radio group. */
async function pickTheme(page: Page, name: 'Light' | 'Dark' | 'Auto') {
  const menuButton = page.locator('[data-theme-toggle]');
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.getByRole('menuitemradio', { name }).click();
    return;
  }
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('radio', { name }).click();
  await page.keyboard.press('Escape');
}

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

  test('Light / Dark / Auto: the choice applies, persists, and Auto follows the OS', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    await pickTheme(page, 'Light');
    await expect.poll(() => dataTheme(page)).toBe('light');
    expect(await isDark(page)).toBe(false);
    await expect.poll(() => pageSurface(page)).toBe('rgb(255, 255, 255)');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

    await pickTheme(page, 'Auto');
    await expect.poll(() => dataTheme(page)).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('system');
    await expect.poll(() => isDark(page)).toBe(true);
    await expect.poll(() => pageSurface(page)).toBe('rgb(0, 0, 0)');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => isDark(page)).toBe(false);
    await expect.poll(() => pageSurface(page)).toBe('rgb(255, 255, 255)');

    await pickTheme(page, 'Dark');
    await expect.poll(() => dataTheme(page)).toBe('dark');
    await expect.poll(() => pageSurface(page)).toBe('rgb(0, 0, 0)');
    await page.reload();
    expect(await dataTheme(page)).toBe('dark');
  });

  test('the nav theme menu is keyboard operable and names the current choice', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the menu button is >= 834px only');
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/privacy');
    const button = page.locator('[data-theme-toggle]');
    await expect(button).toHaveAccessibleName('Appearance: Light');
    await button.focus();
    await page.keyboard.press('ArrowDown');
    const menu = page.getByRole('menu', { name: 'Appearance' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitemradio', { name: 'Light' })).toBeFocused();
    await expect(menu.getByRole('menuitemradio', { name: 'Light' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
    await expect(button).toHaveAccessibleName('Appearance: Dark');
    await expect.poll(() => dataTheme(page)).toBe('dark');
    await button.click();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('F-13: the new theme grows as a circle from the control, scoped to the switch', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // Record every View Transition animation (the root reveal and route fades) by name.
      const w = window as unknown as { vtNames: string[] };
      w.vtNames = [];
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = ((cb: () => void) => {
        const vt = start(cb);
        void vt.ready.then(() => {
          for (const a of document.documentElement.getAnimations({ subtree: true }))
            w.vtNames.push((a as CSSAnimation).animationName);
        });
        return vt;
      }) as typeof document.startViewTransition;
    });
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/privacy');
    const toggle = page.locator('[data-theme-toggle]');
    const desktop = await toggle.isVisible();
    await pickTheme(page, 'Dark');
    await expect.poll(() => dataTheme(page)).toBe('dark');
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { vtNames: string[] }).vtNames))
      .toContain('theme-reveal');
    // Starts from the toggle's centre (nav button on desktop, the picked radio in the sheet).
    const from = await page.evaluate(() => ({
      x: parseFloat(document.documentElement.style.getPropertyValue('--vt-x')),
      y: parseFloat(document.documentElement.style.getPropertyValue('--vt-y')),
    }));
    if (desktop) {
      const box = (await toggle.boundingBox())!;
      expect(Math.abs(from.x - (box.x + box.width / 2))).toBeLessThan(2);
      expect(Math.abs(from.y - (box.y + box.height / 2))).toBeLessThan(2);
    }
    // The scope class goes away, so a route change afterwards only gets the page fade.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('theme-vt')))
      .toBe(false);
    await page.evaluate(() => {
      (window as unknown as { vtNames: string[] }).vtNames = [];
    });
    await page.getByRole('contentinfo').getByRole('link', { name: 'Terms' }).first().click();
    await expect(page).toHaveURL(/\/terms$/);
    const names = await page.evaluate(() => (window as unknown as { vtNames: string[] }).vtNames);
    expect(names).not.toContain('theme-reveal');
  });

  test.describe('reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });
    test('the switch is instant (no View Transition)', async ({ page }) => {
      await page.addInitScript(() => {
        const w = window as unknown as { vtCount: number };
        w.vtCount = 0;
        const start = document.startViewTransition.bind(document);
        document.startViewTransition = ((cb: () => void) => {
          w.vtCount++;
          return start(cb);
        }) as typeof document.startViewTransition;
      });
      await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
      await page.goto('/privacy');
      await pickTheme(page, 'Light');
      await expect.poll(() => dataTheme(page)).toBe('light');
      expect(await page.evaluate(() => (window as unknown as { vtCount: number }).vtCount)).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.classList.contains('theme-vt')),
      ).toBe(false);
    });
  });

  test('the 404 page respects the saved theme', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/nope');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/page not found/i);
    expect(await isDark(page)).toBe(false);
  });
});
