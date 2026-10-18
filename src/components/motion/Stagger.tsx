import type { ReactNode } from 'react';
import { m, type Variants } from 'framer-motion';
import { useIsPrerendered, useReducedMotion } from '@/lib/hooks';
import { distance, duration, ease, stagger, viewport } from './tokens';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: stagger.step } },
};
const item: Variants = {
  hidden: { opacity: 0, y: distance },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease } },
};

/** Parent of `StaggerItem`s: reveals them one after another, once, on entering the viewport. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const prerendered = useIsPrerendered();
  if (reduced || prerendered) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const prerendered = useIsPrerendered();
  if (reduced || prerendered) return <div className={className}>{children}</div>;
  return (
    <m.div className={className} variants={item}>
      {children}
    </m.div>
  );
}
