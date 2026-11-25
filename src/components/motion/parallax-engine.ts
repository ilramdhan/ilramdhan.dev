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

/** D7: parallax every `[data-backdrop]` shape on the page (static markup); the engine is already loaded here. */
export function attachBackdrops(): () => void {
  const offs = [...document.querySelectorAll<HTMLElement>('[data-backdrop]')].map((f) =>
    attachParallax(f, f.firstElementChild as HTMLElement, 6),
  );
  return () => offs.forEach((off) => off());
}
