import { afterEach, describe, expect, it, vi } from 'vitest';

// `lib/env.ts` validates `import.meta.env` once at import time, so every case
// stubs the variables and re-imports a fresh copy of the module.
async function loadEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value);
  vi.resetModules();
  return import('./env');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('lib/env', () => {
  it('accepts a valid Supabase URL and anon key', async () => {
    const { env, envErrors } = await loadEnv({
      VITE_SUPABASE_URL: 'https://mock.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'dummy',
    });
    expect(envErrors).toEqual([]);
    expect(env).toEqual({
      VITE_SUPABASE_URL: 'https://mock.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'dummy',
    });
  });

  it('reports missing variables', async () => {
    const { env, envErrors } = await loadEnv({
      VITE_SUPABASE_URL: undefined,
      VITE_SUPABASE_ANON_KEY: undefined,
    });
    expect(env).toBeNull();
    expect(envErrors).toEqual([
      'VITE_SUPABASE_URL is missing',
      'VITE_SUPABASE_ANON_KEY is missing',
    ]);
  });

  it('rejects a non-URL Supabase URL and a blank anon key', async () => {
    const { env, envErrors } = await loadEnv({
      VITE_SUPABASE_URL: 'your-project-ref',
      VITE_SUPABASE_ANON_KEY: '   ',
    });
    expect(env).toBeNull();
    expect(envErrors).toHaveLength(2);
    expect(envErrors[0]).toMatch(/^VITE_SUPABASE_URL must be a valid URL/);
    expect(envErrors[1]).toBe('VITE_SUPABASE_ANON_KEY is missing');
  });
});
