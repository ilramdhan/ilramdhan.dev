import type { BrowserContextOptions, Page } from '@playwright/test';
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
      expect(chunk(assets, 'HeroCard'), 'hero-3d chunk').toEqual([]);
      await expect(page.locator('canvas')).toHaveCount(0);
    }
  });

  // D2: no poster any more; the lanyard is neither rendered nor downloaded unless the desktop query matches.
  const noLanyard: [name: string, options: BrowserContextOptions][] = [
    ['375 phone', { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true }],
    ['1280 reduced motion', { viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }],
  ];
  for (const [name, options] of noLanyard) {
    test(`home at ${name}: no .glb, no hero-3d chunk, no canvas, no poster`, async ({
      browser,
    }) => {
      const context = await browser.newContext(options);
      const page = await context.newPage();
      await installSupabaseMock(page);
      const assets = trackAssets(page);
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dummy Dev');
      await page.waitForLoadState('networkidle');
      // Give the idle mount a chance to (wrongly) start.
      await page.waitForTimeout(1500);
      expect(assets.filter(isModel)).toEqual([]);
      expect(chunk(assets, 'HeroCard'), 'hero-3d chunk').toEqual([]);
      expect(chunk(assets, 'three'), 'three chunk').toEqual([]);
      await expect(page.locator('canvas')).toHaveCount(0);
      await expect(page.locator('img[src*="card-poster"]')).toHaveCount(0);
      await context.close();
    });
  }

  test('home at 1440: the canvas mounts, and unmounts when the window narrows', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await installSupabaseMock(page);
    const assets = trackAssets(page);
    await page.goto('/');
    await expect(page.getByTestId('hero-card-canvas').locator('canvas')).toBeVisible();
    expect(chunk(assets, 'HeroCard')).toHaveLength(1);
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(page.locator('canvas')).toHaveCount(0);
    await context.close();
  });
});

// F-14: the card was missing on a cold first open. Its boot waited for `window.load`, which a slow subresource on a
// cold cache (third-party iframe, large image) held back indefinitely. Fresh context per run = empty cache.
test.describe('lanyard on a cold first load (F-14)', () => {
  for (let run = 1; run <= 10; run++) {
    test(`1440 cold run ${run}: the canvas mounts`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await installSupabaseMock(page);
      await page.goto('/');
      await expect(page.getByTestId('hero-card-canvas').locator('canvas')).toBeVisible();
      await context.close();
    });
  }

  test('1440: the canvas mounts while a slow subresource still holds `load`', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await installSupabaseMock(page);
    // Never answered during the test: `load` cannot fire.
    await page.route('https://vercel.live/**', () => new Promise<void>(() => {}));
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const frame = document.createElement('iframe');
        frame.src = 'https://vercel.live/_next-live/feedback/instrument';
        frame.hidden = true;
        document.body.append(frame);
      });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('hero-card-canvas').locator('canvas')).toBeVisible();
    expect(await page.evaluate(() => document.readyState)).not.toBe('complete');
    await context.close();
  });

  test('1440: a failed model download leaves the page, not an error screen', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await installSupabaseMock(page);
    await page.route('**/models/card.glb', (route) => route.abort('connectionreset'));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dummy Dev');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dummy Dev');
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

  // R5: the CSS marquee became the plain-text GSAP Marquee (lazy engine, visitor pause, still under reduced motion).
  const trackX = (page: Page) =>
    page
      .locator('[data-marquee] [data-track]')
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);

  test('tech marquee: lazy loop that moves in view and holds on Pause', async ({ page }) => {
    await page.goto('/');
    const marquee = page.locator('[data-marquee]');
    await expect(marquee).not.toHaveAttribute('data-animated');
    await marquee.scrollIntoViewIfNeeded();
    await expect(marquee).toHaveAttribute('data-animated', 'true');
    const x0 = await trackX(page);
    await expect.poll(() => trackX(page)).not.toBe(x0);
    await page.getByRole('button', { name: 'Pause the moving list' }).click();
    await page.mouse.move(0, 0); // hover also pauses; take the pointer away to see the visitor's hold alone
    await page.waitForTimeout(200);
    const held = await trackX(page);
    await page.waitForTimeout(500);
    expect(await trackX(page)).toBe(held);
  });

  test.describe('reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });
    test('tech marquee is one still line with every name and no copies', async ({ page }) => {
      await page.goto('/');
      const marquee = page.locator('[data-marquee]');
      await marquee.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await expect(marquee).not.toHaveAttribute('data-animated');
      await expect(marquee.locator('[data-marquee-copy]').first()).toBeHidden();
      await expect(marquee.locator('ul').first().locator('li')).toHaveCount(5);
      await expect(page.getByRole('button', { name: 'Pause the moving list' })).toBeHidden();
    });
  });
});
