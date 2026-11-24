import { expect, test } from './fixtures/test';

// T-30 (#45): scroll restoration, anchor scrolling under the fixed navbar, transitions.

test('back/forward restores the previous scroll position', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Project 1', { exact: true }).first()).toBeAttached();
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(600);
  const before = await page.evaluate(() => Math.round(window.scrollY));

  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Privacy Policy');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.goBack();
  await expect(page.getByText('Project 1', { exact: true }).first()).toBeAttached();
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5000 })
    .toBeGreaterThan(before - 40);
});

test('/#contact from another page lands with the heading below the navbar', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  const menu = page.getByRole('button', { name: 'Open menu' });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('link', { name: 'Contact', exact: true })
    .locator('visible=true')
    .first()
    .click();
  const heading = page.getByRole('heading', { name: 'Get In Touch' });
  await expect(heading).toBeVisible();
  await expect
    .poll(
      async () => {
        const [box, nav] = await Promise.all([
          heading.boundingBox(),
          page.locator('header[data-site-nav]').boundingBox(),
        ]);
        return box && nav ? box.y >= nav.y + nav.height : false;
      },
      { timeout: 5000 },
    )
    .toBe(true);
  await expect(page).toHaveURL(/\/#contact$/);
});

test('in-page hash link on home scrolls the section below the navbar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Project 1', { exact: true }).first()).toBeAttached();
  const menu = page.getByRole('button', { name: 'Open menu' });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('link', { name: 'Contact', exact: true })
    .locator('visible=true')
    .first()
    .click();
  await expect(page).toHaveURL(/\/#contact$/);
  const section = page.locator('#contact');
  // Lands right under the 44px bar (scroll-padding: nav + 8px): never under it, never far below.
  await expect
    .poll(() => section.evaluate((el) => Math.round(el.getBoundingClientRect().top)), {
      timeout: 5000,
    })
    .toBeGreaterThanOrEqual(44);
  await expect
    .poll(() => section.evaluate((el) => Math.round(el.getBoundingClientRect().top)), {
      timeout: 5000,
    })
    .toBeLessThanOrEqual(60);
});

test('footer: doormat with real links only, and the wordmark rises while the curtain lifts', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy');
  const footer = page.getByRole('contentinfo');
  // Below 834px the link columns are Disclosure rows.
  const social = footer.getByRole('button', { name: 'Social' });
  if (await social.isVisible()) {
    await social.click();
    await expect(social).toHaveAttribute('aria-expanded', 'true');
  }
  await expect(footer.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/dummy',
  );
  await expect(footer.getByRole('link', { name: 'Email' })).toHaveAttribute(
    'href',
    'mailto:dummy@example.com',
  );
  // Not in the profile: not rendered.
  await expect(footer.getByRole('link', { name: 'YouTube' })).toHaveCount(0);
  await expect(footer.getByText('© 2026 Dummy Dev')).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Bahasa Indonesia' })).toHaveAttribute(
    'href',
    '/id/privacy',
  );
  if (testInfo.project.name !== 'desktop') return;
  // >= 834 x 760: sticky footer under the curtain + scrubbed wordmark (P17: also after client navigation).
  await page.setViewportSize({ width: 1280, height: 900 });
  const rise = page.locator('[data-wordmark-rise]');
  const yPercent = () =>
    rise.evaluate((el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return Math.round((m.m42 / el.getBoundingClientRect().height) * 100);
    });
  for (const go of [
    () => page.goto('/privacy'),
    async () => {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: 'About' })
        .click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dummy Dev');
    },
  ]) {
    await go();
    await expect(page.locator('[data-reveal-footer]')).toHaveCSS('position', 'sticky');
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const footerH = await page
      .locator('[data-reveal-footer]')
      .evaluate((el) => (el as HTMLElement).offsetHeight);
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: 'instant' }),
      max - footerH + 20,
    );
    await expect.poll(yPercent, { timeout: 8000 }).toBeGreaterThan(30);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), max);
    await expect.poll(yPercent, { timeout: 8000 }).toBe(0);
  }
});

// Footer reveal: a footer link is only clickable once the curtain has lifted off it. Scrolling to the bottom (the
// user's path) lifts it, so a click on a footer link from a long page must be quick. Scrolling only part way leaves
// the link under the curtain and Playwright waits for the lift (~6 s): that is the reveal, not a bug. The timeout
// is tight so a regression (a curtain that never lifts, or a covered footer) fails fast.
test('footer link clicks from the bottom of a long page are quick', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Privacy Policy' })
    .click({ timeout: 3000 });
  await expect(page).toHaveURL(/\/privacy$/, { timeout: 3000 });
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('route change plays no transition animation', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    const running = await page.evaluate(() =>
      document.getAnimations().map((a) => (a as CSSAnimation).animationName ?? a.constructor.name),
    );
    expect(running).toEqual([]);
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  });

  test('footer is static and the wordmark rests; the nav keeps the full brand name', async ({
    page,
  }) => {
    await page.goto('/privacy');
    await expect(page.locator('[data-reveal-footer]')).toHaveCSS('position', 'static');
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
    await expect(page.locator('header[data-site-nav]')).toHaveAttribute('data-brand-collapsed', '');
    expect(
      await page.evaluate(
        () => getComputedStyle(document.querySelector('.brand-letter:last-child')!).opacity,
      ),
    ).toBe('1');
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    );
    expect(
      await page.locator('[data-wordmark-rise]').evaluate((el) => getComputedStyle(el).transform),
    ).toBe('none');
  });
});
