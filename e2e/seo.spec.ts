import { expect, test } from './fixtures/test';
import { PUBLIC_ROUTES } from './routes';

// T-33 (#48): per-page canonical, meta reset between routes, noindex, a single H1.

const canonical = (page: import('@playwright/test').Page) =>
  page.locator('link[rel="canonical"]').getAttribute('href');

for (const route of PUBLIC_ROUTES.filter((r) => r.path !== '/login')) {
  test(`${route.name} (${route.path}): self-referencing canonical, one h1, indexable`, async ({
    page,
  }) => {
    await page.goto(route.path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    expect(await canonical(page)).toBe(`https://ilramdhan.dev${route.path}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `https://ilramdhan.dev${route.path}`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index/);
  });
}

test('/login and unknown URLs are noindex without a canonical', async ({ page }) => {
  for (const path of ['/login', '/definitely-not-a-page']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  }
});

test('client-side navigation updates canonical, description and og:url (no stale meta)', async ({
  page,
}) => {
  await page.goto('/');
  const homeDesc = await page.locator('meta[name="description"]').getAttribute('content');
  const projects = page.getByRole('link', { name: 'Projects', exact: true }).first();
  if (!(await projects.isVisible())) {
    await page.locator('nav button:has(svg.lucide-menu)').click();
  }
  await projects.click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect.poll(() => canonical(page)).toBe('https://ilramdhan.dev/projects');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://ilramdhan.dev/projects',
  );
  expect(await page.locator('meta[name="description"]').getAttribute('content')).not.toBe(homeDesc);

  // Into a noindex page and back: robots must reset to indexable.
  await page.goto('/login');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index/);
  await expect.poll(() => canonical(page)).toBe('https://ilramdhan.dev/');
});
