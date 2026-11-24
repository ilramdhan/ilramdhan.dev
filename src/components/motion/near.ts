/**
 * Runs `load` once, when `el` comes within `margin` of the viewport (the engines' lazy-import trigger). Returns a
 * cleanup. No IntersectionObserver (old browsers, jsdom) = never loads: the static markup stays, fully visible.
 */
export function whenNear(el: Element, load: () => void, margin = '50% 0px'): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      load();
    },
    { rootMargin: margin },
  );
  io.observe(el);
  return () => io.disconnect();
}

export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

/** True when the visitor allows motion (false on the server and without matchMedia). */
export function motionOk(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.(MOTION_OK).matches;
}
