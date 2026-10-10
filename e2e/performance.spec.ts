import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/test';
import { installSupabaseMock } from './fixtures/supabase-mock';

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

const isModel = (a: string) => /\.(glb|gltf)$/.test(a);

test.describe('3D card & Vanta (T-25)', () => {
  test('non-home routes download no model and no three.js', async ({ page }) => {
    const assets = trackAssets(page);
    for (const path of ['/about', '/projects', '/blog']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await page.waitForLoadState('networkidle');
    }
    expect(assets.filter(isModel), 'models requested').toEqual([]);
    expect(chunk(assets, 'three'), 'three chunk').toEqual([]);
  });

  test('home loads no Vanta and at most one WebGL canvas', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'script') scripts.push(req.url());
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(
      scripts.filter((s) => /vanta/i.test(s)),
      'vanta scripts',
    ).toEqual([]);
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1);
    const bundled = await Promise.all(
      scripts
        .filter((s) => s.includes('/assets/') && !/three-/.test(s))
        .map((s) => page.request.get(s).then((r) => r.text())),
    );
    expect(
      bundled.some((code) => /VANTA/.test(code)),
      'Vanta code in a JS chunk',
    ).toBe(false);
  });

  test('home: 3D card only on desktop, never on mobile/tablet', async ({ page }, testInfo) => {
    const assets = trackAssets(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (desktop) {
      const canvas = page.getByTestId('hero-card-canvas').locator('canvas');
      await expect(canvas).toBeVisible();
      // The card is draggable: its canvas receives pointer events.
      expect(await canvas.evaluate((el) => getComputedStyle(el).pointerEvents)).not.toBe('none');
      await expect.poll(() => assets.filter(isModel)).toEqual(['/models/card.glb']);
      // Grabbing the card switches the cursor to "grabbing" (drag handler is live).
      const box = (await canvas.boundingBox())!;
      const target = { x: box.x + box.width * 0.77, y: box.y + box.height * 0.6 };
      await expect
        .poll(async () => {
          await page.mouse.move(target.x, target.y);
          return page.evaluate(() => document.body.style.cursor);
        })
        .toBe('grab');
      await page.mouse.down();
      await expect.poll(() => page.evaluate(() => document.body.style.cursor)).toBe('grabbing');
      await page.mouse.up();
    } else {
      expect(assets.filter(isModel), `models on ${testInfo.project.name}`).toEqual([]);
      expect(chunk(assets, 'three'), 'three chunk').toEqual([]);
      await expect(page.locator('canvas')).toHaveCount(0);
    }
  });

  test('home under reduced motion: static poster, no WebGL', async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    await installSupabaseMock(page);
    const assets = trackAssets(page);
    await page.goto('/');
    await expect(page.getByTestId('hero-card-poster')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(assets.filter(isModel), `models on ${testInfo.project.name}`).toEqual([]);
    await expect(page.locator('canvas')).toHaveCount(0);
    await context.close();
  });
});

test('home load: long tasks stay near the T-25 target of 3', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __longTasks: number };
    w.__longTasks = 0;
    new PerformanceObserver((list) => {
      w.__longTasks += list.getEntries().length;
    }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');
  const longTasks = await page.evaluate(
    () => (window as unknown as { __longTasks: number }).__longTasks,
  );
  testInfo.annotations.push({ type: 'long tasks on home load', description: String(longTasks) });
  // Isolated runs measure 3 (the T-25 AC; was 13-20 before). Parallel e2e workers
  // compete for the CPU and can split a task, so the hard gate keeps some headroom.
  expect(longTasks, 'long tasks during home load').toBeLessThanOrEqual(5);
});

test.describe('decorative layers & fonts (T-28)', () => {
  test('no animated blur on full-viewport layers and no dead font preconnects', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const offenders = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      return [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((el) => {
          const style = getComputedStyle(el);
          if (style.position !== 'fixed') return false;
          const r = el.getBoundingClientRect();
          if (r.width < vw * 0.9 || r.height < vh * 0.9) return false;
          const blurred = (node: Element) => getComputedStyle(node).filter.includes('blur');
          const animated = (node: Element) => node.getAnimations().length > 0;
          return [el, ...el.querySelectorAll('*')].some((n) => blurred(n) || animated(n));
        })
        .map((el) => el.className);
    });
    expect(offenders, 'fixed full-viewport layers with blur/animation').toEqual([]);
    expect(
      await page.locator('link[rel="preconnect"][href*="fonts."]').count(),
      'font preconnects',
    ).toBe(0);
  });

  test('tech marquee pauses off-screen and is static under reduced motion', async ({ page }) => {
    await page.goto('/');
    const marquee = page.locator('.marquee');
    await expect(marquee.locator('.marquee-track > *').first()).toBeAttached();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(marquee).toHaveAttribute('data-paused', 'true');
    await marquee.scrollIntoViewIfNeeded();
    await expect(marquee).toHaveAttribute('data-paused', 'false');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const running = await marquee
      .locator('.marquee-track > *')
      .first()
      .evaluate((el) => el.getAnimations().length);
    expect(running, 'marquee animations under reduced motion').toBe(0);
  });
});
