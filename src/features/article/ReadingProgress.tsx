import { useEffect, useRef, type RefObject } from 'react';

/**
 * Thin bar at the very top showing how much of `target` has been scrolled past. Purely
 * visual (aria-hidden). Rendered at 0 on the server; updated from scroll events after
 * mount by writing the transform directly (no re-render per frame). The width change is
 * never animated, so it also suits reduced motion.
 */
export function ReadingProgress({ target }: { target: RefObject<HTMLElement> }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = target.current;
      if (!el || !bar.current) return;
      const { top, height } = el.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -top / scrollable)) : 1;
      bar.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [target]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-50 h-1.5 w-full">
      <div
        ref={bar}
        data-testid="reading-progress"
        className="h-full origin-left bg-indigo-500"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
