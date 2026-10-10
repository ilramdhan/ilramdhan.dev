import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';
import { env, envErrors } from '@/lib/env';

// Env vars are validated in `lib/env.ts` (see `.env.example`). When they are
// missing, a placeholder keeps `createClient` from throwing at import time;
// `index.tsx` renders a configuration error screen instead of the app, so the
// placeholder client is never used for real requests.
if (envErrors.length > 0) {
  console.error(`Invalid environment configuration:\n- ${envErrors.join('\n- ')}`);
}

export const supabase = createClient<Database>(
  env?.VITE_SUPABASE_URL ?? 'http://localhost.invalid',
  env?.VITE_SUPABASE_ANON_KEY ?? 'missing-anon-key',
);
