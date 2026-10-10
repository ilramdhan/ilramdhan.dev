import type { Page } from '@playwright/test';
import { signIn } from './fixtures/session';
import { expect, test } from './fixtures/test';

// T-27 (#42): public images carry width/height/alt, below-the-fold images are lazy, and
// admin uploads are compressed to WebP in the browser before they reach Storage.

/** Every `<img>` on the page that is missing width, height, alt or decoding. */
async function imagesMissingAttributes(page: Page) {
  return page
    .locator('img')
    .evaluateAll((imgs) =>
      imgs
        .filter((img) => ['width', 'height', 'alt'].some((a) => !img.hasAttribute(a)))
        .map((img) => img.outerHTML.slice(0, 120)),
    );
}

for (const path of [
  '/',
  '/about',
  '/projects',
  '/projects/project-1',
  '/blog',
  '/blog/blog-post-1',
  '/certificates',
]) {
  test(`${path}: every <img> has width, height and alt`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await imagesMissingAttributes(page)).toEqual([]);
  });
}

test('home: images below the fold are lazy', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');
  const eagerBelowFold = await page.locator('img').evaluateAll((imgs) =>
    imgs
      .filter((img) => img.getBoundingClientRect().top > window.innerHeight * 1.5)
      .filter((img) => img.getAttribute('loading') !== 'lazy')
      .map((img) => img.outerHTML.slice(0, 120)),
  );
  expect(eagerBelowFold).toEqual([]);
});

test('admin: a 4 MB JPEG is stored as a <= 400 KB WebP named with its size', async ({ page }) => {
  await signIn(page);
  const stored: { url: string; contentType: string; bytes: number }[] = [];
  await page.route('**/storage/v1/object/**', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    const body = req.postDataBuffer() ?? Buffer.alloc(0);
    stored.push({ url: req.url(), ...filePart(body, req.headers()['content-type'] ?? '') });
    const key = decodeURIComponent(new URL(req.url()).pathname.replace('/storage/v1/object/', ''));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ Key: key, Id: 'x' }),
    });
  });

  await page.goto('/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'General Settings' })).toBeVisible();

  // A photo-like JPEG (gradients + grain) of ~4 MB, generated in the browser.
  const jpeg = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 4000;
    canvas.height = 3000;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 4000, 3000);
    g.addColorStop(0, '#1e3a8a');
    g.addColorStop(0.5, '#f59e0b');
    g.addColorStop(1, '#065f46');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4000, 3000);
    const img = ctx.getImageData(0, 0, 4000, 3000);
    let seed = 1;
    for (let i = 0; i < img.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const n = (seed % 48) - 24;
      img.data[i] = img.data[i]! + n;
      img.data[i + 1] = img.data[i + 1]! + n;
      img.data[i + 2] = img.data[i + 2]! + n;
    }
    ctx.putImageData(img, 0, 0);
    for (const q of [0.95, 0.9, 0.85, 0.8, 0.7]) {
      const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', q));
      if (blob.size <= 4.9 * 1024 * 1024) {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000)
          bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(bin);
      }
    }
    throw new Error('could not make a <= 4.9 MB JPEG');
  });
  const buffer = Buffer.from(jpeg, 'base64');
  expect(buffer.length).toBeGreaterThan(3 * 1024 * 1024);

  const sidebar = page.locator('aside').first();
  if (!(await sidebar.isVisible())) await page.getByRole('button', { name: 'Open menu' }).click();
  await page
    .locator('aside:visible')
    .getByRole('button', { name: 'Projects', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add Project' }).click();
  await page.getByLabel('Title').fill('Compressed upload');
  await page
    .getByLabel('Images')
    .setInputFiles({ name: 'photo.jpg', mimeType: 'image/jpeg', buffer });
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Project added!')).toBeVisible();

  expect(stored).toHaveLength(1);
  const [upload] = stored;
  expect(upload!.contentType).toBe('image/webp');
  expect(upload!.url).toMatch(/\/projects\/[0-9a-f-]{36}_1600x1200\.webp$/);
  expect(upload!.bytes).toBeLessThanOrEqual(400 * 1024);
  testInfo().annotations.push({
    type: 'upload compression',
    description: `${(buffer.length / 1024).toFixed(0)} KB JPEG -> ${(upload!.bytes / 1024).toFixed(0)} KB WebP`,
  });
});

const testInfo = () => test.info();

/** storage-js posts Blobs as multipart/form-data: returns the file part's type and size. */
function filePart(body: Buffer, header: string): { contentType: string; bytes: number } {
  const boundary = header.match(/boundary=(.+)$/)?.[1];
  if (!boundary) return { contentType: header, bytes: body.length };
  const text = body.toString('latin1');
  const part = text
    .split(`--${boundary}`)
    .find((p) => /content-type:\s*image\//i.test(p) || /filename=/i.test(p));
  if (!part) return { contentType: '', bytes: 0 };
  const [head, ...rest] = part.split('\r\n\r\n');
  const content = rest.join('\r\n\r\n').replace(/\r\n$/, '');
  return {
    contentType: head?.match(/content-type:\s*([^\r\n;]+)/i)?.[1] ?? '',
    bytes: Buffer.byteLength(content, 'latin1'),
  };
}
