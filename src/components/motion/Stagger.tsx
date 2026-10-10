import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
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
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
