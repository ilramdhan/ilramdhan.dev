// Shared server half of the public forms (contact, blog comments) behind Cloudflare Turnstile (D10).
// Order: size cap → honeypot → validate → Turnstile siteverify → insert with the service-role key
// (PostgREST over fetch: no client library in the function bundle). The anon key can't insert into
// these tables (RLS), so this is the only way in.
// Relative imports only in files the api/ functions pull in: Vercel bundles them without tsconfig paths.

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Largest form (contact: 100 + 320 + 5000 multi-byte chars), token ~2 KB, plus form encoding. */
const MAX_BODY_BYTES = 32 * 1024;

export interface VerifyEnv {
  TURNSTILE_SECRET_KEY?: string;
  /** Comma-separated production hostnames the token must come from (unset = any; Cloudflare also binds the widget). */
  TURNSTILE_HOSTNAMES?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
}

export interface VerifiedForm {
  /** Must match the `action` the widget renders with (src/features/messages/Turnstile.tsx). */
  action: string;
  table: string;
  /** The row to insert, or field errors (400). */
  validate: (
    form: FormData,
  ) =>
    | { success: true; data: object }
    | { success: false; error: Record<string, string[] | undefined> };
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function handleVerifiedInsert(
  spec: VerifiedForm,
  request: Request,
  env: VerifyEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const tag = `[${spec.action}]`;
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  const { TURNSTILE_SECRET_KEY: secret, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = env;
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (!secret || !serviceKey || !supabaseUrl) {
    console.error(
      tag,
      'missing TURNSTILE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL',
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

  const validation = spec.validate(form);
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
    const outcome = (await res.json()) as { success?: boolean; action?: string; hostname?: string };
    const hosts = env.TURNSTILE_HOSTNAMES?.split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    // Reject a token minted for another widget action or another site (Cloudflare's server-side checklist).
    if (
      !outcome.success ||
      outcome.action !== spec.action ||
      (hosts?.length && !hosts.includes(outcome.hostname ?? ''))
    ) {
      return json({ error: 'captcha' }, 403);
    }
  } catch (error) {
    console.error(tag, 'siteverify', error);
    return json({ error: 'captcha' }, 502);
  }

  const insert = await fetchImpl(new URL(`/rest/v1/${spec.table}`, supabaseUrl), {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(validation.data),
  }).catch((error: unknown) => {
    console.error(tag, 'insert', error);
    return null;
  });
  if (!insert?.ok) {
    if (insert) console.error(tag, 'insert', insert.status, await insert.text());
    return json({ error: 'insert' }, 502);
  }
  return json({ ok: true }, 200);
}
