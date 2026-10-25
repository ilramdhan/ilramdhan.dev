import { expect, test } from './fixtures/test';

// T-60 (#135): project card actions are reachable without hover; detail links are absolute.

const card = (page: import('@playwright/test').Page) =>
  page
    .locator('a[href="/projects/project-1"]')
    .first()
    .locator('xpath=ancestor::div[contains(@class,"group")][1]');

test('card actions have accessible names and absolute URLs', async ({ page }) => {
  await page.goto('/projects');
  const demo = card(page).getByRole('link', { name: 'Live demo of Project 1' });
  const repo = card(page).getByRole('link', { name: 'Source code of Project 1' });
  await expect(demo).toHaveAttribute('href', /^https:\/\//);
  await expect(repo).toHaveAttribute('href', 'https://github.com/x/y');
  // Tech chips: three fit, so no "+N".
  await expect(card(page).getByRole('list', { name: 'Tech stack' }).locator('li')).toHaveCount(3);
});

test('card actions appear on keyboard focus and the card shows a focus ring', async ({ page }) => {
  await page.goto('/projects');
  const c = card(page);
  const demo = c.getByRole('link', { name: 'Live demo of Project 1' });
  const actions = demo.locator('xpath=..');
  await page.mouse.move(0, 0);
  await expect(actions).toHaveCSS('opacity', '0');
  await page.locator('a[href="/projects/project-1"]').first().focus();
  await expect(actions).toHaveCSS('opacity', '1');
  expect(await c.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  await demo.focus();
  await expect(demo).toBeFocused();
});

test('clicking a carousel dot changes the slide without leaving the list', async ({ page }) => {
  await page.goto('/projects');
  const carousel = card(page).getByRole('group', { name: 'Screenshot of Project 1' });
  await carousel.getByRole('button', { name: 'Show image 2 of 2' }).click({ force: true });
  await expect(carousel.locator('img')).toHaveAttribute('alt', /image 2 of 2$/);
  await expect(page).toHaveURL(/\/projects$/);
});

test('detail page demo/repo links are absolute', async ({ page }) => {
  await page.goto('/projects/project-1');
  await expect(page.getByRole('link', { name: 'Live Demo', exact: true })).toHaveAttribute(
    'href',
    /^https:\/\//,
  );
  await expect(page.getByRole('link', { name: 'View Source', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/x/y',
  );
});

test.describe('touch', () => {
  test.use({ hasTouch: true, isMobile: true });
  test('card actions are visible without hover', async ({ page }) => {
    await page.goto('/projects');
    const demo = card(page).getByRole('link', { name: 'Live demo of Project 1' });
    await expect(demo.locator('xpath=..')).toHaveCSS('opacity', '1');
  });
});
