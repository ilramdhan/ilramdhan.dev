/**
 * Dependency-free bridge between always-loaded components and the lazy GSAP bundle: `gsap.ts` registers
 * ScrollTrigger here when (and only when) a page loads GSAP, so the scroll provider can refresh triggers after a
 * route change without importing GSAP itself.
 */
type Refreshable = { refresh: () => void; update: () => void };

export const motionRegistry: { scrollTrigger: Refreshable | null } = { scrollTrigger: null };
