import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { LinkChevron } from './LinkChevron';
import { pillClass } from './pill';

export type PillButtonProps = {
  /** In-app path. */
  href: string;
  children: ReactNode;
  /** primary = filled pill; secondary = text link with chevron (Apple's second CTA). */
  variant?: 'primary' | 'secondary';
  /** Force the dark-tile treatment outside a dark Tile (inside one it applies automatically). */
  onDark?: boolean;
  /** sm = 12px nav pill (still a 44px target), md = 17px body pill. */
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Primary pill: tile-aware fill (cobalt + white on light, logo blue + ink on dark: both AA). 44px minimum target.
 * Quiet feedback only: the fill steps to its hover shade, a press scales to 0.98.
 */
export function PillButton({
  href,
  children,
  variant = 'primary',
  onDark,
  size = 'md',
  className,
}: PillButtonProps) {
  if (variant === 'secondary') {
    return (
      <LinkChevron href={href} className={className}>
        {children}
      </LinkChevron>
    );
  }
  return (
    <Link
      to={href}
      data-tone={onDark ? 'dark' : undefined}
      className={cn(pillClass(size), className)}
    >
      {children}
    </Link>
  );
}
