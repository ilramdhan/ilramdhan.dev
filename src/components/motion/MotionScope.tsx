import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, type FeatureBundle } from 'framer-motion';
import { duration, ease } from './tokens';

const loadFeatures = () => import('./features').then((mod) => mod.default);

/**
 * `MotionConfig` with the shared tokens and `reducedMotion="user"` plus a strict `LazyMotion`;
 * descendants use `m.*`, which render nothing visible without one (they keep their initial
 * `opacity: 0`). Mounted by every route that animates (home, about, certificates, projects,
 * admin) instead of at the app root, so routes that never animate (privacy, blog, ...) don't
 * download framer-motion for it (size budgets). `domAnimation` loads async unless the route
 * passes `features` (see `./features`).
 */
export function MotionScope({
  children,
  features = loadFeatures,
}: {
  children: ReactNode;
  features?: FeatureBundle | (() => Promise<FeatureBundle>);
}) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: duration.base, ease: [...ease] }}>
      <LazyMotion strict features={features}>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
