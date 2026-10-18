import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'framer-motion';
import { duration, ease } from './tokens';

const loadFeatures = () => import('./features').then((mod) => mod.default);

/**
 * `MotionConfig` with the shared tokens and `reducedMotion="user"` plus a strict `LazyMotion` (domAnimation loaded async); descendants use `m.*`. Mounted by the
 * routes that animate (home, admin) instead of at the app root, so routes that never
 * animate (privacy, blog, ...) don't download framer-motion for it (size budgets).
 */
export function MotionScope({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: duration.base, ease: [...ease] }}>
      <LazyMotion strict features={loadFeatures}>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
