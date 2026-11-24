import { Outlet } from 'react-router';
import { RouteFade } from './RouteFade';

/**
 * Pathless layout route for the public pages: the route cross-fade around the page outlet. The layout chrome
 * (footer, toaster) sits outside it, so it never fades.
 */
export default function MotionOutlet() {
  return (
    <RouteFade>
      <Outlet />
    </RouteFade>
  );
}
