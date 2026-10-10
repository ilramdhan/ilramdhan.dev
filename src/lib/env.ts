/**
 * Runtime validation of the public (VITE_*) environment variables.
 *
 * Vite inlines these at build time. A missing/invalid value does NOT fail
 * `vite build` (Vercel injects them during its own build); instead the app
 * renders a readable configuration error screen (see `index.tsx`) rather than
 * crashing into a blank page.
 */
export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Hand-rolled instead of zod: this module is in the entry chunk of every route, and
// zod (~13 KB gzip) is otherwise only needed by forms that load lazily (T-24).
function isHttpUrl(value: string): boolean {
  try {
    return Boolean(new URL(value).protocol);
  } catch {
    return false;
  }
}

function validate(raw: Record<keyof Env, unknown>): { data: Env | null; errors: string[] } {
  const errors: string[] = [];
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const url = text(raw.VITE_SUPABASE_URL);
  const key = text(raw.VITE_SUPABASE_ANON_KEY);
  if (!url) errors.push('VITE_SUPABASE_URL is missing');
  else if (!isHttpUrl(url)) {
    errors.push(
      'VITE_SUPABASE_URL must be a valid URL (e.g. https://your-project-ref.supabase.co)',
    );
  }
  if (!key) errors.push('VITE_SUPABASE_ANON_KEY is missing');
  return {
    data: errors.length ? null : { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key },
    errors,
  };
}

const parsed = validate({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as unknown,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as unknown,
});

/** Human-readable problems, one per invalid variable; empty when the env is valid. */
export const envErrors: string[] = parsed.errors;

/** Validated env, or `null` when invalid (the app shows the error screen instead). */
export const env: Env | null = parsed.data;
