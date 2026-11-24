import { useEffect, useRef, useState } from 'react';
import { motionOk } from './near';

/**
 * Count-up figure (mutugading `count-up.tsx`) for SpecRow. The final value is always in the DOM (sr-only, also in the
 * prerendered HTML); the animated layer is aria-hidden, prints the final value until it runs, and counts once when
 * 40% visible (ease-out quart, 1.6s). Reduced motion: no animation.
 * ponytail: prints `String(value)` (same as the static SpecRow); pass a locale-formatted `node` when grouping matters.
 */
export function CountUpValue({ value, duration = 1600 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState<number | null>(null);
  const decimals = (String(value).split('.')[1] ?? '').length;

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOk() || typeof IntersectionObserver === 'undefined') return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        el.dataset.counting = '';
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          setN(value * (1 - Math.pow(1 - t, 4)));
          if (t < 1) raf = requestAnimationFrame(tick);
          else {
            setN(null);
            delete el.dataset.counting;
            el.dataset.counted = '';
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <>
      <span className="sr-only">{String(value)}</span>
      <span ref={ref} aria-hidden="true">
        {n === null ? String(value) : n.toFixed(decimals)}
      </span>
    </>
  );
}
