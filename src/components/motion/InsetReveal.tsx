import { useEffect, useRef } from 'react';
import { motionOk } from './near';

/**
 * The moving half of MediaFrame `reveal` (mutugading `inset-reveal.tsx`): a zero-size leaf that arms its parent frame
 * (`data-inset="armed"` = a slightly inset clip) only when the frame starts below the fold, then opens it once when 15%
 * of it is in view (CSS transition in global.css). Frames already on screen, no JS and reduced motion are never
 * armed, so nothing is ever hidden. No GSAP.
 */
export function InsetReveal() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const frame = ref.current?.parentElement;
    if (!frame || !motionOk() || typeof IntersectionObserver === 'undefined') return;
    if (frame.getBoundingClientRect().top < window.innerHeight) return;
    frame.dataset.inset = 'armed';
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        frame.dataset.inset = 'open';
      },
      { threshold: 0.15 },
    );
    io.observe(frame);
    return () => io.disconnect();
  }, []);
  return <span ref={ref} hidden />;
}
