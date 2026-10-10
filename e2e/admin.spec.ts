import { expect, test } from './fixtures/test';

test('/admin redirects anonymous visitors to /login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Admin login');
});
