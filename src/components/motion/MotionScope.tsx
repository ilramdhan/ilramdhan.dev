import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { duration, ease } from './tokens';

/**
 * `MotionConfig` with the shared tokens and `reducedMotion="user"`. Mounted by the
 * routes that animate (home, admin) instead of at the app root, so routes that never
 * animate (privacy, blog, ...) don't download framer-motion for it (size budgets).
 */
export function MotionScope({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: duration.base, ease: [...ease] }}>
      {children}
    </MotionConfig>
  );
}
