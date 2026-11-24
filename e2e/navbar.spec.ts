import { expect, test } from './fixtures/test';

type Page = import('@playwright/test').Page;

const header = (page: Page) => page.locator('header[data-site-nav]');
const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const menuButton = (page: Page) => page.getByRole('button', { name: 'Open menu' });

test.describe('navbar (R4)', () => {
  test.describe('desktop bar', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('44px bar; aria-current follows the route; brand collapses past 48px and returns', async ({
      page,
    }) => {
      await page.goto('/blog');
      const bar = header(page);
      await expect.poll(async () => (await bar.boundingBox())?.height).toBe(44);
      await expect(mainNav(page).getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await mainNav(page).getByRole('link', { name: 'Projects', exact: true }).click();
      await expect(page).toHaveURL(/\/projects/);
      // The URL changes before React commits a view-transition navigation; scroll only once the new page is in,
      // or ScrollManager's scroll-to-top for the new entry lands after ours.
      await expect(page.getByRole('heading', { level: 1, name: /Projects/i })).toBeVisible();
      await expect(
        mainNav(page).getByRole('link', { name: 'Projects', exact: true }),
      ).toHaveAttribute('aria-current', 'page');
      await expect(
        mainNav(page).getByRole('link', { name: 'Blog', exact: true }),
      ).not.toHaveAttribute('aria-current');

      const home = bar.getByRole('link', { name: 'Ilham Ramadhan home' });
      const nameBox = () => page.locator('[data-brand-name]').boundingBox();
      const before = await nameBox();
      await expect(bar).not.toHaveAttribute('data-brand-collapsed');
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
      await expect(bar).toHaveAttribute('data-brand-collapsed', '');
      // Name keeps its box (nothing else moves) and the link keeps its accessible name.
      expect(await nameBox()).toEqual(before);
      await expect(home).toHaveAccessibleName('Ilham Ramadhan home');
      // Letters fade out (420ms track, staggered letters).
      await expect
        .poll(() =>
          page.evaluate(
            () => getComputedStyle(document.querySelector('.brand-letter:last-child')!).opacity,
          ),
        )
        .toBe('0');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await expect(bar).not.toHaveAttribute('data-brand-collapsed');
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

    test('keyboard focus on the home link shows the full name while collapsed', async ({
      page,
    }) => {
      await page.goto('/privacy');
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
      await expect(header(page)).toHaveAttribute('data-brand-collapsed', '');
      await page.keyboard.press('Tab'); // skip link
      await page.keyboard.press('Tab'); // home link
      await expect(header(page).getByRole('link', { name: 'Ilham Ramadhan home' })).toBeFocused();
      await expect
        .poll(() =>
          page.evaluate(
            () => getComputedStyle(document.querySelector('.brand-letter:last-child')!).opacity,
          ),
        )
        .toBe('1');
    });

    test('every chrome control is a 44px target with a visible focus ring', async ({ page }) => {
      await page.goto('/about');
      const controls = header(page).locator('a:visible, button:visible');
      const n = await controls.count();
      expect(n).toBeGreaterThan(5);
      for (let i = 0; i < n; i++) {
        const box = (await controls.nth(i).boundingBox())!;
        expect(box.height, `control ${i} height`).toBeGreaterThanOrEqual(44);
        expect(box.width, `control ${i} width`).toBeGreaterThanOrEqual(24);
      }
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(
        () => getComputedStyle(document.activeElement!).outlineStyle,
      );
      expect(outline).toBe('solid');
    });
  });

  test('skip link is the first focusable element and moves focus to main', async ({ page }) => {
    await page.goto('/about');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('locale switch keeps the current page, search and hash', async ({ page }) => {
    await page.goto('/projects?page=2');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if (await menuButton(page).isVisible()) await menuButton(page).click();
    const id = page.locator('a[data-locale-link="id"]:visible').first();
    await expect(id).toHaveAttribute('href', '/id/projects?page=2');
    await id.click();
    await expect(page).toHaveURL(/\/id\/projects\?page=2$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // And back, from the footer's language names.
    const en = page.getByRole('contentinfo').getByRole('link', { name: 'English' });
    await expect(en).toHaveAttribute('href', '/projects?page=2');
    await en.click();
    await expect(page).toHaveURL(/\/projects\?page=2$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.goto('/blog/blog-post-1#overview');
    if (await menuButton(page).isVisible()) await menuButton(page).click();
    await expect(page.locator('a[data-locale-link="id"]:visible').first()).toHaveAttribute(
      'href',
      '/id/blog/blog-post-1#overview',
    );
  });

  test.describe('mobile sheet', () => {
    test.use({ viewport: { width: 375, height: 740 } });

    test('traps focus, Esc closes and returns focus, page scroll and Lenis stop while open', async ({
      page,
    }) => {
      await page.goto('/about');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(mainNav(page)).toBeHidden();
      const trigger = menuButton(page);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('aria-controls', 'mobile-sheet');
      await trigger.click();
      const sheet = page.getByRole('dialog', { name: 'Menu' });
      await expect(sheet).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(sheet.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();
      await expect(sheet.getByRole('link', { name: 'Bahasa Indonesia' })).toBeVisible();
      await expect(sheet.getByRole('radiogroup', { name: 'Appearance' })).toBeVisible();
      // Scroll locked (and Lenis, where it runs, stopped).
      await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
      const lenisRunning = await page.evaluate(() =>
        document.documentElement.classList.contains('has-lenis'),
      );
      if (lenisRunning) await expect(page.locator('html')).toHaveClass(/lenis-stopped/);
      // Focus stays inside.
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      }
      await page.keyboard.press('Shift+Tab');
      expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
      if (lenisRunning) await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
    });

    test('closes on navigation', async ({ page }) => {
      await page.goto('/');
      await menuButton(page).click();
      const sheet = page.getByRole('dialog', { name: 'Menu' });
      await sheet.getByRole('link', { name: 'Blog', exact: true }).click();
      await expect(page).toHaveURL(/\/blog$/);
      await expect(sheet).toBeHidden();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('mobile sheet with Lenis', () => {
    // Lenis only runs on a fine pointer (desktop emulation) with motion allowed; a narrow window shows the sheet.
    test.use({ viewport: { width: 600, height: 900 } });

    test('stops Lenis while open and starts it again on close', async ({ page }) => {
      await page.goto('/about');
      await expect(page.locator('html')).toHaveClass(/has-lenis/, { timeout: 10_000 });
      await menuButton(page).click();
      await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
      await expect(page.locator('html')).toHaveClass(/lenis-stopped/);
      await page.getByRole('button', { name: 'Close menu' }).click();
      await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
      await expect(menuButton(page)).toBeFocused();
    });
  });
});
