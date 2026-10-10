import { expect, test } from './fixtures/test';

// Regression for T-10 (#25): special characters in search must never break the
// PostgREST filter (the mock answers malformed filters with a 400, like PostgREST).
const SPECIAL_CERTS = ['AWS (Associate)', 'a,b testing', '100% Pure', 'snake_case'];

test('certificate search with special characters shows matches or the empty state', async ({
  page,
  supabase,
  consoleErrors,
}) => {
  const template = supabase.db.certificates?.[0] ?? {};
  supabase.db.certificates = [
    ...(supabase.db.certificates ?? []),
    ...SPECIAL_CERTS.map((title, i) => ({ ...template, id: 100 + i, title })),
  ];

  await page.goto('/certificates');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Certificates');
  const search = page.getByPlaceholder('Search certificates...');
  const cards = page.getByRole('heading', { level: 3 });

  const cases: [string, string[]][] = [
    ['AWS (Associate)', ['AWS (Associate)']],
    ['a,b', ['a,b testing']],
    ['%', ['100% Pure']],
    ['_', ['snake_case']],
    ['(y', []],
    ['x)', []],
  ];
  for (const [input, expected] of cases) {
    await search.fill(input);
    if (expected.length) {
      await expect(cards, `results for ${input}`).toHaveText(expected);
    } else {
      await expect(page.getByText('No certificates found matching your criteria.')).toBeVisible();
    }
    await expect(page.getByText('Error loading certificates.')).toHaveCount(0);
  }

  const searches = supabase.requests.filter(
    (r) => r.path.startsWith('/rest/v1/certificates') && r.url.searchParams.has('or'),
  );
  expect(searches.length).toBeGreaterThan(0);
  expect(consoleErrors, 'console errors').toEqual([]);
});

test('blog search treats % and _ literally', async ({ page, supabase, consoleErrors }) => {
  const template = supabase.db.blogs?.[0] ?? {};
  supabase.db.blogs = [
    ...(supabase.db.blogs ?? []),
    { ...template, id: 100, slug: 'pct', title: '100% Rust' },
  ];

  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writings');
  const search = page.getByPlaceholder('Search articles...');

  await search.fill('100%');
  await expect(page.getByText('100% Rust', { exact: true })).toBeVisible();
  await expect(page.getByText('Blog Post 1', { exact: true })).toHaveCount(0);

  await search.fill('_');
  await expect(page.getByText('No articles found matching your criteria.')).toBeVisible();
  await expect(page.getByText('Error loading articles.')).toHaveCount(0);
  expect(consoleErrors, 'console errors').toEqual([]);
});
