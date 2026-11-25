/**
 * Lazily loaded engine behind MediaFrame `parallax` (mutugading `parallax-engine.ts`): the oversized inner layer
 * travels yPercent -amount → amount, scrubbed by scroll. Transform only. Off under reduced motion.
 */
import { gsap, MOTION_OK_QUERY } from './gsap';

export function attachParallax(frame: HTMLElement, inner: HTMLElement, amount: number): () => void {
  const mm = gsap.matchMedia();
  mm.add(MOTION_OK_QUERY, () => {
    gsap.fromTo(
      inner,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
  return () => mm.revert();
}
