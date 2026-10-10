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
            (el) => el.style.transform && el.style.transform !== 'none',
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
  const wrapper = card.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
  await expect(wrapper).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await expect(wrapper).toHaveCSS('opacity', '1');
});

// T-31 (#46): static H1 with the owner's name + accessible rotating role line.
test.describe('hero', () => {
  test('H1 is the static owner name; roles are announced once and rotate visually', async ({
    page,
  }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('Dummy Dev');
    const roles = page.getByTestId('hero-roles');
    await expect(roles).toContainText('Web Developer, Backend Engineer, Open Source');
    // Visual rotation is hidden from assistive tech; the H1 text never changes.
    await expect(page.getByTestId('hero-role-current')).toHaveAttribute('aria-hidden', 'true');
    const first = await page.getByTestId('hero-role-current').textContent();
    await expect
      .poll(() => page.getByTestId('hero-role-current').textContent(), { timeout: 8000 })
      .not.toBe(first);
    await expect(h1).toHaveText('Dummy Dev');
  });

  test('rotating line causes no layout shift', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dummy Dev');
    await page.waitForTimeout(800); // let the hero entrance finish
    const before = await page.getByTestId('hero-roles').boundingBox();
    await page.waitForTimeout(3200);
    const after = await page.getByTestId('hero-roles').boundingBox();
    expect(after).toEqual(before);
  });

  test.describe('reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });
    test('role line is static (first role only)', async ({ page }) => {
      await page.goto('/');
      const current = page.getByTestId('hero-role-current');
      await expect(current).toHaveText('Web Developer');
      await page.waitForTimeout(3200);
      await expect(current).toHaveText('Web Developer');
    });
  });
});
