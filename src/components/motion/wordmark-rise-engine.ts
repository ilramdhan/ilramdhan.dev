/**
 * Lazily loaded half of <WordmarkRise> (mutugading `wordmark-rise.tsx`, with the P17 fix): while the curtain lifts
 * off the footer, the wordmark travels up from 40% lower to its resting crop. Transform only (yPercent), scrubbed by
 * ScrollTrigger; Lenis calls ScrollTrigger.update on every tick, so it follows smooth scroll.
 *
 * P17: the footer lives in the layout, so its trigger is older than anything a page creates, and it was measured
 * before late layout (images, fonts, lazy sections, the prerendered page hydrating, the next route's content). Any
 * change to the curtain's height re-measures (ResizeObserver → one rAF-batched ScrollTrigger.refresh), as do
 * `document.fonts.ready` and `load`; `refreshPriority: -1` measures it after every page trigger.
 */
import { gsap, ScrollTrigger } from './gsap';

/** Same gate as the sticky reveal (global.css): wide, tall, motion allowed. */
export const RISE_QUERY =
  '(min-width: 52.125rem) and (min-height: 47.5rem) and (prefers-reduced-motion: no-preference)';

export function attachWordmarkRise(el: HTMLElement): () => void {
  const stage = el.closest<HTMLElement>('[data-reveal-stage]');
  const curtain = stage?.querySelector<HTMLElement>('.reveal-curtain');
  const footer = stage?.querySelector<HTMLElement>('[data-reveal-footer]');
  if (!stage || !curtain || !footer) return () => {};
  const mm = gsap.matchMedia();
  mm.add(RISE_QUERY, () => {
    let raf = 0;
    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const ro = new ResizeObserver(refresh);
    ro.observe(curtain);
    void document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    gsap.fromTo(
      el,
      { yPercent: 40 },
      {
        yPercent: 0,
        ease: 'none',
        force3D: true,
        scrollTrigger: {
          trigger: curtain,
          // From the moment the curtain's bottom edge leaves the viewport bottom until the footer is fully shown.
          start: 'bottom bottom',
          end: () => `bottom bottom-=${footer.offsetHeight}`,
          scrub: true,
          invalidateOnRefresh: true,
          refreshPriority: -1,
          onRefresh: (self) => {
            // A static (too tall) footer has no reveal to follow: rest in place.
            if (stage.dataset.reveal === 'static') {
              self.disable(false);
              gsap.set(el, { yPercent: 0 });
            }
          },
        },
      },
    );
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('load', refresh);
    };
  });
  return () => mm.revert();
}
