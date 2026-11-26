import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** 12px fine print in the tile's muted colour (#6E6E73 on light: AA on white and parchment). */
export function FinePrint({
  children,
  as: Tag = 'p',
  className,
}: {
  children: ReactNode;
  as?: 'p' | 'small' | 'div';
  className?: string;
}) {
  return <Tag className={cn('block text-fine text-tile-muted', className)}>{children}</Tag>;
}
