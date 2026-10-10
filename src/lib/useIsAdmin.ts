import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { isMissingFunctionError } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';

// Re-exported: the RPC fallback below and its tests use the shared helper.
export { isMissingFunctionError };

/**
 * Asks the database whether the signed-in user is in `public.admin_users` (T-08).
 *
 * Backward compatible: while the migration isn't applied, every signed-in user is
 * treated as admin (the previous behaviour, safe because sign-ups are disabled) and a
 * warning is logged. Once the function exists its answer is enforced. Any other
 * error is thrown so callers can show a retry instead of guessing.
 */
export async function fetchIsAdmin(): Promise<boolean> {
  const { data, error, status } = await supabase.rpc('is_admin');
  if (error) {
    if (isMissingFunctionError(error, status)) {
      console.warn(
        '[auth] public.is_admin() not found: apply supabase/migrations/20261010100000_admin_allowlist.sql. ' +
          'Falling back to "any signed-in user is admin".',
      );
      return true;
    }
    throw new Error(error.message ?? 'Could not verify admin access');
  }
  return data === true;
}

export interface IsAdminState {
  /** The current user is a confirmed admin. */
  isAdmin: boolean;
  /** The server answered and the current (signed-in) user is NOT an admin. */
  isDenied: boolean;
  /** Auth or the admin check is still loading. */
  isLoading: boolean;
  /** The admin check failed (network, server error); `retry` re-runs it. */
  isError: boolean;
  retry: () => void;
}

export function useIsAdmin(): IsAdminState {
  const { user, isLoading: authLoading } = useAuth();
  const query = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: fetchIsAdmin,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    isAdmin: !!user && query.data === true,
    isDenied: !!user && query.data === false,
    isLoading: authLoading || (!!user && query.isPending),
    isError: !!user && query.isError,
    retry: () => void query.refetch(),
  };
}
