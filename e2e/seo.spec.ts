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
  await expect(page.locator('h1')).toHaveCount(1);
  const menu = page.locator('nav button:has(svg.lucide-menu)');
  if (await menu.isVisible()) await menu.click();
  await page
    .locator('nav')
    .getByRole('link', { name: 'Projects', exact: true })
    .locator('visible=true')
    .first()
    .click();
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
  await page.getByRole('link', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index/);
  await expect.poll(() => canonical(page)).toBe('https://ilramdhan.dev/');
});

// T-34 (#49): real links.

test('nav items, logo and footer links are anchors with href', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  const hrefs = await page
    .locator('nav a[href], footer a[href]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  for (const href of [
    '/',
    '/about',
    '/projects',
    '/blog',
    '/certificates',
    '/#contact',
    '/privacy',
    '/terms',
  ]) {
    expect(hrefs, href).toContain(href);
  }
  await expect(page.locator('nav button', { hasText: /^(Home|About|Projects|Blog)$/ })).toHaveCount(
    0,
  );
});

test('/blog and /projects cards are crawlable links and keyboard reachable', async ({ page }) => {
  await page.goto('/blog');
  const post = page.locator('main a[href^="/blog/"], a[href="/blog/blog-post-1"]').first();
  await expect(post).toHaveAttribute('href', '/blog/blog-post-1');
  await post.focus();
  await expect(post).toBeFocused();

  await page.goto('/projects');
  const proj = page.locator('a[href="/projects/project-1"]').first();
  await expect(proj).toBeAttached();
  await proj.focus();
  await expect(proj).toBeFocused();
});

test('middle-click on a card opens a new tab; whole card is clickable', async ({
  page,
  context,
}) => {
  await page.goto('/blog');
  const link = page.locator('a[href="/blog/blog-post-1"]').first();
  await expect(link).toBeVisible();
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    link.click({ button: 'middle' }),
  ]);
  await popup.waitForURL(/\/blog\/blog-post-1$/);
  await popup.close();

  // Clicking the card body (not the title text) navigates via the stretched link.
  const article = page.locator('article', { has: link }).first();
  const box = (await article.boundingBox())!;
  await article.click({ position: { x: box.width - 12, y: box.height - 12 } });
  await expect(page).toHaveURL(/\/blog\/blog-post-1$/);
});

test('project card demo/repo links still work independently of the card link', async ({ page }) => {
  await page.goto('/projects');
  const card = page
    .locator('a[href="/projects/project-1"]')
    .first()
    .locator('xpath=ancestor::div[contains(@class,"group")][1]');
  const external = card.locator('a[target="_blank"]');
  const n = await external.count();
  for (let i = 0; i < n; i++) {
    const z = await external
      .nth(i)
      .evaluate((el) => getComputedStyle(el.closest('.absolute') ?? el).zIndex);
    expect(Number(z) || 0).toBeGreaterThan(0);
  }
});
