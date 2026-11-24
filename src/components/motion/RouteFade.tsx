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
  // Prerender: no enter/exit classes. Inside a Suspense boundary Fizz would otherwise outline the page to animate
  // its reveal, emitting inline `$RV` scripts the CSP blocks. A ViewTransition renders no DOM, so the client may
  // carry the classes without a hydration mismatch; they only act on later (transition) navigations.
  const ssr = import.meta.env.SSR;
  return (
    <ViewTransition
      key={pathname}
      enter={ssr ? 'none' : 'vt-page-in'}
      exit={ssr ? 'none' : 'vt-page-out'}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
