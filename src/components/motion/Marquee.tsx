import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motionOk, whenNear } from './near';
import { useLenis } from './SmoothScrollProvider';

const COPIES = [1, 2, 3] as const;

export type MarqueeProps = {
  /** Plain text items (e.g. certificate or tool names). */
  items: string[];
  /** Accessible name of the list region. */
  label: string;
  /** Labels of the visitor's pause / play control (WCAG 2.2.2: anything moving for over 5 s can be paused). */
  pauseLabel: string;
  playLabel: string;
  /** Base speed in px/s. */
  speed?: number;
  /** Max skew (deg) from scroll velocity; 0 = none. */
  maxSkew?: number;
  /** 1 = right→left, -1 = left→right. */
  direction?: 1 | -1;
  className?: string;
  itemClassName?: string;
  /** Render an item as something other than its text (e.g. an icon); `items` stay the names/keys. */
  renderItem?: (item: string) => ReactNode;
};

/**
 * Plain-text marquee (mutugading `marquee.tsx`): one line of names drifting sideways, a little faster while the page
 * scrolls. The loop engine is imported when the strip nears the viewport. Pauses on hover and keyboard focus, and holds
 * still after the visitor's own Pause (a 44px control under the line, shown only while the loop runs). The first list
 * carries every name for assistive tech; the loop copies are aria-hidden + inert. Reduced motion and no JS: one static,
 * wrapped, centred line with no copies and no control.
 */
export function Marquee({
  items,
  label,
  pauseLabel,
  playLabel,
  speed = 32,
  maxSkew = 3,
  direction = 1,
  className,
  itemClassName,
  renderItem,
}: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState(false);
  const { velocity } = useLenis();

  useEffect(() => {
    const el = ref.current;
    if (!el || items.length === 0 || !motionOk()) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const stop = whenNear(
      el,
      () => {
        import('./marquee-engine')
          .then(({ startMarquee }) => {
            if (!cancelled) cleanup = startMarquee(el, { speed, maxSkew, velocity });
          })
          .catch(() => {
            /* static line */
          });
      },
      '25% 0px',
    );
    return () => {
      cancelled = true;
      stop();
      cleanup?.();
    };
  }, [items.length, speed, maxSkew, velocity]);

  if (items.length === 0) return null;
  const li = cn('shrink-0 px-5 whitespace-nowrap sm:px-8', itemClassName);
  return (
    <div className="group/mq w-full">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        data-marquee=""
        data-held={held ? 'true' : undefined}
        className={cn('relative w-full overflow-hidden', className)}
      >
        <div data-skew="" className="will-change-transform motion-reduce:will-change-auto">
          <div data-track="" data-dir={direction} className="flex w-max flex-nowrap">
            <ul className="flex shrink-0 flex-nowrap items-center">
              {items.map((item) => (
                <li key={item} className={li}>
                  {renderItem?.(item) ?? item}
                </li>
              ))}
            </ul>
            {COPIES.map((c) => (
              <ul
                key={c}
                aria-hidden="true"
                inert
                data-marquee-copy=""
                className="flex shrink-0 flex-nowrap items-center"
              >
                {items.map((item) => (
                  <li key={item} className={li}>
                    {renderItem?.(item) ?? item}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      {/* Outside the region, so focusing it is not the hover/focus pause. Hidden until the loop runs. */}
      <div className="mt-3 hidden justify-end group-has-[[data-animated=true]]/mq:flex">
        <button
          type="button"
          onClick={() => setHeld((h) => !h)}
          aria-label={held ? playLabel : pauseLabel}
          data-marquee-toggle=""
          className="inline-flex size-11 items-center justify-center rounded-full text-tile-muted transition-colors duration-200 hover:text-tile-ink"
        >
          {held ? <PlayGlyph /> : <PauseGlyph />}
        </button>
      </div>
    </div>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="size-3.5 fill-current">
      <rect x="2.5" y="1.5" width="3" height="11" rx="1" />
      <rect x="8.5" y="1.5" width="3" height="11" rx="1" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="size-3.5 fill-current">
      <path d="M3.5 1.9v10.2c0 .6.7 1 1.2.7l8-5.1c.5-.3.5-1.1 0-1.4l-8-5.1c-.5-.3-1.2.1-1.2.7Z" />
    </svg>
  );
}
