/**
 * Lazily loaded GSAP Flip for <FlipGroup> (mutugading `flip-engine.ts`): kept items glide from their old box to the
 * new one, new items rise in. Transform + opacity only.
 */
import { Flip } from 'gsap/Flip';
import { gsap } from './gsap';

gsap.registerPlugin(Flip);

export type FlipState = ReturnType<typeof Flip.getState>;

export function captureFlip(targets: Element[]): FlipState {
  return Flip.getState(targets);
}

export function playFlip(state: FlipState, targets: Element[], onDone?: () => void) {
  return Flip.from(state, {
    targets,
    duration: 0.5,
    ease: 'power3.inOut',
    absolute: false,
    nested: true,
    prune: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power3.out',
          stagger: 0.03,
          clearProps: 'opacity,transform',
        },
      ),
    onComplete: onDone,
  });
}
