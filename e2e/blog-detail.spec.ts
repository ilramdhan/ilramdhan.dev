import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures/test';
import { horizontalOverflow, overflowingElements } from './helpers/layout';

// #113: article page header, cover, reading time, TOC, share, prev/next, related.

const POST = '/blog/blog-post-1';

test('header shows the title, reading time and a fully visible cover image', async ({
  page,
  consoleErrors,
}) => {
  await page.goto(POST);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 1');
  await expect(page.getByText(/^\d+ min read$/)).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Blog');

  const cover = page.getByRole('img', { name: 'Cover image for “Blog Post 1”' });
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute('fetchpriority', 'high');
  // Nothing is painted over the cover (no gradient overlay): its centre hits the image.
  const box = (await cover.boundingBox())!;
  const hit = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x!, y!)?.getAttribute('alt'),
    [box.x + box.width / 2, box.y + box.height / 2],
  );
  expect(hit).toBe('Cover image for “Blog Post 1”');
  await page.waitForLoadState('networkidle');
  expect(consoleErrors).toEqual([]);
});

test('table of contents links jump to the headings', async ({ page }, testInfo) => {
  await page.goto(POST);
  await page.waitForLoadState('networkidle');
  const desktop = testInfo.project.name === 'desktop';
  const toc = desktop
    ? page.getByRole('complementary').getByRole('navigation', { name: 'On this page' })
    : page.locator('details').getByRole('navigation', { name: 'On this page' });
  if (!desktop) await page.locator('details > summary', { hasText: 'On this page' }).click();
  // The heading inside the code fence is not listed.
  await expect(toc.getByRole('link')).toHaveText(['Heading', 'Setup', 'Details', 'Wrap-up']);

  await toc.getByRole('link', { name: 'Wrap-up' }).click();
  await expect(page).toHaveURL(/#wrap-up$/);
  const heading = page.locator('#wrap-up');
  await expect(heading).toHaveText('Wrap-up');
  await expect(heading).toBeInViewport();
  // Clear of the fixed navbar.
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(56);
  if (desktop) {
    await expect(toc.getByRole('link', { name: 'Wrap-up' })).toHaveAttribute(
      'aria-current',
      'location',
    );
  }
});

test('prev/next, related posts, share links and TOC are in the prerendered HTML', async ({
  request,
}) => {
  const html = await (await request.get('/blog/blog-post-2')).text();
  // Dataset: post 1 is the newest, post 3 the next older.
  expect(html).toMatch(
    /<a[^>]*href="\/blog\/blog-post-3"[^>]*rel="prev"|rel="prev"[^>]*href="\/blog\/blog-post-3"/,
  );
  expect(html).toMatch(
    /<a[^>]*href="\/blog\/blog-post-1"[^>]*rel="next"|rel="next"[^>]*href="\/blog\/blog-post-1"/,
  );
  expect(html).toContain('Related articles');
  expect(html).toContain('min read');
  expect(html).toContain('https://twitter.com/intent/tweet');
  expect(html).toContain(encodeURIComponent('https://ilramdhan.dev/blog/blog-post-2'));

  const first = await (await request.get(POST)).text();
  expect(first).toContain('On this page');
  expect(first).toContain('id="wrap-up"');
});

test('related posts share a tag and exclude the current post', async ({ page }) => {
  await page.goto('/blog/blog-post-2');
  const related = page.getByRole('region', { name: 'Related articles' });
  // Dataset: even posts are tagged "react" (4, 6); topped up with the newest other post (1).
  await expect(related.getByRole('heading', { level: 3 })).toHaveText([
    'Blog Post 4',
    'Blog Post 6',
    'Blog Post 1',
  ]);
  await expect(related.getByRole('link', { name: 'Blog Post 2', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: /Older post/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 3');
});

test("posts sharing a publish date are still each other's neighbours", async ({
  page,
  supabase,
}) => {
  // Posts 2 and 3 tie: by (published_at, id), 3 is newer than 2 and neither is skipped.
  const two = supabase.db.blogs!.find((b) => b.id === 2)!;
  supabase.db.blogs!.find((b) => b.id === 3)!.published_at = two.published_at;
  await page.goto('/blog/blog-post-2');
  await page.getByRole('link', { name: /Newer post/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 3');
  await page.getByRole('link', { name: /Newer post/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 1');
});

test('copy link writes the canonical URL and confirms with a toast', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(POST);
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByText('Link copied to clipboard')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'https://ilramdhan.dev/blog/blog-post-1',
  );
});

test('comments: labelled fields, existing comment and count', async ({ page }) => {
  await page.goto(POST);
  await expect(page.getByRole('heading', { name: /Comments \(1\)/ })).toBeVisible();
  await expect(page.getByLabel('Name')).toHaveAttribute('placeholder', 'Your Name');
  await expect(page.getByRole('textbox', { name: 'Comment' })).toBeVisible();
  await expect(page.getByText('Nice post')).toBeVisible();
});

test('loading state is a skeleton, not a spinner', async ({ page }) => {
  await page.route('https://mock.supabase.co/rest/v1/blogs?**', async (route) => {
    if (route.request().url().includes('slug=eq.blog-post-3')) {
      await new Promise((r) => setTimeout(r, 1500));
    }
    await route.fallback();
  });
  await page.goto('/blog');
  await page.getByRole('link', { name: 'Blog Post 3', exact: true }).first().click();
  await expect(page.getByRole('status').filter({ hasText: 'Loading article...' })).toBeAttached();
  await expect(page.locator('.motion-safe\\:animate-spin')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 3');
});

test.describe('layout frame (#122)', () => {
  test('sections share the left and right edges at 1280 px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop layout');
    await page.goto(POST);
    await page.waitForLoadState('networkidle');
    const box = async (name: string, locator: Locator) => {
      const b = await locator.boundingBox();
      expect(b, name).not.toBeNull();
      return { name, left: b!.x, right: b!.x + b!.width };
    };
    const header = await box('header', page.locator('main > article > header'));
    const cover = await box(
      'cover',
      page.locator('figure').filter({ has: page.getByRole('img', { name: /^Cover image/ }) }),
    );
    const comments = await box('comments', page.getByRole('region', { name: /^Comments/ }));
    const related = await box('related', page.getByRole('region', { name: 'Related articles' }));
    const left = [
      await box('breadcrumb', page.getByRole('navigation', { name: 'Breadcrumb' })),
      await box('h1', page.getByRole('heading', { level: 1 })),
      header,
      cover,
      comments,
      related,
    ];
    for (const b of left)
      expect(Math.abs(b.left - header.left), `${b.name} left`).toBeLessThanOrEqual(1);
    for (const b of [cover, comments, related]) {
      expect(Math.abs(b.right - header.right), `${b.name} right`).toBeLessThanOrEqual(1);
    }
    // The TOC column ends on the frame's right edge too.
    const toc = await box('toc', page.getByRole('complementary'));
    expect(Math.abs(toc.right - header.right), 'toc right').toBeLessThanOrEqual(1);
  });

  test('the TOC stays pinned below the navbar while reading', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the sidebar TOC is lg+ only');
    await page.goto(POST);
    await page.waitForLoadState('networkidle');
    const aside = page.getByRole('complementary');
    await expect(aside.getByRole('navigation', { name: 'On this page' })).toBeVisible();
    const article = (await page.locator('main > article').boundingBox())!;
    const viewport = page.viewportSize()!;
    // Long enough for the sticky aside to actually move.
    expect(article.height).toBeGreaterThan(viewport.height * 2.5);
    for (const fraction of [0.5, 0.85]) {
      await page.evaluate(
        ([y]) => window.scrollTo(0, y!),
        [article.y + article.height * fraction - viewport.height / 2],
      );
      await expect(async () => {
        const b = (await aside.boundingBox())!;
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeLessThanOrEqual(200);
      }).toPass();
    }
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    await page.goto(POST);
    await page.waitForLoadState('networkidle');
    expect(await horizontalOverflow(page), (await overflowingElements(page)).join(', ')).toBe(0);
  });
});
