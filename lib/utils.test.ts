import { describe, expect, it } from 'vitest';
import { cn, ensureFullUrl } from './utils';

describe('ensureFullUrl', () => {
  it('returns undefined for empty values', () => {
    expect(ensureFullUrl(undefined)).toBeUndefined();
    expect(ensureFullUrl(null)).toBeUndefined();
    expect(ensureFullUrl('')).toBeUndefined();
  });

  it('keeps absolute http(s) URLs unchanged', () => {
    expect(ensureFullUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(ensureFullUrl('http://example.com')).toBe('http://example.com');
  });

  it('prefixes bare hosts with https://', () => {
    expect(ensureFullUrl('github.com/x/y')).toBe('https://github.com/x/y');
    expect(ensureFullUrl('linkedin.com/in/dummy')).toBe('https://linkedin.com/in/dummy');
  });
});

describe('cn', () => {
  it('joins class names and lets later Tailwind classes win', () => {
    const isHidden = false as boolean;
    expect(cn('px-2', isHidden && 'hidden', 'px-4')).toBe('px-4');
    expect(cn('text-sm', ['font-bold'])).toBe('text-sm font-bold');
  });
});
