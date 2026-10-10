import { describe, expect, it } from 'vitest';
import { likeToRegExp, parseOrIlike } from '@/test/postgrest-filters';
import { escapeIlike, ilikeContains, orIlikeFilter, quoteFilterValue } from './search';

const TITLES = [
  'AWS (Associate)',
  'AWS Cloud Practitioner',
  'Google Data Analytics',
  'a,b testing',
  '100% Pure',
  'snake_case',
  'C:\\path',
  'Say "hi"',
  'x) y',
  '(y z',
];

/** Runs a search the way PostgREST would: parse the or-filter, then ILIKE each column. */
function search(input: string, rows = TITLES) {
  const filter = orIlikeFilter(['title', 'issued_by'], input);
  if (filter === null) return rows;
  const clauses = parseOrIlike(filter);
  return rows.filter((title) =>
    clauses.some(({ column, pattern }) =>
      likeToRegExp(pattern).test(column === 'title' ? title : ''),
    ),
  );
}

describe('escapeIlike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeIlike('100%')).toBe('100\\%');
    expect(escapeIlike('a_b')).toBe('a\\_b');
    expect(escapeIlike('C:\\x')).toBe('C:\\\\x');
  });

  it('turns `*` (a wildcard alias in PostgREST) into a single-character match', () => {
    expect(escapeIlike('a*b')).toBe('a_b');
  });
});

describe('ilikeContains', () => {
  it('returns null for blank input', () => {
    expect(ilikeContains(undefined)).toBeNull();
    expect(ilikeContains('   ')).toBeNull();
  });

  it('wraps the trimmed, escaped term in %', () => {
    expect(ilikeContains('  50%_off ')).toBe('%50\\%\\_off%');
  });
});

describe('quoteFilterValue', () => {
  it('double-quotes and escapes quotes/backslashes', () => {
    expect(quoteFilterValue('a"b\\c')).toBe('"a\\"b\\\\c"');
  });
});

describe('orIlikeFilter', () => {
  it('returns null for blank input', () => {
    expect(orIlikeFilter(['title'], '')).toBeNull();
  });

  it('builds one quoted ilike clause per column', () => {
    expect(orIlikeFilter(['title', 'issued_by'], 'aws')).toBe(
      'title.ilike."%aws%",issued_by.ilike."%aws%"',
    );
  });

  it.each([
    ['a,b', ['a,b testing']],
    ['x)', ['x) y']],
    ['(y', ['(y z']],
    ['%', ['100% Pure']],
    ['_', ['snake_case']],
    ['AWS (Associate)', ['AWS (Associate)']],
    ['aws', ['AWS (Associate)', 'AWS Cloud Practitioner']],
    ['"hi"', ['Say "hi"']],
    ['C:\\', ['C:\\path']],
    ['title.eq.x', []],
    ['nothing matches', []],
  ])('search %j parses and matches literally', (input, expected) => {
    expect(() => parseOrIlike(orIlikeFilter(['title', 'issued_by'], input) ?? '')).not.toThrow();
    expect(search(input)).toEqual(expected);
  });

  it('the old unquoted interpolation broke the filter for the same inputs', () => {
    const naive = (q: string) => `title.ilike.%${q}%,issued_by.ilike.%${q}%`;
    expect(() => parseOrIlike(naive('x)'))).toThrow();
    expect(() => parseOrIlike(naive('AWS (Associate)'))).toThrow();
    expect(() => parseOrIlike(naive('a,b'))).toThrow();
  });
});
