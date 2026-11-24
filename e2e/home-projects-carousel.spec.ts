import { expect, test } from './fixtures/test';

// T-59 (#137) → R5: featured projects on the home page are a row of linked groups (mutugading FamilyRow).

test('featured projects: one linked group per project, no carousel, no sideways scroll', async ({
  page,
  consoleErrors,
}) => {
  await page.goto('/#projects');
  const section = page.locator('#projects');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Featured Projects');
  // Dataset: four featured projects.
  const links = section.locator('ul > li > a');
  await expect(links).toHaveCount(4);
  await expect(links.first()).toHaveAttribute('href', '/projects/project-1');
  await expect(links.first()).toContainText('Project 1');
  await expect(links.first().locator('img')).toHaveAttribute('alt', 'Screenshot of Project 1');
  await expect(section.locator('[aria-roledescription="carousel"]')).toHaveCount(0);
  // Every group is painted (the row stagger only translates, never fades).
  await links.last().scrollIntoViewIfNeeded();
  await expect(links.last()).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
  expect(consoleErrors).toEqual([]);
});

test('two featured projects are a row of two', async ({ page, supabase }) => {
  for (const p of supabase.db.projects ?? []) p.is_featured = p.id === 1 || p.id === 2;
  // Client-side render (the prerendered home has the full dataset): go via another page.
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Back to Home' }).click();
  await expect(page.locator('#projects ul > li > a')).toHaveCount(2);
});

test('no featured projects shows the empty message', async ({ page, supabase }) => {
  for (const p of supabase.db.projects ?? []) p.is_featured = false;
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Back to Home' }).click();
  await expect(page.getByText('No featured projects yet.')).toBeVisible();
});

test('the featured query asks for up to 9 projects', async ({ page, supabase }) => {
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Back to Home' }).click();
  await expect(page.locator('#projects ul > li > a').first()).toBeVisible();
  expect(
    supabase.requests.some(
      (r) =>
        r.path.startsWith('/rest/v1/projects') &&
        r.path.includes('is_featured=eq.true') &&
        r.path.includes('limit=9'),
    ),
  ).toBe(true);
});

test('hero counts come from the database and hide when unknown', async ({ page, supabase }) => {
  supabase.db.certificates = [];
  await page.goto('/no-such-page');
  await page.getByRole('main').getByRole('link', { name: 'Back to Home' }).click();
  const specs = page.locator('section[data-enter] dl');
  // Dataset: 9 projects, 8 posts, 5 tools; 0 certificates = hidden, never "0".
  await expect(specs.locator('dd .sr-only')).toHaveText(['9', '8', '5']);
  await expect(specs.locator('dt')).toHaveText([
    'projects built',
    'articles written',
    'technologies in use',
  ]);
});
