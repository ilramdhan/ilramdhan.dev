import { expect, test } from './fixtures/test';

// F-7: the technologies are icons only; each one is named and shows its name on hover and keyboard focus.
const NAMES = ['React', 'TypeScript', 'Go', 'PostgreSQL', 'Docker'];

test('home: icon-only marquee, named, tooltip on focus, pause still works', async ({ page }) => {
  await page.goto('/');
  const region = page.getByRole('region', { name: 'Technology names' });
  await region.scrollIntoViewIfNeeded();
  for (const n of NAMES) {
    await expect(region.getByRole('img', { name: n, exact: true })).toHaveCount(1);
  }
  await expect(region.getByRole('listitem')).toHaveCount(NAMES.length);
  const icon = region.getByRole('img', { name: 'Go', exact: true });
  const box = await icon.boundingBox();
  // The marquee's scroll skew leaves sub-pixel rounding.
  expect(box?.width).toBeGreaterThanOrEqual(43.9);
  expect(box?.height).toBeGreaterThanOrEqual(43.9);
  await expect(region).toHaveAttribute('data-animated', 'true');
  await page.getByRole('button', { name: 'Pause the moving list' }).click();
  await expect(region).toHaveAttribute('data-held', 'true');
  // Keyboard focus (Shift+Tab from the pause control) reaches the last icon and shows its name.
  await page.getByRole('button', { name: 'Play the moving list' }).focus();
  await page.keyboard.press('Shift+Tab');
  const last = region.getByRole('img', { name: 'TypeScript', exact: true });
  await expect(last).toBeFocused();
  await expect.poll(() => last.evaluate((el) => getComputedStyle(el, '::after').opacity)).toBe('1');
  expect(await last.evaluate((el) => getComputedStyle(el, '::after').content)).toBe('"TypeScript"');
});

test('about: icons grouped under the category heading, each named and focusable', async ({
  page,
}) => {
  await page.goto('/about');
  const skills = page.getByRole('region', { name: 'Technologies I work with' });
  await expect(skills.getByRole('heading', { level: 3, name: 'X' })).toBeVisible();
  for (const n of NAMES) {
    const icon = skills.getByRole('img', { name: n, exact: true });
    await expect(icon).toBeVisible();
    const box = await icon.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  const first = skills.getByRole('img', { name: 'React', exact: true });
  await first.focus();
  await expect(first).toBeFocused();
});
