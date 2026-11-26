/**
 * The one place GSAP plugins are registered (ported from mutugading `interactive/gsap.ts`). Every engine imports
 * `gsap` / `ScrollTrigger` from here, never from "gsap" directly, so registration happens once. Only lazily loaded
 * engine modules import this file: GSAP never reaches a route's initial JS.
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionRegistry } from './motion-registry';

gsap.registerPlugin(ScrollTrigger, useGSAP);
gsap.defaults({ ease: 'power4.out' });
motionRegistry.scrollTrigger = ScrollTrigger;

/** Motion tokens (mutugading DESIGN.md, Motion). */
export const MOTION = {
  reveal: { duration: 0.85, stagger: 0.03, ease: 'power4.out' },
  fade: { duration: 0.3 },
  scrub: 0.6,
} as const;

export const MOTION_OK_QUERY = '(prefers-reduced-motion: no-preference)';

export { gsap, ScrollTrigger, useGSAP };
