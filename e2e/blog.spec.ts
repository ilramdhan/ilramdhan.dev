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

test('blog sort=oldest is sent as order=published_at.asc, restored from the URL, and cleared', async ({
  page,
  supabase,
}) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writings');
  const sort = page.getByLabel('Sort articles');
  await expect(sort).toHaveValue('newest');

  await sort.selectOption('oldest');
  await expect(page).toHaveURL(/[?&]sort=oldest/);
  await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  await expect
    .poll(() =>
      supabase.requests.some(
        (r) => r.path.startsWith('/rest/v1/blogs') && r.path.includes('order=published_at.asc'),
      ),
    )
    .toBe(true);

  await page.reload();
  await expect(page.getByLabel('Sort articles')).toHaveValue('oldest');

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).not.toHaveURL(/sort=/);
  await expect(page.getByLabel('Sort articles')).toHaveValue('newest');
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
});

test('blog search matches the excerpt too and shows a result line', async ({ page, supabase }) => {
  const template = supabase.db.blogs?.[0] ?? {};
  supabase.db.blogs = [
    ...(supabase.db.blogs ?? []),
    { ...template, id: 200, slug: 'ex', title: 'Unrelated', excerpt: 'mentions zebrafish here' },
  ];
  await page.goto('/blog?q=zebrafish');
  await expect(page.getByRole('heading', { level: 2, name: 'Unrelated' })).toBeVisible();
  await expect(page.getByText(/1 article for/)).toBeVisible();
});
