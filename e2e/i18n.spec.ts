import { expect, test } from './fixtures/test';

// T-40 (#55): Indonesian UI at /id/*, hreflang on every page, per-locale <html lang>.

const HREFLANG = [
  ['en', 'https://ilramdhan.dev/'],
  ['id', 'https://ilramdhan.dev/id'],
  ['x-default', 'https://ilramdhan.dev/'],
] as const;

test('/id/ renders Indonesian UI with <html lang="id">, in the static HTML and after hydration', async ({
  page,
  request,
  consoleErrors,
}) => {
  const html = await (await request.get('/id')).text();
  expect(html).toContain('<html lang="id"');
  expect(html).toContain('Proyek Pilihan');

  await page.goto('/id');
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await expect(page.getByRole('heading', { name: 'Proyek Pilihan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kebijakan Privasi' })).toHaveAttribute(
    'href',
    '/id/privacy',
  );
  expect(consoleErrors).toEqual([]);
});

test('English pages keep lang="en" and unprefixed links', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Featured Projects' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
    'href',
    '/privacy',
  );
});

test('hreflang alternates and og:locale are present on / and /id (static and live)', async ({
  page,
  request,
}) => {
  for (const [path, og] of [
    ['/', 'en_US'],
    ['/id', 'id_ID'],
  ] as const) {
    const html = await (await request.get(path)).text();
    for (const [lang, href] of HREFLANG) {
      expect(html, `${path} ${lang}`).toContain(
        `<link rel="alternate" hreflang="${lang}" href="${href}" />`,
      );
    }
    expect(html).toContain(`<meta property="og:locale" content="${og}" />`);
    expect(html).toMatch(/property="og:locale:alternate"/);

    await page.goto(path);
    for (const [lang, href] of HREFLANG) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveAttribute(
        'href',
        href,
      );
    }
  }
});

test('detail pages are prerendered for both locales with shared slugs', async ({ request }) => {
  const res = await request.get('/id/blog/blog-post-1');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain(
    '<link rel="canonical" href="https://ilramdhan.dev/id/blog/blog-post-1" />',
  );
  expect(html).toContain('hreflang="en" href="https://ilramdhan.dev/blog/blog-post-1"');
});

test('sitemap lists both locales', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain('<loc>https://ilramdhan.dev/about</loc>');
  expect(xml).toContain('<loc>https://ilramdhan.dev/id/about</loc>');
});

test('first-visit banner offers Indonesian, never redirects, and remembers the choice', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'id-ID' });
  const page = await context.newPage();
  await page.goto('/');
  const banner = page.getByRole('region', { name: 'Pilihan bahasa' });
  await expect(banner).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await banner.getByRole('button', { name: 'Tidak, terima kasih' }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Pilihan bahasa' })).toHaveCount(0);
  await context.close();
});

test('accepting the banner opens the Indonesian page', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'id-ID' });
  const page = await context.newPage();
  await page.goto('/about');
  await page.getByRole('button', { name: 'Ya, baca dalam Bahasa Indonesia' }).click();
  await expect(page).toHaveURL(/\/id\/about$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await context.close();
});

test('English browsers see no banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Pilihan bahasa' })).toHaveCount(0);
});
