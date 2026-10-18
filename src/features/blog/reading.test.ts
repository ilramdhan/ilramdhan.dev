import { describe, expect, it } from 'vitest';
import { countWords, markdownToPlainText, readingTime, WORDS_PER_MINUTE } from './reading';

describe('countWords', () => {
  it('counts words, ignoring Markdown syntax', () => {
    expect(countWords('## Hello **bold** _world_\n\n- one\n- two')).toBe(5);
  });

  it('keeps link labels and image alt text, drops URLs', () => {
    expect(
      countWords('See [the docs](https://example.com/a/b) ![a cat](cat.png) https://x.y'),
    ).toBe(5);
  });

  it('drops table pipes and delimiter rows, fence markers and HTML tags', () => {
    const md = '| a | b |\n| --- | :-: |\n| c | d |\n\n```js\nfoo bar\n```\n<br/>';
    expect(countWords(md)).toBe(6);
    expect(markdownToPlainText(md)).not.toMatch(/[|`<]/);
  });

  it('counts non-ASCII words and is 0 for empty input', () => {
    expect(countWords('Café über naïve')).toBe(3);
    expect(countWords('')).toBe(0);
    expect(countWords(null)).toBe(0);
  });
});

describe('readingTime', () => {
  it('is at least one minute', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('short')).toBe(1);
  });

  it('rounds words / 200 wpm', () => {
    const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
    expect(readingTime(words(WORDS_PER_MINUTE * 5))).toBe(5);
    expect(readingTime(words(WORDS_PER_MINUTE * 5 + 120))).toBe(6);
    expect(readingTime(`# Title\n\n${words(WORDS_PER_MINUTE * 2)}`)).toBe(2);
  });
});
