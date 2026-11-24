import { describe, expect, it } from 'vitest';
import { localize } from './localize';

const base = { id: 1, title: 'Hello', excerpt: 'Short', tags: ['a'] };
const F = ['title', 'excerpt'];

describe('localize', () => {
  it('keeps English as is and drops translations', () => {
    const out = localize({ ...base, translations: { id: { title: 'Halo' } } }, 'en', F);
    expect(out).toEqual({ ...base, isTranslated: true });
  });
  it('overlays an id translation', () => {
    const row = { ...base, translations: { id: { title: 'Halo', excerpt: 'Singkat' } } };
    const out = localize(row, 'id', F);
    expect(out).toMatchObject({
      title: 'Halo',
      excerpt: 'Singkat',
      tags: ['a'],
      isTranslated: true,
    });
    expect(out).not.toHaveProperty('translations');
  });
  it('falls back per field when partial, empty or wrongly typed', () => {
    const row = { ...base, translations: { id: { title: 'Halo', excerpt: '  ' } } };
    expect(localize(row, 'id', F)).toMatchObject({
      title: 'Halo',
      excerpt: 'Short',
      isTranslated: true,
    });
    expect(localize({ ...base, translations: { id: { title: 5 } } }, 'id', F).title).toBe('Hello');
  });
  it('ignores fields that are not translatable', () => {
    expect(localize({ ...base, translations: { id: { tags: 'x' } } }, 'id', F).tags).toEqual(['a']);
  });
  it('is untranslated for empty translations, no id key, a missing column or junk', () => {
    for (const translations of [{}, { fr: { title: 'x' } }, undefined, null, 'x', []]) {
      const out = localize({ ...base, translations }, 'id', F);
      expect(out).toMatchObject({ title: 'Hello', isTranslated: false });
    }
    expect(localize(base, 'id', F).isTranslated).toBe(false);
  });
});
