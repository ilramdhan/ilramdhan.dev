/**
 * Lazily loaded half of <SmoothScrollProvider>: Lenis driven by gsap.ticker (mutugading `lenis-engine.ts`). The
 * provider imports this module when the browser is idle after hydration, so neither Lenis nor GSAP is in the
 * initial bundle. Smooth only on a fine pointer with motion allowed; native scroll everywhere else.
 */
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

const SMOOTH_QUERY = '(pointer: fine) and (prefers-reduced-motion: no-preference)';

export type EngineHooks = {
  /** Written every tick (px/frame, signed). */
  velocity: { current: number };
  onLenis: (lenis: Lenis | null) => void;
};

/** Creates / destroys Lenis whenever the capability query flips. Returns a full cleanup. */
export function startEngine({ velocity, onLenis }: EngineHooks): () => void {
  const mql = window.matchMedia(SMOOTH_QUERY);
  let instance: Lenis | null = null;
  let lastY = window.scrollY;

  // Native scroll: a low-pass velocity so the marquee still reacts to scrolling.
  const nativeTick = () => {
    const y = window.scrollY;
    velocity.current += (y - lastY - velocity.current) * 0.25;
    lastY = y;
  };
  const lenisTick = (time: number) => instance?.raf(time * 1000);

  const mount = () => {
    if (instance) return;
    gsap.ticker.remove(nativeTick);
    instance = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      autoRaf: false,
      // A dialog/lightbox that sets `overflow: hidden` on <html> stops Lenis too (no extra wiring per modal).
      autoToggle: true,
      // ponytail: hash links stay with ScrollManager (it already offsets for the nav); R4 moves it onto Lenis.
      anchors: false,
    });
    instance.on('scroll', (l: Lenis) => {
      velocity.current = l.velocity;
      ScrollTrigger.update();
    });
    gsap.ticker.add(lenisTick);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add('lenis-on');
    onLenis(instance);
  };
  const unmount = () => {
    if (instance) {
      gsap.ticker.remove(lenisTick);
      instance.destroy();
      instance = null;
      document.documentElement.classList.remove('lenis-on');
      onLenis(null);
    }
    lastY = window.scrollY;
    gsap.ticker.add(nativeTick);
  };

  const apply = () => (mql.matches ? mount() : unmount());
  apply();
  mql.addEventListener('change', apply);
  return () => {
    mql.removeEventListener('change', apply);
    gsap.ticker.remove(nativeTick);
    gsap.ticker.remove(lenisTick);
    gsap.ticker.lagSmoothing(500, 33);
    instance?.destroy();
    instance = null;
    document.documentElement.classList.remove('lenis-on');
  };
}
