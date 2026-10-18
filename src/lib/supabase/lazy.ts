import type { supabase } from './client';

export type SupabaseClient = typeof supabase;

let client: Promise<SupabaseClient> | undefined;

/**
 * The Supabase client, loaded on first use (T-58). `@supabase/supabase-js` is ~57 KiB gzip
 * and prerendered pages already embed their data (T-35), so public routes no longer ship
 * it up front: the chunk is fetched when a query, mutation or the auth session first
 * needs it. The import is cached, so every caller shares one client.
 */
export function getSupabase(): Promise<SupabaseClient> {
  return (client ??= import('./client').then((m) => m.supabase));
}
