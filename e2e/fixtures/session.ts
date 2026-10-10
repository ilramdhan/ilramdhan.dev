import type { Page } from '@playwright/test';
import { MOCK_SUPABASE_URL } from './supabase-mock';

/** localStorage key supabase-js uses for the session of `MOCK_SUPABASE_URL`. */
export const AUTH_STORAGE_KEY = `sb-${new URL(MOCK_SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

/**
 * Boots the app with a signed-in (fake) GitHub session. Whether the user is an admin is
 * decided by the mocked `is_admin` RPC (`supabase.rpc.is_admin`), like in production.
 */
export async function signIn(page: Page, email = 'someone@example.test') {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token: 'e2e-access-token',
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user: {
      id: '00000000-0000-4000-8000-0000000000e2',
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { provider: 'github' },
      user_metadata: {},
      created_at: '2026-01-01T00:00:00Z',
    },
  };
  // Only seed once: the app may sign the user out, and a reload must not undo that.
  await page.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem('e2e-session-seeded')) return;
      sessionStorage.setItem('e2e-session-seeded', '1');
      localStorage.setItem(key, value);
    },
    [AUTH_STORAGE_KEY, JSON.stringify(session)] as const,
  );
}
