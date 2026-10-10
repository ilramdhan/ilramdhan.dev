import { describe, expect, it } from 'vitest';
import { simpleIconSlug, simpleIconUrl, slugify } from './slugify';

describe('slugify', () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['  My  New -- Project!  ', 'my-new-project'],
    ['React + TypeScript: a guide', 'react-typescript-a-guide'],
    ['Café crème brûlée', 'cafe-creme-brulee'],
    ['Next.js 14 & Supabase', 'next-js-14-supabase'],
    ['---', ''],
    ['', ''],
  ])('%j -> %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('matches the previous admin slugs for plain ASCII titles', () => {
    const legacy = (t: string) =>
      t
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    for (const title of ['Project 1', 'Blog Post 7', 'Go: concurrency (part 2)']) {
      expect(slugify(title)).toBe(legacy(title));
    }
  });
});

describe('simpleIconSlug / simpleIconUrl', () => {
  it.each([
    ['C++', 'cplusplus'],
    ['Next.js', 'nextdotjs'],
    ['Oracle DB', 'oracledb'],
    ['PostgreSQL', 'postgresql'],
  ])('%j -> %j', (input, expected) => {
    expect(simpleIconSlug(input)).toBe(expected);
  });

  it('builds the CDN URL, or null for an empty name', () => {
    expect(simpleIconUrl('Go')).toBe('https://cdn.simpleicons.org/go');
    expect(simpleIconUrl('')).toBeNull();
    expect(simpleIconUrl(null)).toBeNull();
  });
});
