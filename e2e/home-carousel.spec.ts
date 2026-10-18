import { expect, test } from './fixtures/test';

// #113: featured articles on the home page.

test('featured articles: carousel with labelled slides; next button scrolls', async ({
  page,
  consoleErrors,
}, testInfo) => {
  await page.goto('/#blog');
  const carousel = page.getByRole('region', { name: 'Featured articles' });
  await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
  // Dataset: four featured posts.
  const slides = carousel.locator('li[aria-roledescription="slide"]');
  await expect(slides).toHaveCount(4);
  await expect(slides.first()).toHaveAttribute('aria-label', '1 of 4');

  const prev = carousel.getByRole('button', { name: 'Previous articles' });
  const next = carousel.getByRole('button', { name: 'Next articles' });
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();

  const track = page.getByTestId('featured-track');
  await next.click();
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(prev).toBeEnabled();
  if (testInfo.project.name === 'desktop') {
    // Three cards per view at 1280px: one step reaches the end.
    await expect(next).toBeDisabled();
  }
  // The track never widens the page.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
  expect(consoleErrors).toEqual([]);
});

test('three featured posts or fewer are a plain grid', async ({ page, supabase }) => {
  for (const blog of supabase.db.blogs ?? []) blog.is_featured = blog.id === 1 || blog.id === 2;
  // Client-side render (the prerendered home has the full dataset): go via another page.
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Home', exact: true }).click();
  const section = page.locator('#blog');
  await expect(section.getByRole('heading', { level: 3 })).toHaveCount(2);
  await expect(section.getByRole('region', { name: 'Featured articles' })).toHaveCount(0);
  await expect(section.getByRole('button', { name: 'Next articles' })).toHaveCount(0);
});

test('no featured posts shows the empty message', async ({ page, supabase }) => {
  for (const blog of supabase.db.blogs ?? []) blog.is_featured = false;
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByText('No featured blog posts.')).toBeVisible();
});
