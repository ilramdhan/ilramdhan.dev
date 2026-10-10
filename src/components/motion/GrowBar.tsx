import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/** True once the element has been at least 30% visible; never flips back (animate once). */
function useSeenOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

/** Progress bar that grows from 0 to `percent` (transform only) when first scrolled into view. */
export function GrowBar({ percent, className }: { percent: number; className?: string }) {
  const reduced = useReducedMotion();
  const { ref, seen } = useSeenOnce<HTMLDivElement>();
  const show = reduced || seen;
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden ${className ?? ''}`}
    >
      <div
        className="h-full w-full origin-left rounded-full bg-indigo-600 motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-out"
        style={{ transform: `scaleX(${show ? Math.min(Math.max(percent, 0), 100) / 100 : 0})` }}
      />
    </div>
  );
}

/** Number that counts up to `value` when first scrolled into view (static under reduced motion). */
export function CountUp({
  value,
  decimals = 0,
  suffix = '',
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, seen } = useSeenOnce<HTMLSpanElement>();
  const [current, setCurrent] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setCurrent(value);
      return;
    }
    if (!seen) return;
    const start = performance.now();
    const total = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / total, 1);
      setCurrent(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}
