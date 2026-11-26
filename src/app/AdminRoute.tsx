import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  const { user, isLoading: authLoading, logout, loggedOut } = useAuth();
  const { isAdmin, isDenied, isLoading, isError, retry } = useIsAdmin();

  const signedOut = useRef(false);
  // Denied stays denied: signing out clears `user` while the redirect home may still be a pending (view)
  // transition, and that re-render must not fall through to the anonymous branch (/login). Latched during render.
  const [denied, setDenied] = useState(false);
  if (isDenied && !denied) setDenied(true);

  useEffect(() => {
    if (!isDenied || signedOut.current) return;
    signedOut.current = true;
    toast.error(NOT_ADMIN_MESSAGE);
    void logout();
  }, [isDenied, logout]);

  if (isDenied || denied) return <Navigate to="/" replace />;
  if (authLoading || isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-svh items-center justify-center text-body text-ink-muted"
      >
        Loading...
      </div>
    );
  }
  // A deliberate logout lands on the home page (F12 B1); any other missing session goes to the login.
  if (!user) return <Navigate to={loggedOut ? '/' : '/login'} replace />;
  if (isError || !isAdmin) {
    return (
      <div
        role="alert"
        className="flex min-h-svh flex-col items-center justify-center gap-4 text-body text-ink"
      >
        <p>Couldn&apos;t verify admin access.</p>
        <button
          type="button"
          onClick={retry}
          className="inline-flex min-h-11 items-center rounded-full bg-tile-pill px-[22px] text-body text-tile-pill-ink transition-colors hover:bg-tile-pill-hover"
        >
          Try again
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
