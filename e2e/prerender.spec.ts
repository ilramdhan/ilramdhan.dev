import { expect, test } from './fixtures/test';

// T-35 (#50): every public route is prerendered to static HTML.

test('a post is readable without JavaScript: title, description, canonical, OG, body', async ({
  request,
}) => {
  const res = await request.get('/blog/blog-post-1');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('<title>Blog Post 1 | Ilham Ramadhan</title>');
  expect(html).toContain('<link rel="canonical" href="https://ilramdhan.dev/blog/blog-post-1" />');
  expect(html).toMatch(/<meta property="og:title" content="Blog Post 1 \| Ilham Ramadhan" \/>/);
  expect(html).toMatch(/<meta property="og:type" content="article" \/>/);
  expect(html).toMatch(/<meta name="description" content="[^"]+" \/>/);
  expect(html).toMatch(/<h1[^>]*>Blog Post 1<\/h1>/);
  // One tag of each kind: the template's defaults were replaced, not duplicated.
  expect(html.match(/<title>/g)).toHaveLength(1);
  expect(html.match(/property="og:title"/g)).toHaveLength(1);
});

test('every project and post in the dataset has its own page', async ({ request }) => {
  for (const path of ['/projects/project-1', '/projects/long-content', '/blog/long-content']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(await res.text(), path).toContain(
      `<link rel="canonical" href="https://ilramdhan.dev${path}" />`,
    );
  }
});

test.describe('JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });
  test('pages show their content from the static HTML', async ({ page }) => {
    await page.goto('/projects/project-1');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Project 1');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dummy Dev');
  });
});

test('content stays readable when Supabase is unreachable', async ({ page, consoleErrors }) => {
  await page.route('https://mock.supabase.co/**', (route) => route.abort());
  for (const [path, h1] of [
    ['/blog/blog-post-1', 'Blog Post 1'],
    ['/projects', 'All Projects'],
    ['/', 'Dummy Dev'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
  }
  await page.goto('/blog');
  await expect(page.getByText('Blog Post 1').first()).toBeVisible();
  await expect(page.getByText('Error loading articles.')).toHaveCount(0);
  // Only the failed background refreshes are logged, never a React (hydration) error.
  expect(consoleErrors.filter((e) => /React|hydrat/i.test(e))).toEqual([]);
});

test('hydration keeps the static markup (no React errors, no re-render flash)', async ({
  page,
  consoleErrors,
}) => {
  for (const path of ['/', '/about', '/blog/blog-post-1', '/certificates']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(consoleErrors).toEqual([]);
});

test('unknown public URLs answer 404 with the prerendered not-found page', async ({ request }) => {
  const res = await request.get('/no-such-page', { headers: { accept: 'text/html' } });
  expect(res.status()).toBe(404);
  const html = await res.text();
  expect(html).toContain('Page not found');
  expect(html).toContain('noindex');
});

test('/admin is served the SPA shell (no prerendered markup)', async ({ request }) => {
  const res = await request.get('/admin', { headers: { accept: 'text/html' } });
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('<div id="root"></div>');
});
