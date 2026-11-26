import { useEffect, useRef, type ReactNode } from 'react';
import { motionOk, whenNear } from './near';

/**
 * The moving half of MediaFrame `parallax` (mutugading `parallax-layer.tsx`): an oversized layer (±amount% + 2) whose
 * yPercent is scrubbed by `parallax-engine.ts`, imported when the frame nears the viewport. Static markup (CLS 0);
 * reduced motion keeps it still and never loads the engine.
 */
export function ParallaxLayer({ amount, children }: { amount: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = ref.current;
    const frame = inner?.parentElement;
    if (!inner || !frame || !motionOk()) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const stop = whenNear(frame, () => {
      import('./parallax-engine')
        .then(({ attachParallax }) => {
          if (!cancelled) cleanup = attachParallax(frame, inner, amount);
        })
        .catch(() => {
          /* still image */
        });
    });
    return () => {
      cancelled = true;
      stop();
      cleanup?.();
    };
  }, [amount]);

  const pad = `${amount + 2}%`;
  return (
    <div
      ref={ref}
      data-parallax={amount}
      className="absolute inset-x-0"
      style={{ top: `-${pad}`, bottom: `-${pad}` }}
    >
      {children}
    </div>
  );
}
