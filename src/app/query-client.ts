import { QueryClient } from '@tanstack/react-query';
import { shouldRetry } from '@/lib/errors';

/**
 * App-wide React Query defaults (T-15). Portfolio content changes rarely, so data stays
 * fresh for 5 minutes: the profile shared by Navbar, Hero, Footer and the pages is
 * fetched once per page load instead of on every mount and window focus.
 */
export const QUERY_DEFAULTS = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
  // One retry for network/5xx errors, none for 4xx (a missing slug stays missing).
  retry: shouldRetry,
} as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: QUERY_DEFAULTS,
      mutations: { retry: false },
    },
  });
}
