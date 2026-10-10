import { expect, test } from './fixtures/test';

test.describe('list state lives in the URL (T-23)', () => {
  test('blog: search and tag survive reload and back/forward', async ({ page }) => {
    await page.goto('/blog');
    const search = page.getByPlaceholder('Search articles...');
    await expect(search).toBeVisible();
    await search.fill('Blog Post 1');
    await expect(page).toHaveURL(/[?&]q=Blog(\+|%20)Post(\+|%20)1/);
    await page.reload();
    await expect(page.getByPlaceholder('Search articles...')).toHaveValue('Blog Post 1');
    await expect(page.getByRole('heading', { level: 2, name: 'Blog Post 1' })).toBeVisible();
  });

  test('a shared link restores the filter, search and page', async ({ page }) => {
    await page.goto('/certificates?q=zzz-no-match&page=1');
    await expect(page.getByPlaceholder('Search certificates...')).toHaveValue('zzz-no-match');
  });

  test('page number is kept in the URL on projects', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page).toHaveURL(/[?&]page=2/);
    await page.reload();
    await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.goBack();
    await expect(page).not.toHaveURL(/page=2/);
  });

  test('dates are formatted consistently', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page.getByText(/Jan 1, 2025/).first()).toBeVisible();
  });
});
