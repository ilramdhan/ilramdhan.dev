import { describe, expect, it } from 'vitest';
import { needsGfm, needsHighlight, toEmbeddableImageUrl } from './markdown-url';

const RAW =
  'https://raw.githubusercontent.com/storytold/photocraft/main/docs/images/photocraft-demo.jpg';

describe('toEmbeddableImageUrl', () => {
  it('rewrites GitHub blob URLs to raw.githubusercontent.com', () => {
    expect(
      toEmbeddableImageUrl(
        'https://github.com/storytold/photocraft/blob/main/docs/images/photocraft-demo.jpg',
      ),
    ).toBe(RAW);
  });

  it('rewrites raw variants and strips ?raw=true', () => {
    expect(
      toEmbeddableImageUrl(
        'https://github.com/storytold/photocraft/raw/main/docs/images/photocraft-demo.jpg',
      ),
    ).toBe(RAW);
    expect(
      toEmbeddableImageUrl(
        'https://github.com/storytold/photocraft/blob/main/docs/images/photocraft-demo.jpg?raw=true',
      ),
    ).toBe(RAW);
  });

  it('keeps nested refs/paths intact', () => {
    expect(toEmbeddableImageUrl('https://github.com/a/b/blob/v1.2.0/x/y/z.png')).toBe(
      'https://raw.githubusercontent.com/a/b/v1.2.0/x/y/z.png',
    );
  });

  it('leaves other URLs unchanged', () => {
    for (const url of [
      'https://raw.githubusercontent.com/a/b/main/c.png',
      'https://github.com/a/b',
      'https://github.com/a/b/tree/main/docs',
      'https://example.com/a/b/blob/main/c.png',
      'https://xyz.supabase.co/storage/v1/object/public/img/a_800x600.webp',
      '/local.png',
      '',
    ]) {
      expect(toEmbeddableImageUrl(url)).toBe(url);
    }
    expect(toEmbeddableImageUrl(undefined)).toBeUndefined();
  });
});

describe('needsGfm', () => {
  it('detects GFM syntax', () => {
    for (const text of [
      '| a | b |\n| - | - |\n| 1 | 2 |',
      'a | b\n--|--\n1 | 2',
      'so ~~old~~ new',
      '- [ ] todo\n- [x] done',
      '1. [X] numbered task',
      'A claim.[^1]\n\n[^1]: Source.',
      'See https://example.com for more',
      'https://example.com',
      'visit www.example.com',
      'mail me@example.com',
    ]) {
      expect(needsGfm(text), text).toBe(true);
    }
  });

  it('ignores plain CommonMark', () => {
    for (const text of [
      null,
      undefined,
      '',
      '# Title\n\nThis is **bold** and `code`.',
      '- a\n- b\n\n1. one',
      '[link](https://example.com) and <https://example.com>',
      '![img](https://github.com/a/b/blob/main/c.png)',
      '---\n\n> quote',
      '[ref][1]\n\n[1]: /about',
    ]) {
      expect(needsGfm(text), String(text)).toBe(false);
    }
  });
});

describe('needsHighlight', () => {
  it('detects fenced blocks with a language tag', () => {
    for (const text of [
      '```ts\nconst a = 1;\n```',
      'x\n\n~~~python\nx\n~~~',
      '  ``` js\nx\n```',
      '````go\nx\n````',
    ]) {
      expect(needsHighlight(text), text).toBe(true);
    }
  });
  it('ignores untagged fences, inline code and plain text', () => {
    for (const text of ['```\nplain\n```', 'use `ts` here', 'plain text', '', null, undefined]) {
      expect(needsHighlight(text), String(text)).toBe(false);
    }
  });
});
