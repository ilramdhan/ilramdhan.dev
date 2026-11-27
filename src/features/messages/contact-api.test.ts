// Tests for the Vercel Function api/contact.ts (kept out of api/: every file there becomes a function).
import { describe, expect, it, vi } from 'vitest';
import { handleComment } from '../../../api/comment';
import { handleContact } from '../../../api/contact';

const env = {
  TURNSTILE_SECRET_KEY: 'secret',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  VITE_SUPABASE_URL: 'https://ref.supabase.co',
};
const valid = {
  name: 'Visitor',
  email: 'v@example.com',
  message: 'Hello, this is long enough.',
  'cf-turnstile-response': 'token',
};
const post = (fields: Record<string, string>) =>
  new Request('https://x.test/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });
/** siteverify answers `success`; the insert answers `insertStatus`. */
const backend = (
  success: boolean,
  insertStatus = 201,
  extra: object = { action: 'contact', hostname: 'x.test' },
) =>
  vi.fn<typeof fetch>((input) =>
    Promise.resolve(
      (input as URL | string).toString().includes('challenges.cloudflare.com')
        ? new Response(JSON.stringify({ success, ...extra }))
        : new Response(null, { status: insertStatus }),
    ),
  );
const str = (v: unknown) => (v as URL | string | URLSearchParams).toString();

describe('api/contact', () => {
  it('verifies the token, then inserts with the service-role key', async () => {
    const f = backend(true);
    const res = await handleContact(post(valid), env, f);
    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(2);
    const [verifyUrl, verifyInit] = f.mock.calls[0]!;
    expect(str(verifyUrl)).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(str(verifyInit?.body)).toContain('secret=secret');
    const [insertUrl, insertInit] = f.mock.calls[1]!;
    expect(str(insertUrl)).toBe('https://ref.supabase.co/rest/v1/messages');
    expect(new Headers(insertInit?.headers).get('apikey')).toBe('service');
    expect(JSON.parse(str(insertInit?.body))).toEqual({
      name: 'Visitor',
      email: 'v@example.com',
      message: 'Hello, this is long enough.',
    });
  });

  it('rejects a failed Turnstile check with 403 and inserts nothing', async () => {
    const f = backend(false);
    const res = await handleContact(post(valid), env, f);
    expect(res.status).toBe(403);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing token with 403 without calling Cloudflare', async () => {
    const f = backend(true);
    const noToken: Record<string, string> = { ...valid };
    delete noToken['cf-turnstile-response'];
    expect((await handleContact(post(noToken), env, f)).status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with 400 before any network call', async () => {
    const f = backend(true);
    const res = await handleContact(
      post({ ...valid, email: 'nope', message: 'x'.repeat(5001) }),
      env,
      f,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { fields: Record<string, string[]> };
    expect(Object.keys(body.fields)).toEqual(expect.arrayContaining(['email', 'message']));
    expect(f).not.toHaveBeenCalled();
  });

  it('caps the body size, drops honeypot posts, refuses GET and missing config', async () => {
    const f = backend(true);
    expect((await handleContact(post({ ...valid, pad: 'x'.repeat(40_000) }), env, f)).status).toBe(
      413,
    );
    expect((await handleContact(post({ ...valid, website: 'spam' }), env, f)).status).toBe(200);
    expect(f).not.toHaveBeenCalled();
    expect((await handleContact(new Request('https://x.test/api/contact'), env, f)).status).toBe(
      405,
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await handleContact(post(valid), { ...env, TURNSTILE_SECRET_KEY: '' }, f)).status).toBe(
      503,
    );
  });

  it('reports a failed insert as 502', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await handleContact(post(valid), env, backend(true, 500))).status).toBe(502);
  });

  it('rejects a token minted for another action', async () => {
    const res = await handleContact(
      post(valid),
      env,
      backend(true, 201, { action: 'login', hostname: 'x.test' }),
    );
    expect(res.status).toBe(403);
  });

  it('rejects a token from a hostname outside TURNSTILE_HOSTNAMES', async () => {
    const hostEnv = { ...env, TURNSTILE_HOSTNAMES: 'ilramdhan.dev, www.ilramdhan.dev' };
    const bad = backend(true, 201, { action: 'contact', hostname: 'evil.test' });
    expect((await handleContact(post(valid), hostEnv, bad)).status).toBe(403);
    const ok = backend(true, 201, { action: 'contact', hostname: 'www.ilramdhan.dev' });
    expect((await handleContact(post(valid), hostEnv, ok)).status).toBe(200);
  });

  it('api/comment: checks the comment action, then inserts into blog_comments (pending by DB default)', async () => {
    const comment = {
      blog_id: '7',
      name: 'Reader',
      content: 'Nice',
      'cf-turnstile-response': 'token',
    };
    const f = backend(true, 201, { action: 'comment' });
    expect((await handleComment(post(comment), env, f)).status).toBe(200);
    const [insertUrl, insertInit] = f.mock.calls[1]!;
    expect(str(insertUrl)).toBe('https://ref.supabase.co/rest/v1/blog_comments');
    // Only the validated fields: a client can't send `approved: true`.
    expect(JSON.parse(str(insertInit?.body))).toEqual({
      blog_id: 7,
      name: 'Reader',
      content: 'Nice',
    });
    // A contact token can't post a comment.
    expect((await handleComment(post(comment), env, backend(true))).status).toBe(403);
    expect((await handleComment(post({ ...comment, content: ' ' }), env, f)).status).toBe(400);
  });
});
