import { useEffect, type RefObject } from 'react';
import { motionOk, whenNear } from './near';

/**
 * TileHeading `reveal` (mutugading `split-text-reveal.tsx`): when the heading nears the viewport, the SplitText engine
 * is imported and plays a masked word rise once. The prerendered heading is plain text until then (and forever under
 * reduced motion, without JS or if the chunk fails), so nothing is ever hidden.
 */
export function useSplitReveal(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  text: unknown,
) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || !motionOk()) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const stop = whenNear(el, () => {
      import('./split-text-engine')
        .then(({ reveal }) => {
          if (!cancelled) cleanup = reveal(el);
        })
        .catch(() => {
          /* the plain heading stays */
        });
    });
    return () => {
      cancelled = true;
      stop();
      cleanup?.();
    };
  }, [ref, enabled, text]);
}
