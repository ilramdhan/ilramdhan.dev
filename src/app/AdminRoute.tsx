import { useEffect, useRef, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { useIsAdmin } from '@/lib/useIsAdmin';
import { useAuth } from './auth';

export const NOT_ADMIN_MESSAGE = 'This account is not allowed to access the dashboard.';

/**
 * Guards admin-only routes (T-08): anonymous visitors go to /login; signed-in users
 * who are not in the admin allowlist are signed out and sent home with a toast.
 * The database enforces the same rule through RLS; this is the UI half.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { isAdmin, isDenied, isLoading, isError, retry } = useIsAdmin();

  const signedOut = useRef(false);

  useEffect(() => {
    if (!isDenied || signedOut.current) return;
    signedOut.current = true;
    toast.error(NOT_ADMIN_MESSAGE);
    void logout();
  }, [isDenied, logout]);

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (isDenied) return <Navigate to="/" replace />;
  if (isError || !isAdmin) {
    return (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-700 dark:text-slate-300"
      >
        <p>Couldn&apos;t verify admin access.</p>
        <button
          type="button"
          onClick={retry}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
