import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SegmentedOption<V extends string> = { value: V; label: ReactNode };

/**
 * Apple segmented control (mutugading UnitToggle, generalised to n segments): a parchment track with a thumb that
 * slides to the chosen segment on transform (250ms; instant under reduced motion). Real buttons with aria-pressed,
 * 44px tall, so Tab reaches each segment and Enter/Space picks it. The track is parchment, never frame grey (the muted
 * labels fail AA on grey). Never wraps: it scrolls sideways inside its own box with a fade on the clipped edge(s), and
 * the arrow keys move focus between segments (Tab still reaches each one).
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
  const scroller = useRef<HTMLDivElement>(null);

  // Fade only the edge that has more content behind it.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const fade = () => {
      const max = el.scrollWidth - el.clientWidth;
      el.style.setProperty('--fl', el.scrollLeft > 1 ? '1.5rem' : '0px');
      el.style.setProperty('--fr', max - el.scrollLeft > 1 ? '1.5rem' : '0px');
    };
    fade();
    el.addEventListener('scroll', fade, { passive: true });
    window.addEventListener('resize', fade);
    return () => {
      el.removeEventListener('scroll', fade);
      window.removeEventListener('resize', fade);
    };
  }, [n]);

  // Keep the chosen segment in view (a tag from the URL can sit off-screen).
  useEffect(() => {
    const el = scroller.current;
    const on = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !on) return;
    el.scrollLeft = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2;
  }, [value]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -n, End: n };
    const step = keys[e.key];
    if (!step) return;
    const btns = [...e.currentTarget.parentElement!.querySelectorAll('button')];
    const at = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    const to = Math.abs(step) === n ? (step > 0 ? n - 1 : 0) : (at + step + n) % n;
    btns[to]?.focus();
  };

  return (
    <div
      ref={scroller}
      className="max-w-full overflow-x-auto overscroll-x-contain rounded-full [scrollbar-width:none] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_var(--fl,0px),#000_calc(100%-var(--fr,0px)),transparent)] [mask-image:linear-gradient(to_right,transparent,#000_var(--fl,0px),#000_calc(100%-var(--fr,0px)),transparent)] [&::-webkit-scrollbar]:hidden"
    >
      <div
        role="group"
        aria-label={label}
        data-segmented=""
        className={cn('relative inline-grid w-max rounded-full bg-parchment p-1', className)}
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
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
              onKeyDown={onKeyDown}
              className={cn(
                'relative min-h-11 min-w-[5rem] rounded-full px-4 text-caption whitespace-nowrap transition-[color] duration-200',
                on ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
