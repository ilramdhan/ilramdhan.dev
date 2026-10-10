/** Single source of truth for motion timing (T-29). Components must not hard-code these. */
export const duration = { fast: 0.15, base: 0.3, slow: 0.5 } as const;
export const ease = [0.22, 1, 0.36, 1] as const;
/** Entrance travel in px. Only `opacity` and `transform` are ever animated. */
export const distance = 16;
export const stagger = { step: 0.06, maxTotal: 0.4 } as const;
export const viewport = { once: true, amount: 0.2 } as const;

/** Delay for the n-th item of a staggered group, capped so long lists stay snappy. */
export function staggerDelay(index: number): number {
  return Math.min(index * stagger.step, stagger.maxTotal);
}
