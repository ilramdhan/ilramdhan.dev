import type { Page } from '@playwright/test';
import { handleComment } from '../api/comment';
import { handleContact } from '../api/contact';
import { expect, test } from './fixtures/test';

// F-10/F-11 (D10, D11): /contact + Turnstile. The e2e build carries Cloudflare's always-pass test site key.
// Cloudflare's api.js is replaced by a stand-in that renders the hidden token field like the real widget, and
// /api/contact runs the real handler (api/contact.ts) with Cloudflare's test secret keys: siteverify and the insert are
// answered here, so nothing reaches Cloudflare or Supabase.
const PASS_SECRET = '1x0000000000000000000000000000000AA';
const FAIL_SECRET = '2x0000000000000000000000000000000AA';

const FAKE_API_JS = `
  window.turnstile = {
    render(el, opts) {
      window.__turnstile = (window.__turnstile || []).concat([{ theme: opts.theme, language: opts.language, sitekey: opts.sitekey }]);
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'cf-turnstile-response';
      input.value = 'XXXX.DUMMY.TOKEN.XXXX';
      el.appendChild(input);
      return 'w' + window.__turnstile.length;
    },
    reset() {},
    remove() {},
  };
  window[new URL(document.currentScript.src).searchParams.get('onload')]();
`;

type Inserted = Record<string, string>;

async function mockTurnstile(page: Page, secret: string, fn: 'contact' | 'comment' = 'contact') {
  const inserted: Inserted[] = [];
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_API_JS }),
  );
  await page.route(`**/api/${fn}`, async (route, request) => {
    const req = new Request(`http://local/api/${fn}`, {
      method: request.method(),
      headers: request.headers(),
      body: request.postData() ?? '',
    });
    const fetchImpl = ((input: string | URL, init?: RequestInit) => {
      if (String(input).includes('siteverify')) {
        // Cloudflare's test secrets: 1x… always passes, 2x… always fails.
        const sent = new URLSearchParams(init?.body as string);
        return Promise.resolve(
          Response.json({ success: sent.get('secret') === PASS_SECRET, action: fn }),
        );
      }
      inserted.push(JSON.parse(init?.body as string) as Inserted);
      return Promise.resolve(new Response(null, { status: 201 }));
    }) as typeof fetch;
    const res = await (fn === 'contact' ? handleContact : handleComment)(
      req,
      {
        TURNSTILE_SECRET_KEY: secret,
        SUPABASE_SERVICE_ROLE_KEY: 'e2e-service',
        VITE_SUPABASE_URL: 'https://mock.supabase.co',
      },
      fetchImpl,
    );
    await route.fulfill({
      status: res.status,
      contentType: 'application/json',
      body: await res.text(),
    });
  });
  return inserted;
}

async function fill(page: Page) {
  const form = page.locator('main form');
  await form.getByLabel('Name').fill('E2E Visitor');
  await form.getByLabel('Email').fill('visitor@example.com');
  await form.getByLabel('Message').fill('Hello from the end-to-end test suite!');
  return form;
}

test('/contact (EN): h1, form, profile links (real entries only), mailto', async ({ page }) => {
  await mockTurnstile(page, PASS_SECRET);
  await page.goto('/contact');
  await expect(page.getByRole('heading', { level: 1, name: 'Get In Touch' })).toBeVisible();
  await expect(page.locator('main form').getByLabel('Email')).toBeVisible();
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/dummy',
  );
  // Short platform name like the other entries; the address only in the href and the accessible name.
  const mail = main.getByRole('link', { name: /^Email\s*:\s*dummy@example\.com$/ });
  await expect(mail).toHaveAttribute('href', 'mailto:dummy@example.com');
  expect(await mail.evaluate((a) => a.firstChild?.textContent)).toBe('Email');
  // Not in the profile: not rendered.
  await expect(main.getByRole('link', { name: 'YouTube' })).toHaveCount(0);
});

test('/id/contact: Indonesian page, widget in Indonesian', async ({ page }) => {
  await mockTurnstile(page, PASS_SECRET);
  await page.goto('/id/contact');
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await expect(page.getByRole('heading', { level: 1, name: 'Hubungi Saya' })).toBeVisible();
  await expect(page.locator('[data-turnstile] input[name="cf-turnstile-response"]')).toBeAttached();
  const calls = await page.evaluate(
    () => (window as unknown as { __turnstile: object[] }).__turnstile,
  );
  expect(calls.at(-1)).toMatchObject({ language: 'id', sitekey: '1x00000000000000000000AA' });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`widget theme (${theme})`, () => {
    test.use({ theme });
    test(`follows the site theme`, async ({ page }) => {
      await mockTurnstile(page, PASS_SECRET);
      await page.goto('/contact');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('[data-turnstile] input')).toBeAttached();
      const calls = await page.evaluate(
        () => (window as unknown as { __turnstile: Array<{ theme: string }> }).__turnstile,
      );
      expect(calls.at(-1)?.theme).toBe(theme);
    });
  });
}

