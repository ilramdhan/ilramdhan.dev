import { describe, expect, it } from 'vitest';
import { firstParagraph, plainText } from './home-text';

describe('home text helpers', () => {
  it('strips inline Markdown', () => {
    expect(plainText('Dummy **service** with `code` and [a link](https://x.y)')).toBe(
      'Dummy service with code and a link',
    );
    expect(plainText(null)).toBe('');
  });

  it('takes the first non-heading paragraph', () => {
    expect(firstParagraph('## Hi\nThis is **dummy** bio.')).toBe('This is dummy bio.');
    expect(firstParagraph('# Title\n\nFirst line\nwraps here.\n\nSecond.')).toBe(
      'First line wraps here.',
    );
    expect(firstParagraph('- a list only')).toBe('');
    expect(firstParagraph(undefined)).toBe('');
  });
});
