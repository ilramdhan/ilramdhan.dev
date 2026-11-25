import { expect, test } from './fixtures/test';

// T-29 (#44): reduced motion is honoured; reveal animations run once.

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const path of ['/', '/about', '/certificates']) {
    test(`${path}: no running animations and no transformed reveals`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running')
          .map((a) => (a as CSSAnimation).animationName ?? a.id ?? 'anim'),
      );
      expect(running).toEqual([]);
      await expect(page.locator('canvas')).toHaveCount(0);
      const transformed = await page.evaluate(
        () =>
          Array.from(document.querySelectorAll<HTMLElement>('main *, section *')).filter(
            // The segmented control's thumb is a selection position (static), not a reveal.
            (el) =>
              !el.hasAttribute('data-segmented-thumb') &&
              el.style.transform &&
              el.style.transform !== 'none',
          ).length,
      );
      expect(transformed).toBe(0);
    });
  }
});

test('reveal animates once: scrolling away and back does not re-hide items', async ({ page }) => {
  await page.goto('/certificates');
  const card = page.getByText('Cert 1', { exact: true }).first();
  await card.scrollIntoViewIfNeeded();
  // R6c: the group is a stagger-row item (translate only, never a fade): it stays fully opaque and ends at rest.
  const wrapper = card.locator('xpath=ancestor::li[1]');
  await expect(wrapper).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await expect(wrapper).toHaveCSS('opacity', '1');
});

// T-31 (#46): static H1 with the owner's name. R5 (PLAN §3): one lead line replaces the rotating roles; the hero
// enters once (h1 rises without fading so the LCP text paints at once, the rest rises 120ms later).
test.describe('hero', () => {
  test('H1 is the static owner name; one lead line; the entrance plays once and settles', async ({
    page,
  }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('Dummy Dev');
    const hero = page.locator('section[data-enter]');
    await expect(hero.getByText('I build fast web apps.')).toBeVisible();
    expect(await h1.evaluate((el) => getComputedStyle(el).animationName)).toBe('rise-still');
    // Ends at rest, fully visible, and stays there.
    await expect
      .poll(
        () =>
          h1.evaluate((el) => el.getAnimations().filter((a) => a.playState === 'running').length),
        { timeout: 4000 },
      )
      .toBe(0);
    const before = await h1.boundingBox();
    await page.waitForTimeout(1500);
    expect(await h1.boundingBox()).toEqual(before);
    await expect(hero.getByText('I build fast web apps.')).toHaveCSS('opacity', '1');
  });

  test('the contact pill and the projects chevron link lead where they say', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('section[data-enter]');
    await expect(hero.getByRole('link', { name: 'Contact Me' })).toHaveAttribute(
      'href',
      '/contact',
    );
    await expect(hero.getByRole('link', { name: 'View Projects' })).toHaveAttribute(
      'href',
      '/projects',
    );
  });

  test('statement fills on scroll; services and tools render as plain text', async ({ page }) => {
    await page.goto('/');
    const fill = page.locator('[data-scroll-fill]');
    await expect(fill).toHaveText('This is dummy bio.');
    await expect(page.getByRole('heading', { level: 3, name: 'Service 1' })).toBeAttached();
    const tools = page.getByRole('region', { name: 'Technology names' });
    await tools.scrollIntoViewIfNeeded();
    // The loop runs once near the viewport, with the visitor's pause control (WCAG 2.2.2).
    await expect(tools).toHaveAttribute('data-animated', 'true');
    await page.getByRole('button', { name: 'Pause the moving list' }).click();
    await expect(tools).toHaveAttribute('data-held', 'true');
  });
});

// T-32 (#47): micro-interactions.
test.describe('micro-interactions', () => {
  // R4: the compacting bar became the brand-name collapse (past 48px), the sliding pill became aria-current text.
  test('nav brand name collapses after scrolling past 48px', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('header[data-site-nav]');
    await expect(nav).not.toHaveAttribute('data-brand-collapsed');
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'instant' }));
    await expect(nav).toHaveAttribute('data-brand-collapsed', '');
  });

  test('the current section is marked in the nav', async ({ page }) => {
    await page.goto('/about');
    const menu = page.getByRole('button', { name: 'Open menu' });
    if (await menu.isVisible()) await menu.click();
    await expect(
      page.getByRole('link', { name: 'About', exact: true }).locator('visible=true').first(),
    ).toHaveAttribute('aria-current', 'page');
  });

  test.describe('reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });
    test('about: bars and counters render final values, nothing animates', async ({ page }) => {
      await page.goto('/about');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForLoadState('networkidle');
      const running = await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === 'running').length,
      );
      expect(running).toBe(0);
      for (const bar of await page.getByRole('progressbar').all()) {
        const now = Number(await bar.getAttribute('aria-valuenow'));
        const inner = await bar.locator('div').evaluate((el) => getComputedStyle(el).transform);
        const scale = inner === 'none' ? 1 : Number(inner.match(/matrix\(([^,]+)/)?.[1]);
        expect(Math.round(scale * 100)).toBe(now);
      }
    });
    test('theme switch is instant: no cross-fade transition under reduced motion', async ({
      page,
    }) => {
      await page.goto('/');
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
      const menu = page.locator('[data-theme-toggle]');
      if (await menu.isVisible()) {
        await menu.click();
        await page.getByRole('menuitemradio', { name: 'Light' }).click();
      } else {
        await page.getByRole('button', { name: 'Open menu' }).click();
        await page.getByRole('radio', { name: 'Light' }).click();
      }
      await expect(html).not.toHaveClass(/dark/);
      // global.css: the theme-switching cross-fade only applies with motion allowed.
      expect(
        await page.evaluate(() => getComputedStyle(document.body).transitionDuration),
      ).not.toBe('0.35s');
    });
  });
});

