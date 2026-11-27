import type { Page } from '@playwright/test';
import { AUTH_STORAGE_KEY, signIn } from './fixtures/session';
import { expect, test } from './fixtures/test';

/** A dashboard tab link's name: its label, plus "N unread" on Messages. */
const tabName = (label: string) => new RegExp(`^${label}( \\d+ unread)?$`);

// F12: login, logout, tab routes (/admin/:tab) and the mobile menu sheet.

/** The dashboard nav: the sidebar, or the menu sheet (opened first) on narrow screens. */
async function sidebar(page: Page) {
  const open = page.getByRole('button', { name: 'Open menu' });
  if (await open.isVisible()) await open.click();
  return page.getByRole('navigation', { name: 'Dashboard' }).filter({ visible: true });
}

/** Footer actions (Back to Website, Logout) live beside the nav, in the sidebar or the sheet. */
async function chrome(page: Page) {
  const open = page.getByRole('button', { name: 'Open menu' });
  if (await open.isVisible()) {
    await open.click();
    return page.getByRole('dialog', { name: 'Dashboard menu' });
  }
  return page.locator('aside');
}

test.describe('login', () => {
  test('"Sign In with GitHub" starts the GitHub OAuth redirect', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In with GitHub' }).click();
    await page.waitForURL(/\/auth\/v1\/authorize\?/);
    expect(new URL(page.url()).searchParams.get('provider')).toBe('github');
  });

  test('a signed-in visitor is sent on to the dashboard', async ({ page }) => {
    await signIn(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Already logged in. Redirecting...')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'General Settings' })).toBeVisible();
  });
});

test.describe('dashboard shell', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'General Settings' })).toBeVisible();
  });

  const TABS: [label: string, heading: string][] = [
    ['Resume', 'Resume / CV Management'],
    ['Services', 'Services Management'],
    ['Projects', 'Manage Projects'],
    ['Blog', 'Manage Articles'],
    ['Messages', 'Inbox (1)'],
    ['Comments', 'Comments (1 pending)'],
    ['Certificates', 'Certificates'],
    ['Tech Stack', 'Tech Stack'],
    ['Overview', 'General Settings'],
  ];

  test('every sidebar entry shows its tab, marks itself current and focuses the heading', async ({
    page,
  }) => {
    for (const [label, heading] of TABS) {
      const link = (await sidebar(page)).getByRole('link', { name: tabName(label) });
      await link.click();
      const h1 = page.getByRole('heading', { level: 1, name: heading });
      await expect(h1).toBeVisible();
      await expect(h1).toBeFocused();
      const path =
        label === 'Overview' ? '/admin' : `/admin/${label.toLowerCase().replace(' ', '')}`;
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(
        (await sidebar(page)).getByRole('link', { name: tabName(label) }),
      ).toHaveAttribute('aria-current', 'page');
      // Close the sheet again (narrow screens) so the next round starts from the page.
      const close = page.getByRole('button', { name: 'Close menu' });
      if (await close.isVisible()) await close.click();
    }
  });

  test('a tab URL deep-links, survives refresh and back/forward', async ({ page }) => {
    await page.goto('/admin/blog');
    await expect(page.getByRole('heading', { level: 1, name: 'Manage Articles' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Manage Articles' })).toBeVisible();
    await (await sidebar(page)).getByRole('link', { name: tabName('Services') }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Services Management' }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/blog$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Manage Articles' })).toBeVisible();
    await page.goForward();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Services Management' }),
    ).toBeVisible();
  });

  test('an unknown tab (and /admin/overview) falls back to the overview', async ({ page }) => {
    for (const path of ['/admin/nope', '/admin/overview']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole('heading', { level: 1, name: 'General Settings' })).toBeVisible();
    }
  });

  test('unsaved edits ask before leaving the tab', async ({ page }) => {
    await page.getByLabel('Badge Text').fill('Changed');
    page.once('dialog', (d) => {
      expect(d.message()).toBe('You have unsaved changes. Leave without saving?');
      void d.dismiss();
    });
    await (await sidebar(page)).getByRole('link', { name: tabName('Blog') }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByLabel('Badge Text')).toHaveValue('Changed');
    const close = page.getByRole('button', { name: 'Close menu' });
    if (await close.isVisible()) await close.click();

    page.once('dialog', (d) => void d.accept());
    await (await sidebar(page)).getByRole('link', { name: tabName('Blog') }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Manage Articles' })).toBeVisible();
  });

  test('"Back to Website" leaves the dashboard', async ({ page }) => {
    await (await chrome(page)).getByRole('link', { name: 'Back to Website' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('logout signs out, toasts and leaves the dashboard', async ({ page, supabase }) => {
    await (await chrome(page)).getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByText('Logged out successfully')).toBeVisible();
    // F12 B1 fixed: a deliberate logout lands on the home page, never /login.
    await expect(page).toHaveURL(/\/$/);
    expect(supabase.requests.some((r) => r.path.startsWith('/auth/v1/logout'))).toBe(true);
    expect(await page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEY)).toBeNull();
  });

  test('mobile menu sheet: named close, Escape, focus trap and return, picking a tab', async ({
    page,
  }) => {
    const open = page.getByRole('button', { name: 'Open menu' });
    test.skip(!(await open.isVisible()), 'the sidebar is always shown at this width');
    const sheet = page.getByRole('dialog', { name: 'Dashboard menu' });

    await open.click();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(sheet).toBeVisible();
    // F12 B2/B3 fixed: the sheet's own close button is named and reachable.
    await sheet.getByRole('button', { name: 'Close menu' }).click();
    await expect(sheet).toHaveCount(0);
    await expect(open).toBeFocused();

    await open.click();
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(open).toBeFocused();

    await open.click();
    // Focus moves into the sheet (its close button first, as the site sheet) and stays there:
    // Shift+Tab from the first stop wraps to the last (Logout).
    await expect(sheet.getByRole('button', { name: 'Close menu' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(sheet.getByRole('button', { name: 'Logout' })).toBeFocused();

    await sheet.getByRole('link', { name: tabName('Blog') }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Manage Articles' })).toBeVisible();
  });
});