test('pass key: verified send, exactly one success toast, message stored', async ({ page }) => {
  const inserted = await mockTurnstile(page, PASS_SECRET);
  await page.goto('/contact');
  const form = await fill(page);
  await expect(page.locator('[data-turnstile] input')).toBeAttached();

  // Count every toast ever added (T-21: a duplicate is caught even after it auto-dismisses).
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
  const sent = page.waitForResponse((r) => r.url().endsWith('/api/contact'));
  await form.getByRole('button', { name: 'Send Message' }).click();
  expect((await sent).status()).toBe(200);
  await expect(page.locator('[data-sonner-toast]', { hasText: 'Message sent!' })).toBeVisible();
  await expect(form.getByRole('status')).toHaveText('Message sent successfully!');
  await page.waitForTimeout(500);
  const toasts = await page.evaluate(() => (window as unknown as { __toasts: string[] }).__toasts);
  expect(toasts).toHaveLength(1);
  expect(inserted).toEqual([
    {
      name: 'E2E Visitor',
      email: 'visitor@example.com',
      message: 'Hello from the end-to-end test suite!',
    },
  ]);
});

test('fail key: the check is refused, nothing stored, the visitor is told to retry', async ({
  page,
  supabase,
}) => {
  const inserted = await mockTurnstile(page, FAIL_SECRET);
  await page.goto('/contact');
  const form = await fill(page);
  await expect(page.locator('[data-turnstile] input')).toBeAttached();
  const sent = page.waitForResponse((r) => r.url().endsWith('/api/contact'));
  await form.getByRole('button', { name: 'Send Message' }).click();
  expect((await sent).status()).toBe(403);
  await expect(form.getByRole('status')).toHaveText(
    'Please complete the security check, then send again.',
  );
  expect(inserted).toEqual([]);
  // The anon-key insert path is not used when Turnstile is on.
  expect(supabase.requests.some((r) => r.path.startsWith('/rest/v1/messages'))).toBe(false);
});

test('home: closing tile links to /contact, no form, no Turnstile script', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => r.url().includes('challenges.cloudflare.com') && scripts.push(r.url()));
  await page.goto('/');
  const tile = page.locator('#contact');
  await tile.scrollIntoViewIfNeeded();
  await expect(tile.getByRole('heading', { name: 'Get In Touch' })).toBeVisible();
  await expect(tile.locator('form')).toHaveCount(0);
  await expect(tile.getByRole('link', { name: 'Send a message' })).toHaveAttribute(
    'href',
    '/contact',
  );
  await page.goto('/id');
  await expect(page.locator('#contact').getByRole('link', { name: 'Kirim pesan' })).toHaveAttribute(
    'href',
    '/id/contact',
  );
  expect(scripts).toEqual([]);
});

test('every Contact link points to /contact (nav, hero pill, project CTA), locale-aware', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.locator('section[data-enter]').getByRole('link', { name: 'Contact Me' }),
  ).toHaveAttribute('href', '/contact');
  const navHrefs = await page
    .locator('nav a[href]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(navHrefs).toContain('/contact');
  await page.goto('/projects/project-1');
  await expect(page.getByRole('link', { name: 'Get in touch' })).toHaveAttribute(
    'href',
    '/contact',
  );
  await page.goto('/id');
  await expect(
    page.locator('section[data-enter]').getByRole('link', { name: 'Hubungi Saya' }),
  ).toHaveAttribute('href', '/id/contact');
});

test('blog comment: widget with the comment action, posts to /api/comment, held for moderation', async ({
  page,
  supabase,
}) => {
  const inserted = await mockTurnstile(page, PASS_SECRET, 'comment');
  await page.goto('/blog/blog-post-1');
  const form = page.locator('form', { has: page.getByRole('textbox', { name: 'Comment' }) });
  // The widget loads once the form nears the viewport (far down on mobile).
  await form.scrollIntoViewIfNeeded();
  await form.getByLabel('Name').fill('E2E Reader');
  await form.getByRole('textbox', { name: 'Comment' }).fill('Great read!');
  await expect(form.locator('[data-turnstile] input')).toBeAttached();
  const sent = page.waitForResponse((r) => r.url().endsWith('/api/comment'));
  await form.getByRole('button', { name: 'Post Comment' }).click();
  expect((await sent).status()).toBe(200);
  await expect(page.getByText('Your comment will appear once it’s approved.')).toBeVisible();
  expect(inserted).toEqual([{ blog_id: 1, name: 'E2E Reader', content: 'Great read!' }]);
  // No anon-key insert, and the new comment isn't shown before approval.
  expect(
    supabase.requests.some(
      (r) => r.method === 'POST' && r.path.startsWith('/rest/v1/blog_comments'),
    ),
  ).toBe(false);
  await expect(page.getByText('Great read!', { exact: true })).toHaveCount(0);
});
