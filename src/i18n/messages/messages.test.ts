import { describe, expect, it } from 'vitest';
import { en } from './en';
import { id } from './id';

/** Dotted paths of every leaf (string or function) in a dictionary. */
function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('messages', () => {
  it('id has exactly the keys of en, with the same value kinds', () => {
    expect(keys(id).sort()).toEqual(keys(en).sort());
    const get = (o: object, path: string) =>
      path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], o);
    const kind = (o: object, path: string) => typeof get(o, path);
    for (const key of keys(en)) expect(kind(id, key), key).toBe(kind(en, key));
  });

  it('id strings are not left identical to en for long sentences', () => {
    const get = (o: object, path: string) =>
      path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], o);
    const same = keys(en).filter((k) => {
      const v = get(en, k);
      return typeof v === 'string' && v.length > 40 && v === get(id, k);
    });
    expect(same).toEqual([]);
  });
});
