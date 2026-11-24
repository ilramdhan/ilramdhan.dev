import { expect, test } from './fixtures/test';

// T-60 (#135) → R6a: a project card is one linked group (photo, title, line, chevron); demo and repo links live on
// the detail page, absolute.

const card = (page: import('@playwright/test').Page) =>
  page.locator('a[href="/projects/project-1"]').first();

test('the card is one link with the screenshot, title and a "View project" chevron', async ({
  page,
}) => {
  await page.goto('/projects');
  const c = card(page);
  await expect(c).toContainText('Project 1');
  await expect(c).toContainText('View project');
  await expect(c.locator('img')).toHaveAttribute('alt', 'Screenshot of Project 1');
  // No nested links or buttons: a link inside a link is invalid HTML.
  await expect(c.locator('a, button')).toHaveCount(0);
});

test('the card shows a focus ring on keyboard focus', async ({ page }) => {
  await page.goto('/projects');
  const c = card(page);
  await c.focus();
  await expect(c).toBeFocused();
  expect(await c.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
});

test('the photo zooms only when the link is hovered', async ({ page }) => {
  await page.goto('/projects');
  const img = card(page).locator('img');
  await page.mouse.move(0, 0);
  await expect(img).toHaveCSS('scale', 'none');
  await card(page).hover();
  await expect.poll(() => img.evaluate((el) => getComputedStyle(el).scale)).not.toBe('none');
});

test('clicking a carousel dot on the detail page changes the slide', async ({ page }) => {
  await page.goto('/projects/project-1');
  const carousel = page.getByRole('group', { name: 'Screenshot of Project 1' });
  await carousel.getByRole('button', { name: 'Show image 2 of 2' }).click();
  await expect(carousel.locator('img')).toHaveAttribute('alt', /image 2 of 2$/);
  await expect(page).toHaveURL(/\/projects\/project-1$/);
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
