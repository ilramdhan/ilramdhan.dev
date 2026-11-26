import type { Page } from '@playwright/test';
import type { SupabaseMock } from './fixtures/supabase-mock';
import { signIn } from './fixtures/session';
import { expect, test } from './fixtures/test';

// F12 step 1: form behaviours not covered by admin-crud (featured toggle, removing a stored
// image, file uploads, cancel, failed save), proven before the redesign.

const lastBody = (mock: SupabaseMock, method: string, table: string) =>
  JSON.parse(
    mock.requests
      .filter((r) => r.method === method && r.path.startsWith(`/rest/v1/${table}`))
      .at(-1)?.body ?? 'null',
  ) as Record<string, unknown>;

/** Accepts Storage uploads and records their object keys. */
async function acceptUploads(page: Page) {
  const keys: string[] = [];
  await page.route('**/storage/v1/object/**', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const key = decodeURIComponent(
      new URL(route.request().url()).pathname.replace('/storage/v1/object/', ''),
    );
    keys.push(key);
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"Id":"x"}' });
  });
  return keys;
}

async function openTab(page: Page, label: string) {
  const open = page.getByRole('button', { name: 'Open menu' });
  if (await open.isVisible()) await open.click();
  await page.locator('aside:visible').getByRole('button', { name: label, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

async function goAdmin(page: Page) {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'General Settings' })).toBeVisible();
}

test('featured toggle and removing a stored image are saved', async ({ page, supabase }) => {
  await goAdmin(page);
  await openTab(page, 'Projects');
  await page.getByRole('button', { name: 'Edit Project 1', exact: true }).click();
  const featured = page.getByRole('checkbox', { name: 'Featured' });
  await expect(featured).toBeChecked();
  await featured.uncheck();
  await page
    .getByRole('list', { name: 'Current Images' })
    .getByRole('button', { name: 'Remove image' })
    .first()
    .click();
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Project updated!')).toBeVisible();
  const patch = lastBody(supabase, 'PATCH', 'projects');
  expect(patch.is_featured).toBe(false);
  // Project 1 had two images; the first was removed.
  expect(patch.images).toEqual([expect.stringContaining('p1b')]);
});

test('cancel closes the form without saving', async ({ page, supabase }) => {
  await goAdmin(page);
  await openTab(page, 'Blog');
  await page.getByRole('button', { name: 'Write Article' }).click();
  await expect(page.getByRole('heading', { name: 'Create Article' })).toBeVisible();
  await page.getByLabel('Title').fill('Draft');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Create Article' })).toHaveCount(0);
  expect(supabase.requests.filter((r) => r.method !== 'GET' && r.path.includes('/blogs'))).toEqual(
    [],
  );
});

test('a failed save shows the server error and keeps the form open', async ({ page }) => {
  await goAdmin(page);
  await page.route('**/rest/v1/services*', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 400, contentType: 'application/json', body: '{"message":"nope"}' })
      : route.fallback(),
  );
  await openTab(page, 'Services');
  await page.getByRole('button', { name: 'Add Service' }).click();
  await page.getByLabel('Service Title').fill('Broken');
  await page.getByLabel('Description (Markdown)').fill('Valid text');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('nope')).toBeVisible();
  await expect(page.getByLabel('Service Title')).toHaveValue('Broken');
});

test('certificate file upload stores the PDF and saves its URL', async ({ page, supabase }) => {
  const keys = await acceptUploads(page);
  await goAdmin(page);
  await openTab(page, 'Certificates');
  await page.getByRole('button', { name: 'Edit Cert 1', exact: true }).click();
  await page.getByLabel('Certificate File (PDF/Image)').setInputFiles({
    name: 'cert.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 test'),
  });
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Certificate updated!')).toBeVisible();
  expect(keys).toHaveLength(1);
  expect(keys[0]).toMatch(/^ilramdhan\.dev\/certificates\/[0-9a-f-]{36}\.pdf$/);
  expect(lastBody(supabase, 'PATCH', 'certificates').file_url).toMatch(
    /\/certificates\/[0-9a-f-]{36}\.pdf$/,
  );
});

test('profile: CV upload saves resume_url and a wrong type is refused', async ({
  page,
  supabase,
}) => {
  const keys = await acceptUploads(page);
  await goAdmin(page);
  await expect(page.getByRole('link', { name: 'Current CV' })).toBeVisible();
  const cv = page.getByLabel('Resume / CV (PDF)');
  await cv.setInputFiles({ name: 'cv.png', mimeType: 'image/png', buffer: Buffer.from('x') });
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(
    page.getByText('"cv.png" is not an allowed file type (allowed: pdf).'),
  ).toBeVisible();
  expect(keys).toEqual([]);

  await cv.setInputFiles({
    name: 'cv.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF'),
  });
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Profile updated!')).toBeVisible();
  expect(keys[0]).toMatch(/^ilramdhan\.dev\/cv\/[0-9a-f-]{36}\.pdf$/);
  // social_links rides along: the stored LinkedIn URL lacks a scheme (see admin-crud).
  expect(lastBody(supabase, 'PATCH', 'profile').resume_url).toMatch(/\/cv\/[0-9a-f-]{36}\.pdf$/);
});

test('profile: ID texts are saved into translations.id', async ({ page, supabase }) => {
  await goAdmin(page);
  await page.getByRole('tab', { name: 'ID' }).click();
  await page.getByRole('tabpanel').getByLabel('Badge Text').fill('Terbuka');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Profile updated!')).toBeVisible();
  expect(lastBody(supabase, 'PATCH', 'profile').translations).toEqual({
    id: { badge_text: 'Terbuka' },
  });
});
