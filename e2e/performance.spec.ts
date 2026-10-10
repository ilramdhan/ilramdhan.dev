import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/test';

/** Records the same-origin `/assets/*` files the page requests (JS chunks, models, …). */
function trackAssets(page: Page): string[] {
  const assets: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/models/')) {
      assets.push(url.pathname);
    }
  });
  return assets;
}

const chunk = (assets: string[], name: string) =>
  assets.filter((a) => new RegExp(`/assets/${name}-[\\w-]{8}\\.js$`).test(a));

test.describe('code splitting (T-24)', () => {
  test('/privacy loads neither three.js, charts nor admin code', async ({ page }) => {
    const assets = trackAssets(page);
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Privacy Policy');
    await page.waitForLoadState('networkidle');
    for (const heavy of ['three', 'charts', 'admin']) {
      expect(chunk(assets, heavy), `${heavy} chunk on /privacy`).toEqual([]);
    }
  });

  test('/about does not load three.js', async ({ page }) => {
    const assets = trackAssets(page);
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Dummy Dev');
    await page.waitForLoadState('networkidle');
    expect(chunk(assets, 'three'), 'three chunk on /about').toEqual([]);
  });
});
