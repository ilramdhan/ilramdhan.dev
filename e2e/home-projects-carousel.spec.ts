import { expect, test } from './fixtures/test';

// T-59 (#137): featured projects on the home page use the same carousel as featured articles.

test('featured projects: carousel with labelled slides; next button scrolls', async ({
  page,
  consoleErrors,
}, testInfo) => {
  await page.goto('/#projects');
  const carousel = page.getByRole('region', { name: 'Featured projects' });
  await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
  // Dataset: four featured projects.
  const slides = carousel.locator('li[aria-roledescription="slide"]');
  await expect(slides).toHaveCount(4);
  await expect(slides.first()).toHaveAttribute('aria-label', '1 of 4');
  await expect(slides.first().getByRole('heading', { level: 3 })).toHaveText('Project 1');

  const prev = carousel.getByRole('button', { name: 'Previous projects' });
  const next = carousel.getByRole('button', { name: 'Next projects' });
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();

  const track = page.getByTestId('featured-projects-track');
  await next.click();
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(prev).toBeEnabled();
  if (testInfo.project.name === 'desktop') {
    // Three cards per view at 1280px: one step reaches the end, and the 4th card is painted.
    await expect(next).toBeDisabled();
    await expect(slides.last().locator('.group').first()).toHaveCSS('opacity', '1');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
  expect(consoleErrors).toEqual([]);
});

test('three featured projects or fewer are a plain grid', async ({ page, supabase }) => {
  for (const p of supabase.db.projects ?? []) p.is_featured = p.id === 1 || p.id === 2;
  // Client-side render (the prerendered home has the full dataset): go via another page.
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Home', exact: true }).click();
  const section = page.locator('#projects');
  await expect(section.getByRole('heading', { level: 3 })).toHaveCount(2);
  await expect(section.getByRole('region', { name: 'Featured projects' })).toHaveCount(0);
  await expect(section.getByRole('button', { name: 'Next projects' })).toHaveCount(0);
});

test('no featured projects shows the empty message', async ({ page, supabase }) => {
  for (const p of supabase.db.projects ?? []) p.is_featured = false;
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByText('No featured projects yet.')).toBeVisible();
});

test('the featured query asks for up to 9 projects', async ({ page, supabase }) => {
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Featured projects' })).toBeVisible();
  expect(
    supabase.requests.some(
      (r) =>
        r.path.startsWith('/rest/v1/projects') &&
        r.path.includes('is_featured=eq.true') &&
        r.path.includes('limit=9'),
    ),
  ).toBe(true);
});