// R3: the GSAP / Lenis motion layer on the dev-only /__motion preview (VITE_MOTION_PREVIEW=1 in the e2e build).
test.describe('motion layer', () => {
  const engineRequests = (page: import('@playwright/test').Page) => {
    const urls: string[] = [];
    page.on('request', (r) => {
      if (
        /\/assets\/(gsap|ScrollTrigger|lenis|SplitText|Flip(?!Group)|[\w-]*-engine)[\w-]*\.js$/.test(
          r.url(),
        )
      )
        urls.push(r.url());
    });
    return urls;
  };

  test('GSAP and Lenis are never in the served HTML (initial module graph)', async ({
    request,
  }) => {
    for (const path of ['/', '/about', '/id/']) {
      const html = await (await request.get(path)).text();
      expect(html).toMatch(/<script type="module"/);
      expect(html).not.toMatch(
        /assets\/(gsap|lenis|ScrollTrigger|SplitText|Flip(?!Group)|[\w-]*-engine)[\w-]*\.js/,
      );
    }
  });

  test('h2 splits into masked words and ends fully shown; count-up lands on the final value', async ({
    page,
  }) => {
    await page.goto('/__motion');
    const h2 = page.locator('#mp-specs-h');
    await h2.scrollIntoViewIfNeeded();
    await expect(h2).toHaveAttribute('data-revealed', '', { timeout: 8000 });
    await expect(h2).toHaveAttribute('aria-label', 'Words rise into place as you arrive');
    expect(await h2.locator('.str-word').count()).toBeGreaterThan(3);
    await expect(h2).toHaveText('Words rise into place as you arrive');
    const value = page.locator('#mp-specs dd').first();
    await expect(value.locator('[aria-hidden="true"]')).toHaveText('42', { timeout: 5000 });
    await expect(value.locator('.sr-only')).toHaveText('42');
  });

  test('parallax scrubs the standalone photo; clickable photos get the soft light', async ({
    page,
  }) => {
    await page.goto('/__motion');
    const layer = page.locator('[data-parallax]');
    await layer.scrollIntoViewIfNeeded();
    await expect
      .poll(() => layer.evaluate((el) => getComputedStyle(el).transform), { timeout: 8000 })
      .not.toBe('none');
    // Never zoom and parallax on one photo.
    await expect(page.locator('[data-parallax]').locator('xpath=..')).not.toHaveAttribute(
      'data-media-interactive',
      '',
    );
    await expect(page.locator('[data-media-interactive] [data-soft-light="photo"]')).toHaveCount(2);
  });

  test('marquee loops, has a working Pause/Play control, and copies are hidden from AT', async ({
    page,
  }) => {
    await page.goto('/__motion');
    const region = page.getByRole('region', { name: 'Tools' });
    await region.scrollIntoViewIfNeeded();
    await expect(region).toHaveAttribute('data-animated', 'true', { timeout: 8000 });
    await expect(region.locator('[data-marquee-copy]').first()).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    const pause = page.getByRole('button', { name: 'Pause the moving list' });
    await pause.click();
    await expect(region).toHaveAttribute('data-held', 'true');
    await expect(page.getByRole('button', { name: 'Play the moving list' })).toBeVisible();
  });

  test('FlipGroup glides kept items when the filter changes', async ({ page }) => {
    await page.goto('/__motion');
    const group = page.getByTestId('mp-flip');
    await group.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300); // let the Flip engine load near the viewport
    await page.getByRole('button', { name: 'Even' }).click();
    await expect(group.locator('li')).toHaveCount(4);
    await expect(group).toHaveAttribute('data-flip-runs', '1');
  });

  test('rows stagger by translate only (never opacity)', async ({ page }) => {
    await page.goto('/__motion');
    await page.locator('#mp-rows').scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName)),
      )
      .toContain('mo-row-in');
    const opacity = await page
      .locator('.stagger-row > *')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
    expect(opacity.every((o) => o === '1')).toBe(true);
  });

  test('a link between routes runs a view transition and morphs the shared photo', async ({
    page,
  }) => {
    await page.goto('/__motion');
    await page.evaluate(() => {
      const w = window as unknown as { __vt: number };
      w.__vt = 0;
      const orig = document.startViewTransition.bind(document);
      document.startViewTransition = ((arg: never) => {
        w.__vt++;
        return orig(arg);
      }) as typeof document.startViewTransition;
    });
    await page.getByRole('link', { name: /Item alpha/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Item alpha' })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBeGreaterThan(
      0,
    );
  });

  test('with Lenis on, Tab scrolls the focused control into view', async ({ page }) => {
    await page.goto('/__motion');
    await expect(page.locator('html')).toHaveClass(/has-lenis/, { timeout: 8000 });
    // Tab through from the top (no programmatic scroll), as a keyboard visitor would.
    await page.locator('body').focus();
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(350); // a Lenis tick must not drag the page back
      await expect(page.locator(':focus')).toBeInViewport();
    }
  });

  test.describe('reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });
    test('nothing splits, counts, loops or loads an engine; marquee is one wrapped line', async ({
      page,
    }) => {
      const urls = engineRequests(page);
      await page.goto('/__motion');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      await expect(page.locator('.str-word')).toHaveCount(0);
      await expect(page.locator('[data-counting]')).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Tools' })).not.toHaveAttribute(
        'data-animated',
        'true',
      );
      await expect(page.locator('[data-marquee-copy]').first()).toBeHidden();
      await expect(page.getByRole('button', { name: /moving list/ })).toBeHidden();
      await expect(page.locator('[data-inset="armed"]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(
        false,
      );
      const running = await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === 'running').length,
      );
      expect(running).toBe(0);
      expect(urls).toEqual([]);
    });
  });
});
