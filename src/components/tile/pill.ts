import { cn } from '@/lib/utils';

/** Classes for the filled pill, shared by PillButton, ActionLink and any <button> that should look like one. */
export function pillClass(size: 'sm' | 'md' = 'md') {
  return cn(
    'inline-flex min-h-11 items-center justify-center rounded-full bg-tile-pill text-tile-pill-ink transition-[background-color,scale] duration-200 ease-apple hover:bg-tile-pill-hover active:scale-[0.98] motion-reduce:transition-none',
    size === 'md' ? 'px-[22px] py-[11px] text-body' : 'px-3.5 text-fine',
  );
}
