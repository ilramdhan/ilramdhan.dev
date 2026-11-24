import { ViewTransition, type ReactNode } from 'react';
import { useLocation } from 'react-router';

/**
 * Soft cross-fade between pages (mutugading `route-fade.tsx`, React <ViewTransition>). Keyed by pathname, so a page
 * change is an exit + enter pair (old page out in 160ms, new page in 260ms after a short beat; `.vt-page-out` /
 * `.vt-page-in` in global.css). Search-param updates keep the key and do not animate. Named <Morph> pairs inside morph
 * instead of fading. Nav and footer sit outside the boundary. BrowserRouter wraps navigations in startTransition, which
 * is what lets React run them as view transitions. No View Transitions API, or reduced motion: an instant swap.
 */
export function RouteFade({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <ViewTransition key={pathname} enter="vt-page-in" exit="vt-page-out" default="none">
      {children}
    </ViewTransition>
  );
}
