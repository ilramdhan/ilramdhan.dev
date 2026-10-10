import type { SupabaseMock } from './fixtures/supabase-mock';
import { expect, test } from './fixtures/test';

// T-15 (#30): explicit columns, one profile request per page load, typed errors.

const restGets = (requests: SupabaseMock['requests'], table: string) =>
  requests.filter((r) => r.method === 'GET' && r.path.startsWith(`/rest/v1/${table}?`));

test('list views never request content and never use select=*', async ({ page, supabase }) => {
  // Wait for each page's list data. (Not the home <h1>: it is the hero typewriter,
  // whose text can stay a blank placeholder on a slow runner.)
  const pages: [path: string, rendered: string][] = [
    ['/', 'Project 1'],
    ['/projects', 'Project 1'],
    ['/blog', 'Blog Post 1'],
    ['/certificates', 'Cert 1'],
  ];
  for (const [path, rendered] of pages) {
    await page.goto(path);
    await expect(page.getByText(rendered, { exact: true }).first()).toBeAttached();
  }

  const lists = supabase.requests.filter(
    (r) => r.method === 'GET' && /^\/rest\/v1\/(projects|blogs)\?/.test(r.path),
  );
  expect(lists.length).toBeGreaterThan(0);
  for (const r of lists) {
    const select = r.url.searchParams.get('select') ?? '';
    expect(select.split(','), r.path).not.toContain('content');
  }
  const all = supabase.requests.filter((r) => r.path.startsWith('/rest/v1/') && r.method === 'GET');
  for (const r of all) expect(r.url.searchParams.get('select'), r.path).not.toBe('*');
});

test('tag and issuer filters come from the distinct-value functions', async ({
  page,
  supabase,
}) => {
  await page.goto('/projects');
  // Dataset: projects are tagged web/backend + oss.
  await expect(page.getByRole('button', { name: /^#?oss$/ })).toBeVisible();
  await page.goto('/certificates');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Certificates');
  await expect
    .poll(() => supabase.requests.map((r) => r.url.pathname))
    .toEqual(
      expect.arrayContaining(['/rest/v1/rpc/project_tags', '/rest/v1/rpc/certificate_issuers']),
    );
  // No column scan of every row any more.
  expect(restGets(supabase.requests, 'projects').some((r) => r.path.includes('select=tags&'))).toBe(
    false,
  );
});

test('tag filters still work before the migration (column-scan fallback)', async ({
  page,
  supabase,
}) => {
  const missing = {
    status: 404,
    body: { code: 'PGRST202', message: 'Could not find the function' },
  };
  supabase.rpc.blog_tags = missing;
  await page.goto('/blog');
  await expect(page.getByRole('button', { name: /^#?react$/ })).toBeVisible();
  expect(
    restGets(supabase.requests, 'blogs').some((r) => r.url.searchParams.get('select') === 'tags'),
  ).toBe(true);
});

test('the profile is fetched once per page load', async ({ page, supabase }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dummy Dev');
  // Navbar, footer and page all read the profile; focus changes must not refetch it.
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByRole('contentinfo')).toBeVisible();
  expect(restGets(supabase.requests, 'profile')).toHaveLength(1);
});

test('an unknown slug shows the 404 page without retrying', async ({ page, supabase }) => {
  await page.goto('/projects/does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  expect(
    restGets(supabase.requests, 'projects').filter((r) =>
      r.path.includes('slug=eq.does-not-exist'),
    ),
  ).toHaveLength(1);
});

test('a network error on a detail page shows a retry instead of "Not Found"', async ({
  page,
  supabase,
}) => {
  // supabase-js retries a failed fetch 3x with backoff (1s, 2s, 4s), then React Query retries
  // once: the error state shows after ~15s.
  test.setTimeout(60_000);
  let fail = true;
  await page.route('https://mock.supabase.co/rest/v1/blogs?**', async (route) => {
    if (fail && route.request().url().includes('slug=eq.blog-post-1')) return route.abort();
    return route.fallback();
  });
  await page.goto('/blog/blog-post-1');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Couldn't load this article", {
    timeout: 40_000,
  });

  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 1');
  expect(supabase.requests.length).toBeGreaterThan(0);
});
