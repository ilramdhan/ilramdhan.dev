import type { Page } from '@playwright/test';
import { signIn } from './fixtures/session';
import { expect, test } from './fixtures/test';

// T-41 (#56): translatable content. Blog post 4 / project 4 carry an Indonesian translation
// in the dataset; every other item falls back to English with a "not yet translated" note.

const NOTE = 'Belum diterjemahkan';

test('/id detail pages show the Indonesian text when present, in the static HTML too', async ({
  page,
  request,
}) => {
  const html = await (await request.get('/id/blog/blog-post-4')).text();
  expect(html).toContain('Pos Blog Empat');
  expect(html).not.toContain(NOTE);
  // The OG/title tags follow the translation.
  expect(html).toContain('<title>Pos Blog Empat');

  await page.goto('/id/blog/blog-post-4');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pos Blog Empat');
  await expect(page.getByTestId('not-translated')).toHaveCount(0);

  // English stays English (separate cache entry per locale).
  await page.goto('/blog/blog-post-4');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 4');
});

test('/id detail pages fall back to English with a note when there is no translation', async ({
  page,
  request,
}) => {
  const html = await (await request.get('/id/blog/blog-post-1')).text();
  expect(html).toContain('Blog Post 1');
  expect(html).toContain(NOTE);

  await page.goto('/id/blog/blog-post-1');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 1');
  await expect(page.getByTestId('not-translated')).toContainText(NOTE);

  await page.goto('/id/projects/project-1');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Project 1');
  await expect(page.getByTestId('not-translated')).toContainText(NOTE);

  await page.goto('/blog/blog-post-1');
  await expect(page.getByTestId('not-translated')).toHaveCount(0);
});

test('lists are localized per item', async ({ page }) => {
  await page.goto('/id/projects');
  await expect(page.getByText('Proyek Empat', { exact: true })).toBeVisible();
  await expect(page.getByText('Project 1', { exact: true })).toBeVisible();
});

test('English pages never ask for the translations column', async ({ page, supabase }) => {
  await page.goto('/blog/blog-post-4');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 4');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 4');
  expect(supabase.requests.filter((r) => /select=[^&]*translations/.test(r.path))).toEqual([]);
});

test('before the migration (no translations column) /id still renders English with the note', async ({
  page,
  supabase,
}) => {
  supabase.withoutTranslationsColumn = true;
  await page.goto('/id/blog/blog-post-2');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog Post 2');
  await expect(page.getByTestId('not-translated')).toContainText(NOTE);
  // Asked for the column, got the 400, retried without it. The prerendered seed paints the page first;
  // the requests come from the later idle refresh, so poll instead of reading them once.
  const selects = () =>
    supabase.requests
      .filter((r) => r.path.startsWith('/rest/v1/blogs') && r.path.includes('slug=eq.blog-post-2'))
      .map((r) => r.url.searchParams.get('select') ?? '');
  await expect.poll(() => selects().some((s) => s.includes('translations'))).toBe(true);
  await expect.poll(() => selects().some((s) => !s.includes('translations'))).toBe(true);
  await expect(page.getByTestId('not-translated')).toContainText(NOTE);
});

async function openProjectEditor(page: Page, name: string) {
  await page.goto('/admin/projects');
  await expect(page.getByRole('heading', { level: 1, name: 'Manage Projects' })).toBeVisible();
  await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
}

test.describe('admin EN | ID tabs', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'General Settings' })).toBeVisible();
  });

  test('tabs are keyboard operable and the ID text is saved into translations.id', async ({
    page,
    supabase,
  }) => {
    await openProjectEditor(page, 'Project 4');
    const tabs = page.getByRole('tablist', { name: 'Content language' });
    const en = tabs.getByRole('tab', { name: 'EN' });
    const id = tabs.getByRole('tab', { name: 'ID' });
    await expect(en).toHaveAttribute('aria-selected', 'true');
    await expect(id).toHaveAttribute('tabindex', '-1');

    await en.focus();
    await page.keyboard.press('ArrowRight');
    await expect(id).toHaveAttribute('aria-selected', 'true');
    await expect(id).toBeFocused();

    const title = page.getByRole('tabpanel').getByLabel('Title');
    await expect(title).toHaveValue('Proyek Empat');
    await title.fill('Proyek Empat Baru');
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Project updated!')).toBeVisible();

    const patch = supabase.requests.filter(
      (r) => r.method === 'PATCH' && r.path.startsWith('/rest/v1/projects'),
    );
    // `repo_url`: the stored value lacks a scheme and the form normalises URLs on save.
    expect(JSON.parse(patch.at(-1)?.body ?? 'null')).toEqual({
      repo_url: 'https://github.com/x/y',
      translations: {
        id: { title: 'Proyek Empat Baru', short_description: 'Deskripsi proyek.' },
      },
    });
  });

  test('saving without any ID text sends no translations', async ({ page, supabase }) => {
    await openProjectEditor(page, 'Project 1');
    await page.getByLabel('Title').fill('Project One');
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Project updated!')).toBeVisible();
    const patch = supabase.requests.filter(
      (r) => r.method === 'PATCH' && r.path.startsWith('/rest/v1/projects'),
    );
    expect(Object.keys(JSON.parse(patch.at(-1)?.body ?? '{}') as object)).not.toContain(
      'translations',
    );
  });
});
