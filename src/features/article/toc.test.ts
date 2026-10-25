import { describe, expect, it } from 'vitest';
import { createSlugger, extractHeadings, headingText } from './toc';

describe('createSlugger', () => {
  it('slugifies and de-duplicates with -2, -3', () => {
    const slug = createSlugger();
    expect(slug('Getting Started')).toBe('getting-started');
    expect(slug('Getting started!')).toBe('getting-started-2');
    expect(slug('Getting Started')).toBe('getting-started-3');
    expect(slug('Café')).toBe('cafe');
  });

  it('never reuses an id a literal "-2" heading already took', () => {
    const slug = createSlugger();
    expect(slug('Intro 2')).toBe('intro-2');
    expect(slug('Intro')).toBe('intro');
    expect(slug('Intro')).toBe('intro-3');
  });

  it('keeps letters of any script and falls back to "section" without letters or digits', () => {
    const slug = createSlugger();
    expect(slug('日本語 ガイド')).toBe('日本語-ガイド');
    expect(slug('🚀')).toBe('section');
    expect(slug('!!!')).toBe('section-2');
  });
});

describe('headingText', () => {
  it('strips inline Markdown', () => {
    expect(headingText('Use `npm` with **[Vite](https://vitejs.dev)** \\*now\\*')).toBe(
      'Use npm with Vite *now*',
    );
  });
});

describe('extractHeadings', () => {
  it('returns h1–h3 with levels, ids and source lines; # renders as h2', () => {
    const md = '# Top\n\ntext\n\n## Second ##\n\n### Third\n\n#### Fourth';
    expect(extractHeadings(md)).toEqual([
      { level: 2, text: 'Top', id: 'top', line: 1 },
      { level: 2, text: 'Second', id: 'second', line: 5 },
      { level: 3, text: 'Third', id: 'third', line: 7 },
    ]);
  });

  it('ignores headings inside fenced and indented code', () => {
    const md = [
      '## Real',
      '```bash',
      '## comment in code',
      '```',
      '~~~~',
      '# also code',
      '```',
      '# still code',
      '~~~~',
      '    # indented code',
      '## After',
    ].join('\n');
    expect(extractHeadings(md).map((h) => h.text)).toEqual(['Real', 'After']);
  });

  it('gives duplicate headings unique ids', () => {
    expect(extractHeadings('## Setup\n## Setup\n### Setup').map((h) => h.id)).toEqual([
      'setup',
      'setup-2',
      'setup-3',
    ]);
  });

  it('recognises setext headings but not thematic breaks or list items', () => {
    const md = 'Title\n=====\n\nPara\n\nSub\n---\n\n---\n\n- item\n---';
    expect(extractHeadings(md)).toEqual([
      { level: 2, text: 'Title', id: 'title', line: 1 },
      { level: 2, text: 'Sub', id: 'sub', line: 6 },
    ]);
  });

  it('handles empty input and headings without text', () => {
    expect(extractHeadings('')).toEqual([]);
    expect(extractHeadings(null)).toEqual([]);
    expect(extractHeadings('##   \n#nospace')).toEqual([]);
  });
});
