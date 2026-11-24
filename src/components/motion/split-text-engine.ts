/**
 * Lazily loaded half of TileHeading `reveal` (mutugading `split-text-engine.ts`): SplitText masked word rise,
 * played once when the heading enters. The prerendered heading stays plain text (SEO, no JS); SplitText sets
 * aria-label on the heading and aria-hidden on the pieces. Reduced motion: nothing is split, nothing moves.
 */
import { SplitText } from 'gsap/SplitText';
import { gsap, MOTION, MOTION_OK_QUERY, ScrollTrigger } from './gsap';

gsap.registerPlugin(SplitText);

export type RevealOptions = { delay?: number; start?: string };

/** Starts the reveal on `el`; returns a cleanup that reverts every split, tween and trigger. */
export function reveal(
  el: HTMLElement,
  { delay = 0, start = 'top 88%' }: RevealOptions = {},
): () => void {
  const mm = gsap.matchMedia();
  mm.add(MOTION_OK_QUERY, () => {
    let played = false;
    const split = SplitText.create(el, {
      type: 'lines,words',
      mask: 'lines',
      linesClass: 'str-line',
      wordsClass: 'str-word',
      aria: 'auto',
      autoSplit: true,
      // Returning the tween lets SplitText carry its progress over a re-split (resize, fonts).
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- a GSAP tween is thenable, not a promise
      onSplit(self) {
        // A re-split (resize / fonts) after the reveal finished: just show the text.
        if (played) return;
        return gsap.from(self.words, {
          yPercent: 110,
          duration: MOTION.reveal.duration,
          ease: MOTION.reveal.ease,
          stagger: MOTION.reveal.stagger,
          delay,
          force3D: true,
          scrollTrigger: { trigger: el, start, once: true },
          onComplete: () => {
            played = true;
            el.dataset.revealed = '';
          },
        });
      },
    });
    el.dataset.revealArmed = '';
    return () => {
      split.revert();
      delete el.dataset.revealArmed;
    };
  });
  // Fonts can change line metrics after the first split; keep trigger positions accurate.
  let alive = true;
  void document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
  return () => {
    alive = false;
    mm.revert();
  };
}
