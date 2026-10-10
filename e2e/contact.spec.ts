import { expect, test } from './fixtures/test';

// Regression for T-21 (#36): a successful submission shows exactly one toast.
test('contact form shows exactly one success toast', async ({ page, supabase }) => {
  // The home page runs two continuous WebGL loops (3D hero card + Vanta globe) that
  // starve the main thread under software rendering. Fake timers let us pause them
  // (`clock.fastForward` fires due timers/animation frames at most once, so the
  // expensive WebGL frames don't pile up).
  test.slow();
  await page.clock.install();
  await page.goto('/');
  const form = page.locator('#contact form');
  await expect(form).toBeVisible();
  await page.clock.pauseAt(Date.now() + 60_000);
  await form.scrollIntoViewIfNeeded();
  await form.getByLabel('Name').fill('E2E Visitor');
  await form.getByLabel('Email').fill('visitor@example.com');
  await form.getByLabel('Message').fill('Hello from the end-to-end test suite!');

  // Count every toast ever added, so a duplicate is caught even after it auto-dismisses.
  await page.evaluate(() => {
    const w = window as unknown as { __toasts: string[] };
    const seen = new WeakSet<Element>();
    w.__toasts = [];
    new MutationObserver(() => {
      for (const el of document.querySelectorAll('[data-sonner-toast]')) {
        if (seen.has(el)) continue;
        seen.add(el);
        w.__toasts.push(el.textContent ?? '');
      }
    }).observe(document.body, { childList: true, subtree: true });
  });

  const insert = page.waitForRequest(
    (req) => req.method() === 'POST' && req.url().includes('/rest/v1/messages'),
  );
  await form.getByRole('button', { name: /send message/i }).click();
  await insert;

  // Let React Query / sonner timers run, and give a duplicate toast (the old bug) time to appear.
  await expect(async () => {
    await page.clock.fastForward(250);
    await expect(page.locator('[data-sonner-toast]', { hasText: 'Message sent!' })).toBeVisible({
      timeout: 100,
    });
  }).toPass();
  await page.clock.fastForward(2000);
  const toasts = await page.evaluate(() => (window as unknown as { __toasts: string[] }).__toasts);
  expect(toasts).toHaveLength(1);
  expect(toasts[0]).toContain('Message sent!');

  const posted = supabase.requests.find(
    (r) => r.method === 'POST' && r.path.startsWith('/rest/v1/messages'),
  );
  expect(JSON.parse(posted?.body ?? '{}')).toMatchObject({
    name: 'E2E Visitor',
    email: 'visitor@example.com',
  });
});
