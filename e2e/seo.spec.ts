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
  const menu = page.getByRole('button', { name: 'Open menu' });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('navigation', { name: 'Main' })
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

  // Clicking the card body (not the title text) navigates: the whole card is the link.
  const box = (await link.boundingBox())!;
  await link.click({ position: { x: box.width - 12, y: box.height - 12 } });
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

// T-39 (#54): favicons and web app manifest.

test('manifest is linked, served and valid, and every icon resolves', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/site.webmanifest');
  const res = await request.get(href!);
  expect(res.ok()).toBe(true);
  const manifest = (await res.json()) as {
    name: string;
    short_name: string;
    start_url: string;
    theme_color: string;
    background_color: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(manifest.name).toBeTruthy();
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.start_url).toBe('/');
  expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  const sizes = manifest.icons.map((i) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons) {
    const r = await request.get(icon.src);
    expect(r.ok(), icon.src).toBe(true);
    expect(r.headers()['content-type']).toContain('image/png');
  }
});

test('favicon links and apple-touch-icon resolve', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('link[rel~="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href')!));
  expect(hrefs).toEqual(
    expect.arrayContaining(['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png']),
  );
  for (const href of hrefs) {
    expect((await request.get(href)).ok(), href).toBe(true);
  }
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
});

// R8: both locales, heading order, hreflang reciprocity, JSON-LD, sitemap.
const SITE = 'https://ilramdhan.dev';
interface LD {
  '@context': string;
  '@type': string;
  inLanguage?: string;
  url?: string;
}
const LOCALIZED = PUBLIC_ROUTES.filter((r) => r.path !== '/login');
const idPath = (p: string) => (p === '/' ? '/id' : `/id${p}`);

for (const route of LOCALIZED) {
  for (const [locale, path] of [
    ['en', route.path],
    ['id', idPath(route.path)],
  ] as const) {
    test(`${locale} ${route.path}: one h1, no skipped heading level, hreflang reciprocal, json-ld inLanguage`, async ({
      page,
      request,
    }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      const levels = await page
        .locator('h1,h2,h3,h4,h5,h6')
        .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
      levels.forEach((l, i) => i > 0 && expect(l - levels[i - 1]!).toBeLessThanOrEqual(1));
      await expect(page.locator('html')).toHaveAttribute('lang', locale);

      const alts = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((els) => els.map((e) => [e.getAttribute('hreflang'), e.getAttribute('href')]));
      const map: Record<string, string> = Object.fromEntries(alts as [string, string][]);
      expect(map).toEqual({
        en: `${SITE}${route.path}`,
        id: `${SITE}${idPath(route.path)}`,
        'x-default': `${SITE}${route.path}`,
      });
      expect(await canonical(page)).toBe(`${SITE}${path}`);
      // Reciprocal: the twin lists the same set.
      const twin = locale === 'en' ? map.id : map.en;
      const html = await (await request.get(new URL(twin as string).pathname)).text();
      for (const [hl, href] of alts) {
        expect(html).toContain(`hreflang="${hl}" href="${href}"`);
      }

      const lds = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}') as LD));
      for (const ld of lds) {
        expect(ld['@context']).toBe('https://schema.org');
        if (ld.inLanguage) expect(ld.inLanguage).toBe(locale);
        if (ld.url) expect(ld.url).toMatch(/^https:\/\//);
      }
      const types = lds.map((l) => l['@type']);
      if (route.path === '/') expect(types).toEqual(['Person', 'WebSite']);
      if (route.path.startsWith('/blog/')) expect(types).toEqual(['BlogPosting', 'BreadcrumbList']);
      if (route.path.startsWith('/projects/'))
        expect(types[0]).toMatch(/^(CreativeWork|SoftwareSourceCode)$/);
    });
  }
}

test('sitemap lists both locales with alternates, no admin/login/dev routes; robots points to it', async ({
  request,
}) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const r of LOCALIZED) {
    expect(locs).toContain(`${SITE}${r.path === '/' ? '/' : r.path}`);
    expect(locs).toContain(`${SITE}${idPath(r.path)}`);
  }
  expect(locs.some((l) => /\/(admin|login|__motion)/.test(l!))).toBe(false);
  expect(xml).toContain('hreflang="x-default"');
  expect(await (await request.get('/robots.txt')).text()).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});

test('og image is 1200x630 with alt, og:locale + alternate match the page locale', async ({
  page,
  request,
}) => {
  for (const [path, locale, alt] of [
    ['/about', 'en_US', 'id_ID'],
    ['/id/about', 'id_ID', 'en_US'],
  ] as const) {
    await page.goto(path);
    const content = (sel: string) => page.locator(sel).getAttribute('content');
    expect(await content('meta[property="og:image"]')).toBe(`${SITE}/og.png`);
    expect(await content('meta[property="og:image:width"]')).toBe('1200');
    expect(await content('meta[property="og:image:height"]')).toBe('630');
    expect(await content('meta[property="og:image:alt"]')).toBeTruthy();
    expect(await content('meta[property="og:locale"]')).toBe(locale);
    expect(await content('meta[property="og:locale:alternate"]')).toBe(alt);
    expect(await content('meta[name="twitter:card"]')).toBe('summary_large_image');
  }
  expect((await request.get('/og.png')).status()).toBe(200);
});
