import { describe, expect, it } from 'vitest';
import { alternatesFor, localePath, splitLocale } from './locale';

describe('locale paths', () => {
  it('splits the prefix off', () => {
    expect(splitLocale('/id')).toEqual({ locale: 'id', path: '/' });
    expect(splitLocale('/id/blog/a')).toEqual({ locale: 'id', path: '/blog/a' });
    expect(splitLocale('/idea')).toEqual({ locale: 'en', path: '/idea' });
    expect(splitLocale('/blog')).toEqual({ locale: 'en', path: '/blog' });
  });
  it('builds localized paths', () => {
    expect(localePath('/', 'id')).toBe('/id');
    expect(localePath('/blog?tag=x', 'id')).toBe('/id/blog?tag=x');
    expect(localePath('/#contact', 'id')).toBe('/id#contact');
    expect(localePath('/id/blog', 'en')).toBe('/blog');
    expect(localePath('/id/blog', 'id')).toBe('/id/blog');
    expect(localePath('/blog', 'en')).toBe('/blog');
    expect(localePath('/admin', 'id')).toBe('/admin');
    expect(localePath('/login', 'id')).toBe('/login');
  });
  it('lists alternates with x-default', () => {
    expect(alternatesFor('/id/about')).toEqual([
      { hreflang: 'en', path: '/about' },
      { hreflang: 'id', path: '/id/about' },
      { hreflang: 'x-default', path: '/about' },
    ]);
  });
});
