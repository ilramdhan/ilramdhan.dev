// Contact form with Cloudflare Turnstile (D10). Used only when the site is built with
// VITE_TURNSTILE_SITE_KEY; without it the form inserts with the anon key as before.
// Order: size cap → zod (same schema as the form) → Turnstile siteverify → insert with the
// service-role key (PostgREST over fetch: no client library in the function bundle).
// Relative imports on purpose: Vercel bundles this file without tsconfig paths.
import { validateContactForm } from '../src/features/messages/contact-validation';
import { en } from '../src/i18n/messages/en';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Name 100 + email 320 + message 5000 chars (multi-byte), token ~2 KB, plus form encoding. */
const MAX_BODY_BYTES = 32 * 1024;

export interface ContactEnv {
  TURNSTILE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function handleContact(
  request: Request,
  env: ContactEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  const { TURNSTILE_SECRET_KEY: secret, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = env;
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (!secret || !serviceKey || !supabaseUrl) {
    console.error(
      '[contact] missing TURNSTILE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL',
    );
    return json({ error: 'config' }, 503);
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return json({ error: 'size' }, 413);
  let form: FormData;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: 'size' }, 413);
    form = new FormData();
    for (const [k, v] of new URLSearchParams(text)) form.set(k, v);
  } catch {
    return json({ error: 'body' }, 400);
  }

  // Honeypot: answer like a success so bots learn nothing; nothing is stored.
  if (form.get('website')) return json({ ok: true }, 200);

  const validation = validateContactForm(form, en.contact.validation);
  if (!validation.success) return json({ error: 'invalid', fields: validation.error }, 400);

  const token = form.get('cf-turnstile-response');
  if (typeof token !== 'string' || !token || token.length > 2048) {
    return json({ error: 'captcha' }, 403);
  }
  const verifyBody = new URLSearchParams({ secret, response: token });
  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for');
  if (ip) verifyBody.set('remoteip', ip.split(',')[0]!.trim());
  try {
    const res = await fetchImpl(SITEVERIFY, { method: 'POST', body: verifyBody });
    const outcome = (await res.json()) as { success?: boolean };
    if (!outcome.success) return json({ error: 'captcha' }, 403);
  } catch (error) {
    console.error('[contact] siteverify', error);
    return json({ error: 'captcha' }, 502);
  }

  const insert = await fetchImpl(new URL('/rest/v1/messages', supabaseUrl), {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(validation.data),
  }).catch((error: unknown) => {
    console.error('[contact] insert', error);
    return null;
  });
  if (!insert?.ok) {
    if (insert) console.error('[contact] insert', insert.status, await insert.text());
    return json({ error: 'insert' }, 502);
  }
  return json({ ok: true }, 200);
}

export function POST(request: Request): Promise<Response> {
  return handleContact(request, process.env);
}
