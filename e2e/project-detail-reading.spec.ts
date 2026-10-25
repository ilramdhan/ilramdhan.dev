import { expect, test } from './fixtures/test';

// T-62 (#138): project detail as a reading page: header, linked tags, reading time, TOC,
// share, older/newer.

const PROJECT = '/projects/project-2';
const CANONICAL = /^https?:\/\/[^/]+\/projects\/project-2$/;

test('header: breadcrumb, tag links, title, lead and reading time above the gallery', async ({
  page,
  consoleErrors,
}) => {
  await page.goto(PROJECT);
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Project 2');

  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveText('Project 2');
  await expect(page.getByText(/^\d+ min read$/)).toBeVisible();

  const tags = page.getByRole('list', { name: 'Tags' }).first();
  await expect(tags.getByRole('link', { name: '#web' })).toHaveAttribute(
    'href',
    '/projects?tag=web',
  );

  const gallery = page.getByRole('group', { name: 'Screenshot of Project 2' });
  expect((await h1.boundingBox())!.y).toBeLessThan((await gallery.boundingBox())!.y);
  await page.waitForLoadState('networkidle');
  expect(consoleErrors).toEqual([]);
});

test('tag link opens the filtered list', async ({ page }) => {
  await page.goto(PROJECT);
  await page
    .getByRole('list', { name: 'Tags' })
    .first()
    .getByRole('link', { name: '#oss' })
    .click();
  await expect(page).toHaveURL(/\/projects\?tag=oss$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('All Projects');
});

test('table of contents links jump to the headings', async ({ page }, testInfo) => {
  await page.goto(PROJECT);
  await page.waitForLoadState('networkidle');
  const desktop = testInfo.project.name === 'desktop';
  const toc = desktop
    ? page.getByRole('complementary').getByRole('navigation', { name: 'On this page' })
    : page.locator('details').getByRole('navigation', { name: 'On this page' });
  if (!desktop) await page.locator('details > summary', { hasText: 'On this page' }).click();
  await expect(toc.getByRole('link')).toHaveText([
    'Overview',
    'Architecture',
    'Data model',
    'Lessons learned',
  ]);

  await toc.getByRole('link', { name: 'Lessons learned' }).click();
  await expect(page).toHaveURL(/#lessons-learned$/);
  const heading = page.locator('#lessons-learned');
  await expect(heading).toHaveText('Lessons learned');
  await expect(heading).toBeInViewport();
  // Clear of the fixed navbar.
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(56);
});

test('no TOC with fewer than three headings', async ({ page }) => {
  await page.goto('/projects/project-1');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Project 1');
  await expect(page.getByRole('navigation', { name: 'On this page' })).toHaveCount(0);
});

test('share links use the canonical URL', async ({ page }) => {
  await page.goto(PROJECT);
  const x = page.getByRole('link', { name: 'Share on X (opens in a new tab)' });
  const href = new URL((await x.getAttribute('href'))!);
  expect(href.searchParams.get('url')).toMatch(CANONICAL);
  expect(href.searchParams.get('text')).toBe('Project 2');
  const linkedIn = new URL(
    (await page
      .getByRole('link', { name: 'Share on LinkedIn (opens in a new tab)' })
      .getAttribute('href'))!,
  );
  expect(linkedIn.searchParams.get('url')).toMatch(CANONICAL);
});

test.describe('older/newer follow the list order on a created_at tie', () => {
  // Every fixture project shares one created_at; the list is newest first, then id asc:
  // project-1, project-2, …, project-8, long-content.
  test('a middle project links both ways', async ({ page }) => {
    await page.goto(PROJECT);
    const nav = page.getByRole('navigation', { name: 'More projects' });
    await expect(nav.getByRole('link', { name: /Older project/ })).toHaveAttribute(
      'href',
      '/projects/project-3',
    );
    await expect(nav.getByRole('link', { name: /Newer project/ })).toHaveAttribute(
      'href',
      '/projects/project-1',
    );
    await nav.getByRole('link', { name: /Older project/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Project 3');
  });

  test('the ends link one way only', async ({ page }) => {
    await page.goto('/projects/project-1');
    const first = page.getByRole('navigation', { name: 'More projects' });
    await expect(first.getByRole('link', { name: /Older project/ })).toHaveAttribute(
      'href',
      '/projects/project-2',
    );
    await expect(first.getByRole('link', { name: /Newer project/ })).toHaveCount(0);

    await page.goto('/projects/long-content');
    const last = page.getByRole('navigation', { name: 'More projects' });
    await expect(last.getByRole('link', { name: /Newer project/ })).toHaveAttribute(
      'href',
      '/projects/project-8',
    );
    await expect(last.getByRole('link', { name: /Older project/ })).toHaveCount(0);
  });
});

test('breadcrumb, older/newer, share and TOC are in the prerendered HTML', async ({ request }) => {
  const html = await (await request.get(PROJECT)).text();
  expect(html).toContain('aria-label="Breadcrumb"');
  expect(html).toContain('href="/projects?tag=web"');
  expect(html).toContain('id="lessons-learned"');
  expect(html).toContain('href="/projects/project-2#lessons-learned"');
  expect(html).toMatch(/min read/);
  expect(html).toContain('aria-label="More projects"');
  expect(html).toContain('href="/projects/project-3"');
  expect(html).toContain('href="/projects/project-1"');
  expect(html).toContain('Share on LinkedIn');
  expect(html).toContain('<meta property="og:type" content="article"');
});
