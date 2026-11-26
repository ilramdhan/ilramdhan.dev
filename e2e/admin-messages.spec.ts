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
  await page.goto('/admin/messages');
}

/** Confirms the open delete dialog (F12 B4: every delete asks first). */
const confirmDelete = (page: Page) =>
  page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

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
  await confirmDelete(page);
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
  // Newest first: Sender 3, 2, 1. Each checkbox is named after its sender (F12 B3).
  await page.getByRole('checkbox', { name: 'Select message from Sender 3' }).check();
  await page.getByRole('checkbox', { name: 'Select message from Sender 1' }).check();
  const bulk = page.getByRole('button', { name: 'Delete Selected (2)' });

  await bulk.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(bulk).toBeVisible();
  expect(writes(supabase, 'DELETE')).toHaveLength(0);

  await bulk.click();
  await expect(page.getByRole('dialog', { name: 'Delete 2 messages?' })).toBeVisible();
  await confirmDelete(page);
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
  const next = page.getByRole('button', { name: 'Next page' });
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  await next.click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(page.getByText('Body 1', { exact: true })).toBeVisible();
  await expect(next).toBeDisabled();
});

test('empty inbox says so', async ({ page, supabase }) => {
  supabase.db.messages = [];
  await openInbox(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Inbox (0)' })).toBeVisible();
  await expect(page.getByText('No messages received yet.')).toBeVisible();
});

test('a failed delete is reported and a partial bulk delete keeps the rest selected (F12 B5)', async ({
  page,
  supabase,
}) => {
  supabase.db.messages = [1, 2, 3].map(message);
  await page.route('**/rest/v1/messages*', (route) =>
    route.request().method() === 'DELETE' && route.request().url().includes('id=eq.2')
      ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' })
      : route.fallback(),
  );
  await openInbox(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Inbox (3)' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete', exact: true }).nth(1).click();
  await confirmDelete(page);
  await expect(page.getByText("Couldn't delete the message: boom")).toBeVisible();

  for (const n of [3, 2]) {
    await page.getByRole('checkbox', { name: `Select message from Sender ${n}` }).check();
  }
  await page.getByRole('button', { name: 'Delete Selected (2)' }).click();
  await confirmDelete(page);
  await expect(page.getByText("1 of 2 messages couldn't be deleted. Try again.")).toBeVisible();
  // Only the failed one (Sender 2) stays selected; both deletes were attempted (the mock keeps rows).
  await expect(page.getByRole('button', { name: 'Delete Selected (1)' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Select message from Sender 2' })).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Select message from Sender 3' }),
  ).not.toBeChecked();
});

test('the nav shows the unread count', async ({ page, supabase }) => {
  supabase.db.messages = [1, 2, 3].map(message);
  await openInbox(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Inbox (3)' })).toBeVisible();
  // Odd ids are unread (see `message`).
  const open = page.getByRole('button', { name: 'Open menu' });
  if (await open.isVisible()) await open.click();
  const link = page
    .getByRole('navigation', { name: 'Dashboard' })
    .filter({ visible: true })
    .getByRole('link', { name: /^Messages/ });
  await expect(link).toHaveAccessibleName('Messages 2 unread');
});
