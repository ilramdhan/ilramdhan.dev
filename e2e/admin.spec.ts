import { expect, test } from './fixtures/test';
import { signIn, AUTH_STORAGE_KEY } from './fixtures/session';
import { RPC_NOT_FOUND } from './fixtures/supabase-mock';

test('/admin redirects anonymous visitors to /login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Admin login');
});

// Desktop and mobile variants of the same buttons exist; count hidden ones too.
const dashboardButton = { name: 'Dashboard', includeHidden: true } as const;
const logoutButton = { name: 'Logout', includeHidden: true } as const;

test.describe('admin allowlist (T-08)', () => {
  test('anonymous visitors see no "Dashboard" button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', dashboardButton)).toHaveCount(0);
  });

  test('an allowlisted admin gets the dashboard and the navbar entry', async ({ page }) => {
    await signIn(page);
    await page.goto('/');
    await expect(page.getByRole('link', dashboardButton).first()).toBeAttached();

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('button', logoutButton).first()).toBeAttached();
  });

  test('a signed-in non-admin is signed out and redirected home', async ({ page, supabase }) => {
    supabase.rpc.is_admin = { status: 200, body: false };
    await signIn(page);
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText('This account is not allowed to access the dashboard.'),
    ).toBeVisible();
    await expect(page.getByRole('link', dashboardButton)).toHaveCount(0);
    // Signed out: supabase-js called /logout and dropped the stored session.
    await expect
      .poll(() => supabase.requests.some((r) => r.path.startsWith('/auth/v1/logout')))
      .toBe(true);
    expect(await page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEY)).toBeNull();
  });

  test('before the migration (no is_admin function) a signed-in user keeps access', async ({
    page,
    supabase,
  }) => {
    supabase.rpc.is_admin = RPC_NOT_FOUND;
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    await signIn(page);
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('button', logoutButton).first()).toBeAttached();
    expect(warnings.some((w) => w.includes('public.is_admin() not found'))).toBe(true);
  });

  test('a failed admin check offers a retry instead of guessing', async ({ page, supabase }) => {
    supabase.rpc.is_admin = { status: 500, body: { message: 'boom' } };
    await signIn(page);
    await page.goto('/admin');

    await expect(page.getByRole('alert')).toContainText("Couldn't verify admin access");
    supabase.rpc.is_admin = { status: 200, body: true };
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('button', logoutButton).first()).toBeAttached();
  });
});
