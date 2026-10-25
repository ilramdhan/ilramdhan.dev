import { expect, test } from './fixtures/test';
import { horizontalOverflow } from './helpers/layout';

// T-61 (#136): /projects search, sort, result line, Clear filters and empty state.

test('projects sort is sent with an id tie-break (oldest: created_at.asc,id.asc), restored from the URL, and cleared', async ({
  page,
  supabase,
}) => {
  await page.goto('/projects');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('All Projects');
  const sort = page.getByLabel('Sort projects');
  await expect(sort).toHaveValue('newest');
  await expect
    .poll(() =>
      supabase.requests.some(
        (r) =>
          r.path.startsWith('/rest/v1/projects') &&
          decodeURIComponent(r.path).includes('order=created_at.desc,id.asc'),
      ),
    )
    .toBe(true);

  await sort.selectOption('oldest');
  await expect(page).toHaveURL(/[?&]sort=oldest/);
  await expect
    .poll(() =>
      supabase.requests.some(
        (r) =>
          r.path.startsWith('/rest/v1/projects') &&
          decodeURIComponent(r.path).includes('order=created_at.asc,id.asc'),
      ),
    )
    .toBe(true);

  await page.reload();
  await expect(page.getByLabel('Sort projects')).toHaveValue('oldest');
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(6);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).not.toHaveURL(/sort=/);
  await expect(page.getByLabel('Sort projects')).toHaveValue('newest');
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
});

test('projects search matches the short description and shows a result line', async ({
  page,
  supabase,
}) => {
  const template = supabase.db.projects?.[0] ?? {};
  supabase.db.projects = [
    ...(supabase.db.projects ?? []),
    {
      ...template,
      id: 200,
      slug: 'unrelated',
      title: 'Unrelated',
      short_description: 'mentions zebrafish here',
    },
  ];
  await page.goto('/projects');
  const search = page.getByLabel('Search projects');
  await search.fill('zebrafish');
  await expect(page).toHaveURL(/[?&]q=zebrafish/);
  await expect(page.getByRole('heading', { level: 2, name: 'Unrelated' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1);
  await expect(page.getByText(/^1 project for/)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Search projects')).toHaveValue('zebrafish');
  await expect(page.getByRole('heading', { level: 2, name: 'Unrelated' })).toBeVisible();
});

test('Clear filters resets q, tag, sort and page; the empty state offers a reset', async ({
  page,
}) => {
  await page.goto('/projects?q=zzz-no-match&tag=oss&sort=oldest&page=2');
  await expect(page.getByText('No projects match your filters.', { exact: false })).toBeVisible();
  await expect(page.getByText(/^0 projects/)).toBeVisible();
  const clear = page.getByRole('button', { name: 'Clear filters' });
  await expect(clear).toHaveCount(2);
  await clear.last().click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByLabel('Search projects')).toHaveValue('');
  await expect(page.getByLabel('Sort projects')).toHaveValue('newest');
  await expect(page.getByText(/^9 projects$/)).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(6);
});

test('grid columns follow the viewport and nothing overflows', async ({ page }, testInfo) => {
  await page.goto('/projects');
  const cards = page.getByRole('heading', { level: 2 });
  await expect(cards).toHaveCount(6);
  const lefts = new Set<number>();
  for (const card of await cards.all()) lefts.add(Math.round((await card.boundingBox())!.x));
  const width = page.viewportSize()!.width;
  const expected = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  expect(lefts.size, `${testInfo.project.name} @ ${width}px`).toBe(expected);
  expect(await horizontalOverflow(page)).toBe(0);
});
