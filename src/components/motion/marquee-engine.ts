/**
 * Lazily loaded loop behind <Marquee> (mutugading `marquee-engine.ts`): base speed plus a small scroll-velocity
 * boost and skew, wrapped at one copy width, paused while off screen, on hover and on keyboard focus. Sets
 * `data-animated` on the root while running; a visitor's Pause (WCAG 2.2.2) sets `data-held` and the loop rests.
 * Until then (no JS, reduced motion, chunk failure) the markup is one static, wrapped, centred line.
 */
import { gsap, MOTION_OK_QUERY } from './gsap';

export type MarqueeEngineOptions = {
  speed: number;
  maxSkew: number;
  /** Signed scroll velocity in px/frame (SmoothScrollProvider). */
  velocity: { current: number };
};

export function startMarquee(
  root: HTMLElement,
  { speed, maxSkew, velocity }: MarqueeEngineOptions,
): () => void {
  const mm = gsap.matchMedia();
  mm.add(MOTION_OK_QUERY, () => {
    root.dataset.animated = 'true';
    const state = gsap.utils.toArray<HTMLElement>('[data-track]', root).map((t) => ({
      t,
      dir: Number(t.dataset.dir) || 1,
      x: 0,
      width: 0,
      setX: gsap.quickSetter(t, 'x', 'px') as (v: number) => void,
    }));
    const setSkew = gsap.utils
      .toArray<HTMLElement>('[data-skew]', root)
      .map((s) => gsap.quickSetter(s, 'skewX', 'deg') as (v: number) => void);
    const measure = () =>
      state.forEach((s) => {
        s.width = (s.t.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      });
    measure();
    const ro = new ResizeObserver(measure);
    state.forEach((s) => s.t.firstElementChild && ro.observe(s.t.firstElementChild));

    let paused = false;
    let boost = 0;
    let skew = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting));
    io.observe(root);

    const tick = (_t: number, deltaMs: number) => {
      if (!visible) return;
      const dt = Math.min(deltaMs, 64) / 1000;
      const v = velocity.current ?? 0;
      boost += (Math.min(Math.abs(v) * 0.6, 14) - boost) * (1 - Math.exp(-dt * 6));
      skew += (gsap.utils.clamp(-maxSkew, maxSkew, -v * 0.35) - skew) * (1 - Math.exp(-dt * 8));
      const stopped = paused || root.dataset.held === 'true';
      const factor = stopped ? 0 : (1 + boost) * (v < -0.05 ? -1 : 1);
      state.forEach((s) => {
        if (!s.width) return;
        s.x = gsap.utils.wrap(-s.width, 0, s.x - speed * factor * dt * s.dir);
        s.setX(s.x);
      });
      setSkew.forEach((fn) => fn(stopped ? 0 : skew));
    };
    gsap.ticker.add(tick);

    const pause = () => {
      paused = true;
      root.dataset.paused = 'true';
    };
    const resume = () => {
      paused = false;
      delete root.dataset.paused;
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!root.contains(e.relatedTarget as Node | null)) resume();
    };
    root.addEventListener('pointerenter', pause);
    root.addEventListener('pointerleave', resume);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', onFocusOut);

    return () => {
      delete root.dataset.animated;
      delete root.dataset.paused;
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener('pointerenter', pause);
      root.removeEventListener('pointerleave', resume);
      root.removeEventListener('focusin', pause);
      root.removeEventListener('focusout', onFocusOut);
      gsap.set(
        state.map((s) => s.t),
        { clearProps: 'transform' },
      );
    };
  });
  return () => mm.revert();
}
