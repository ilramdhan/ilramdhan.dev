import { expect, test } from './fixtures/test';

// F-1/F-2/F-6: featured projects, articles and certificates are exactly one row at every width, text lines align.
for (const id of ['projects', 'blog', 'certificates']) {
  test(`#${id} is one row with equal-height items`, async ({ page }) => {
    await page.goto(`/#${id}`);
    const items = page.locator(`#${id} ul > li`).filter({ has: page.locator('a') });
    await expect(items.first()).toBeVisible();
    const boxes = await items.evaluateAll((els) =>
      els
        .filter((e) => (e as HTMLElement).offsetParent !== null)
        .map((e) => {
          // offsetTop: the row stagger translates items, which moves their rect.
          return {
            top: (e as HTMLElement).offsetTop,
            h: Math.round(e.getBoundingClientRect().height),
          };
        }),
    );
    expect(boxes.length).toBeGreaterThan(0);
    expect(new Set(boxes.map((b) => b.top)).size).toBe(1);
    expect(new Set(boxes.map((b) => b.h)).size).toBe(1);
  });
}

test('the About teaser shows one sentence of the bio and links to /about', async ({ page }) => {
  await page.goto('/');
  const teaser = page.getByRole('region', { name: 'About me' });
  await expect(teaser.locator('[data-scroll-fill]')).toHaveText('This is dummy bio.');
  await expect(teaser.getByRole('link', { name: 'More about me' })).toHaveAttribute(
    'href',
    '/about',
  );
});

test('a direct load of /#certificates scrolls to the section', async ({ page }) => {
  await page.goto('/#certificates');
  // The page load is a POP navigation; it used to reset to the top.
  await expect
    .poll(() =>
      page.evaluate(() => document.getElementById('certificates')!.getBoundingClientRect().top),
    )
    .toBeLessThan(100);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});
