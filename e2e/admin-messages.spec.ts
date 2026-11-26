import type { Page } from '@playwright/test';
import type { SupabaseMock } from './fixtures/supabase-mock';
import { signIn } from './fixtures/session';
import { expect, test } from './fixtures/test';

// F12 step 1: the admin inbox (list, read, delete, bulk delete, pagination), proven before the redesign.

const writes = (mock: SupabaseMock, method: string) =>
  mock.requests.filter((r) => r.method === method && r.path.startsWith('/rest/v1/messages'));

const message = (id: number) => ({
  id,
  created_at: new Date(Date.UTC(2026, 0, 1, 0, id)).toISOString(),
  name: `Sender ${id}`,
  email: `s${id}@example.com`,
  message: `Body ${id}`,
  is_read: id % 2 === 0,
});

async function openInbox(page: Page) {
  await signIn(page);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'General Settings' })).toBeVisible();
  const open = page.getByRole('button', { name: 'Open menu' });
  if (await open.isVisible()) await open.click();
  await page
    .locator('aside:visible')
    .getByRole('button', { name: 'Messages', exact: true })
    .click();
}

test('lists messages, marks one read, deletes one, marks all read', async ({ page, supabase }) => {
  await openInbox(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Inbox (1)' })).toBeVisible();
  await expect(page.getByText('Hello there')).toBeVisible();
  await expect(page.getByText('v@example.com')).toBeVisible();

  await page.getByRole('button', { name: 'Mark as Read' }).click();
  await expect.poll(() => writes(supabase, 'PATCH').length).toBe(1);
  expect(writes(supabase, 'PATCH')[0]!.path).toContain('id=eq.1');
  expect(JSON.parse(writes(supabase, 'PATCH')[0]!.body ?? 'null')).toEqual({ is_read: true });

  await page.getByRole('button', { name: 'Mark All Read' }).click();
  await expect(page.getByText('All messages marked as read.')).toBeVisible();
  expect(writes(supabase, 'PATCH').at(-1)!.path).toContain('is_read=eq.false');

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Message deleted.')).toBeVisible();
  expect(writes(supabase, 'DELETE').at(-1)!.path).toContain('id=eq.1');
});

test('read messages have no "Mark as Read" button', async ({ page, supabase }) => {
  supabase.db.messages = [{ ...message(2), is_read: true }];
  await openInbox(page);
  await expect(page.getByText('Body 2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark as Read' })).toHaveCount(0);
});

test('bulk delete asks first and deletes only the selected messages', async ({
  page,
  supabase,
}) => {
  supabase.db.messages = [1, 2, 3].map(message);
  await openInbox(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Inbox (3)' })).toBeVisible();
  const boxes = page.getByRole('checkbox');
  await boxes.nth(0).check();
  await boxes.nth(2).check();
  const bulk = page.getByRole('button', { name: 'Delete Selected (2)' });

  page.once('dialog', (d) => void d.dismiss());
  await bulk.click();
  await expect(bulk).toBeVisible();
  expect(writes(supabase, 'DELETE')).toHaveLength(0);

  page.once('dialog', (d) => {
    expect(d.message()).toBe('Delete 2 messages?');
    void d.accept();
  });
  await bulk.click();
  await expect(page.getByText('Messages deleted.')).toBeVisible();
  // Newest first: rows 3 and 1.
  expect(writes(supabase, 'DELETE').map((r) => r.path.match(/id=eq\.(\d+)/)?.[1])).toEqual([
    '3',
    '1',
  ]);
  await expect(page.getByRole('button', { name: /Delete Selected/ })).toHaveCount(0);
});

test('paginates 10 per page', async ({ page, supabase }) => {
  supabase.db.messages = Array.from({ length: 12 }, (_, i) => message(i + 1));
  await openInbox(page);
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  await expect(page.getByText('Body 12', { exact: true })).toBeVisible();
  await expect(page.getByText('Body 1', { exact: true })).toHaveCount(0);
  // ponytail: pager buttons have no accessible name yet (icon only); F12 step 2 should name them.
  const pager = page
    .getByText(/^Page \d+ of 2$/)
    .locator('..')
    .getByRole('button');
  await pager.last().click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(page.getByText('Body 1', { exact: true })).toBeVisible();
  await expect(pager.last()).toBeDisabled();
});

test('empty inbox says so', async ({ page, supabase }) => {
  supabase.db.messages = [];
  await openInbox(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Inbox (0)' })).toBeVisible();
  await expect(page.getByText('No messages received yet.')).toBeVisible();
});
