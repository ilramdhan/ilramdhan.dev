import type { Page } from '@playwright/test';
import { AUTH_STORAGE_KEY, signIn } from './fixtures/session';
import { expect, test } from './fixtures/test';

// F12 step 1: login, logout, tab switching and the mobile sidebar, proven before the redesign.

/** Opens the sidebar on narrow screens (no-op when the desktop sidebar is shown). */
async function sidebar(page: Page) {
  const open = page.getByRole('button', { name: 'Open menu' });
  if (await open.isVisible()) await open.click();
  return page.locator('aside:visible');
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
    ['Certificates', 'Certificates'],
    ['Tech Stack', 'Tech Stack'],
    ['Overview', 'General Settings'],
  ];

  test('every sidebar entry shows its tab', async ({ page }) => {
    for (const [label, heading] of TABS) {
      await (await sidebar(page)).getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });

  test('"Back to Website" leaves the dashboard', async ({ page }) => {
    await (await sidebar(page)).getByRole('link', { name: 'Back to Website' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('logout signs out, toasts and leaves the dashboard', async ({ page, supabase }) => {
    await (await sidebar(page)).getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByText('Logged out successfully')).toBeVisible();
    // Bug (F12 inventory B1): handleLogout navigates to '/', but AdminRoute redirects the
    // signed-out user to /login first, so that is where it ends. Accept both until step 2 decides.
    await expect(page).toHaveURL(/\/(login)?$/);
    expect(supabase.requests.some((r) => r.path.startsWith('/auth/v1/logout'))).toBe(true);
    expect(await page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEY)).toBeNull();
  });

  test('mobile sidebar opens, closes (toggle, backdrop, picking a tab)', async ({ page }) => {
    const open = page.getByRole('button', { name: 'Open menu' });
    test.skip(!(await open.isVisible()), 'desktop sidebar is always shown at this width');
    const menu = page.locator('aside:visible');

    await open.click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(menu).toBeVisible();
    // Bug (F12 inventory B2): the open sheet covers the "Close menu" toggle, so close with the
    // sheet's own X (no accessible name yet: the first button inside the sheet).
    await menu.getByRole('button').first().click();
    await expect(menu).toHaveCount(0);

    await open.click();
    await expect(menu).toBeVisible();
    // The backdrop covers everything right of the 256px sheet.
    const { width, height } = page.viewportSize()!;
    await page.mouse.click(width - 10, height / 2);
    await expect(menu).toHaveCount(0);

    await open.click();
    await menu.getByRole('button', { name: 'Blog', exact: true }).click();
    await expect(menu).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Manage Articles' })).toBeVisible();
  });
});
