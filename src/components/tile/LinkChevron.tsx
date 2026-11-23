import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

/** The Apple "›" glyph, drawn (never a unicode character). Nudges 2px right when its link group is hovered. */
export function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        'h-3 w-[7px] flex-none transition-transform duration-200 ease-apple group-hover/link:translate-x-0.5 motion-reduce:transition-none',
        className,
      )}
    >
      <path d="M1.5 1.5 6.5 7l-5 5.5" />
    </svg>
  );
}

export const linkChevronClass =
  'group/link inline-flex min-h-11 items-center gap-1.5 text-body text-tile-action decoration-1 underline-offset-4 transition-[color,scale] duration-200 ease-apple hover:text-tile-action-hover hover:underline active:scale-[0.98] motion-reduce:transition-none';

export type LinkChevronProps = {
  /** In-app path. Omit to render a non-interactive span (e.g. inside an already-linked group). */
  href?: string;
  children: ReactNode;
  className?: string;
};

/** "Learn more ›" text link in the tile's action colour (cobalt on light, logo blue on dark tiles). */
export function LinkChevron({ href, children, className }: LinkChevronProps) {
  const content = (
    <>
      {children}
      <Chevron />
    </>
  );
  if (!href) return <span className={cn(linkChevronClass, className)}>{content}</span>;
  return (
    <Link to={href} className={cn(linkChevronClass, className)}>
      {content}
    </Link>
  );
}
