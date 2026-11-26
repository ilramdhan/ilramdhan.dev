import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll text fill (mutugading `scroll-fill.tsx`): a statement whose words go from 82% to full ink, left to right, as it
 * crosses the screen (CSS `view-timeline`, scrubbed, no pin, no JS). One per page. Opacity only; the start state keeps
 * AA contrast. No `animation-timeline` support or reduced motion = the plain statement in full ink.
 */
export function ScrollFill({
  text,
  as: Tag = 'p',
  className,
}: {
  text: string;
  as?: 'p' | 'span';
  className?: string;
}) {
  const words = text.trim().split(/\s+/);
  const last = Math.max(words.length - 1, 1);
  return (
    <Tag data-scroll-fill="" className={cn(Tag === 'span' && 'block', className)}>
      {words.map((w, i) => (
        <span key={i} data-w="" style={{ '--p': (i / last).toFixed(3) } as CSSProperties}>
          {w}
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
