/** null, undefined, '' and [] all mean "no value": switching between them is not a change. */
const normalize = (v: unknown) =>
  v === undefined || v === '' || (Array.isArray(v) && v.length === 0) ? null : v;
const same = (a: unknown, b: unknown) =>
  JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));

/** The entries of `next` whose value differs from `prev` (deep, JSON-wise). */
export function changedFields<P extends object>(next: P, prev: Partial<P>): Partial<P> {
  const out: Partial<P> = {};
  for (const key of Object.keys(next) as (keyof P)[]) {
    if (!same(next[key], prev[key])) out[key] = next[key];
  }
  return out;
}
