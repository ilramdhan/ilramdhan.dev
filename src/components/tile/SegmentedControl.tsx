import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SegmentedOption<V extends string> = { value: V; label: ReactNode };

/**
 * Apple segmented control (mutugading UnitToggle, generalised to n segments): a parchment track with a thumb that
 * slides to the chosen segment on transform (250ms; instant under reduced motion). Real buttons with aria-pressed,
 * 44px tall, so Tab reaches each segment and Enter/Space picks it. The track is parchment, never frame grey (the muted
 * labels fail AA on grey).
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Accessible name of the group (from the caller's messages). */
  label: string;
  className?: string;
}) {
  const n = options.length;
  const i = options.findIndex((o) => o.value === value);
  return (
    <div
      role="group"
      aria-label={label}
      data-segmented=""
      className={cn('relative inline-grid rounded-full bg-parchment p-1', className)}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      {i >= 0 ? (
        <span
          aria-hidden="true"
          data-segmented-thumb=""
          className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/var(--n))] rounded-full bg-thumb transition-transform duration-[250ms] ease-apple motion-reduce:transition-none"
          style={{ '--n': n, transform: `translateX(${i * 100}%)` } as CSSProperties}
        />
      ) : null}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative min-h-11 min-w-[5.5rem] rounded-full px-4 text-caption whitespace-nowrap transition-[color] duration-200',
              on ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
