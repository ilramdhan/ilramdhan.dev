import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures/test';
import { horizontalOverflow, overflowingElements } from './helpers/layout';

// T-52 (#67) item 3: project gallery + lightbox, carousel, related projects.

const PROJECT = '/projects/project-1';
const ALT = 'Screenshot of Project 1';

test('thumbnails open a lightbox: right image, ←/→, Esc closes and focus returns', async ({
  page,
  consoleErrors,
}) => {
  await page.goto(PROJECT);
  const gallery = page.getByRole('list', { name: 'Gallery' });
  const thumbs = gallery.getByRole('button', { name: /full screen$/ });
  await expect(thumbs).toHaveCount(2);
  for (const thumb of await thumbs.all()) await expect(thumb).toBeVisible();

  const second = gallery.getByRole('button', { name: 'Open image 2 of 2 full screen' });
  await second.click();
  const dialog = page.getByRole('dialog', { name: 'Image viewer' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  const image = dialog.getByRole('img');
  await expect(image).toHaveAttribute('alt', `${ALT}: image 2 of 2`);
  await expect(image).toHaveAttribute('src', /p1b\.png$/);
  await expect(dialog.getByText('2 / 2')).toBeVisible();
  await expect(dialog.getByText(`${ALT}: image 2 of 2`)).toBeVisible();
  // The whole image fits the viewport.
  expect(await image.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
  // Page scroll is locked.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
    'hidden',
  );

  await page.keyboard.press('ArrowRight');
  await expect(image).toHaveAttribute('src', /p1a\.png$/);
  await expect(dialog.getByText('1 / 2')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(image).toHaveAttribute('src', /p1b\.png$/);
  await dialog.getByRole('button', { name: 'Next image' }).click();
  await expect(dialog.getByText('1 / 2')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(second).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');

  // Keyboard: Enter on a thumbnail opens it too.
  await gallery.getByRole('button', { name: 'Open image 1 of 2 full screen' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', `${ALT}: image 1 of 2`);
  await dialog.getByRole('button', { name: 'Close image viewer' }).click();
  await expect(dialog).toHaveCount(0);

  await page.waitForLoadState('networkidle');
  expect(consoleErrors).toEqual([]);
});

test('lightbox: a horizontal swipe changes the image', async ({ page }) => {
  await page.goto(PROJECT);
  await page.getByRole('button', { name: 'Open image 1 of 2 full screen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Image viewer' });
  const box = (await dialog.getByRole('img').boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 5 });
  await page.mouse.up();
  await expect(dialog.getByText('2 / 2')).toBeVisible();
});

test('the lightbox code is loaded on demand, not with the page', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') scripts.push(r.url());
  });
  await page.goto(PROJECT);
  await page.waitForLoadState('networkidle');
  expect(scripts.filter((u) => /\/Lightbox-[\w-]+\.js$/.test(u))).toEqual([]);
  await page.getByRole('button', { name: 'Open image 1 of 2 full screen' }).click();
  await expect(page.getByRole('dialog', { name: 'Image viewer' })).toBeVisible();
  expect(scripts.some((u) => /\/Lightbox-[\w-]+\.js$/.test(u))).toBe(true);
});

test('carousel: arrow keys and prev/next buttons change the slide', async ({ page }) => {
  await page.goto(PROJECT);
  const carousel = page.getByRole('group', { name: ALT });
  const img = carousel.locator('img');
  await expect(img).toHaveAttribute('alt', `${ALT}: image 1 of 2`);
  await carousel.focus();
  await page.keyboard.press('ArrowRight');
  await expect(img).toHaveAttribute('alt', `${ALT}: image 2 of 2`);
  await carousel.getByRole('button', { name: 'Previous image' }).click();
  await expect(img).toHaveAttribute('alt', `${ALT}: image 1 of 2`);
});

test('related projects and thumbnails are in the prerendered HTML', async ({ request }) => {
  const html = await (await request.get(PROJECT)).text();
  expect(html).toContain('Related projects');
  // Every fixture project is tagged "oss": the three newest others (same date → id desc).
  const section = html.slice(html.indexOf('Related projects'));
  for (const slug of ['long-content', 'project-8', 'project-7']) {
    expect(section).toContain(`href="/projects/${slug}"`);
  }
  expect(section).not.toContain('href="/projects/project-1"');
  expect(html).toContain('aria-label="Open image 1 of 2 full screen"');
  expect(html).not.toContain('role="dialog"');
});

test('related projects exclude the current one and link to their pages', async ({ page }) => {
  await page.goto(PROJECT);
  const related = page.getByRole('region', { name: 'Related projects' });
  await expect(related.getByRole('heading', { level: 3 })).toHaveCount(3);
  await expect(related.getByRole('link', { name: 'Project 1', exact: true })).toHaveCount(0);
  await related.getByRole('link', { name: 'Project 8', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Project 8');
});

test.describe('layout', () => {
  test('no horizontal overflow at 375 px, lightbox open or closed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    await page.goto(PROJECT);
    await page.waitForLoadState('networkidle');
    const check = async () => {
      const overflow = await horizontalOverflow(page);
      const culprits = overflow > 0 ? (await overflowingElements(page)).join(', ') : '';
      expect(overflow, `px of horizontal overflow (${culprits})`).toBe(0);
    };
    await check();
    await page.getByRole('button', { name: 'Open image 1 of 2 full screen' }).click();
    await expect(page.getByRole('dialog', { name: 'Image viewer' })).toBeVisible();
    await check();
  });

  test('sections share the left and right edges at 1280 px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop layout');
    await page.goto(PROJECT);
    await page.waitForLoadState('networkidle');
    const box = async (name: string, locator: Locator) => {
      const b = await locator.boundingBox();
      expect(b, name).not.toBeNull();
      return { name, left: b!.x, right: b!.x + b!.width };
    };
    const carousel = await box('carousel', page.getByRole('group', { name: ALT }));
    for (const b of [
      await box('gallery', page.getByRole('list', { name: 'Gallery' })),
      await box('related', page.getByRole('region', { name: 'Related projects' })),
    ]) {
      expect(Math.abs(b.left - carousel.left), `${b.name} left`).toBeLessThanOrEqual(1);
      expect(Math.abs(b.right - carousel.right), `${b.name} right`).toBeLessThanOrEqual(1);
    }
    const h1 = await box('h1', page.getByRole('heading', { level: 1 }));
    expect(Math.abs(h1.left - carousel.left), 'h1 left').toBeLessThanOrEqual(1);
  });
});
