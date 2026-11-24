import { expect, test } from './fixtures/test';

// #113 → R5: featured articles on the home page are a row of linked groups (mutugading FamilyRow), no carousel.

test('featured articles: one linked group per post, crawlable, no carousel, no sideways scroll', async ({
  page,
  consoleErrors,
}) => {
  await page.goto('/#blog');
  const section = page.locator('#blog');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Featured Articles');
  // Dataset: four featured posts.
  const links = section.locator('ul > li > a');
  await expect(links).toHaveCount(4);
  await expect(links.first()).toHaveAttribute('href', '/blog/blog-post-1');
  await expect(links.first()).toContainText('Blog Post 1');
  await expect(section.locator('[aria-roledescription="carousel"]')).toHaveCount(0);
  await expect(section.getByRole('link', { name: 'Read Blog' })).toHaveAttribute('href', '/blog');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
  expect(consoleErrors).toEqual([]);
});

test('two featured posts are a row of two', async ({ page, supabase }) => {
  for (const blog of supabase.db.blogs ?? []) blog.is_featured = blog.id === 1 || blog.id === 2;
  // Client-side render (the prerendered home has the full dataset): go via another page.
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Back to Home' }).click();
  await expect(page.locator('#blog ul > li > a')).toHaveCount(2);
});

test('no featured posts shows the empty message', async ({ page, supabase }) => {
  for (const blog of supabase.db.blogs ?? []) blog.is_featured = false;
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Back to Home' }).click();
  await expect(page.getByText('No featured blog posts.')).toBeVisible();
});
