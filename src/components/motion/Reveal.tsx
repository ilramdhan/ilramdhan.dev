import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useIsPrerendered, useReducedMotion } from '@/lib/hooks';
import { distance, duration, ease, staggerDelay, viewport } from './tokens';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Position in a group; drives a capped stagger delay. */
  index?: number;
  /** Slide in from the side instead of rising. */
  from?: 'bottom' | 'left';
  onClick?: () => void;
}

/**
 * Fade-up entrance, played once when the element first scrolls into view.
 * Under `prefers-reduced-motion`, and for prerendered content (already on screen, T-35),
 * it renders a plain element: no transform, no animation.
 */
export function Reveal({ children, className, index = 0, from = 'bottom', onClick }: RevealProps) {
  const reduced = useReducedMotion();
  const prerendered = useIsPrerendered();
  if (reduced || prerendered) {
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- TODO(#57) card click mirrors the previous markup
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }
  const offset = from === 'left' ? { x: -distance } : { y: distance };
  return (
    <motion.div
      className={className}
      onClick={onClick}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={viewport}
      transition={{ duration: duration.base, ease, delay: staggerDelay(index) }}
    >
      {children}
    </motion.div>
  );
}
