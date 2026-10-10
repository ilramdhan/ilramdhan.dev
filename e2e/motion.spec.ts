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
