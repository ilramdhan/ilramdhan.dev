import { expect, test } from './fixtures/test';

// Regression for T-18 (#33): clicking a tag must filter the query server-side.
test('blog tag filter sends tags=cs.{tag} and shows only matching posts', async ({
  page,
  supabase,
}) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writings');
  await expect(page.getByText('Blog Post 1', { exact: true })).toBeVisible();

  const filtered = page.waitForRequest(
    (req) =>
      req.url().includes('/rest/v1/blogs') &&
      decodeURIComponent(req.url()).includes('tags=cs.{react}'),
  );
  await page.getByRole('button', { name: /^#?react$/ }).click();
  await filtered;

  // Dataset: even ids are tagged "react", odd ids "go".
  await expect(page.getByText('Blog Post 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Blog Post 1', { exact: true })).toHaveCount(0);
  expect(
    supabase.requests.some(
      (r) => r.path.startsWith('/rest/v1/blogs') && r.path.includes('tags=cs.{react}'),
    ),
  ).toBe(true);
});
