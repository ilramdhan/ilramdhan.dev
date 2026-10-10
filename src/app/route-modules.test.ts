import { describe, expect, it } from 'vitest';
import { pageForPath } from './route-modules';

describe('pageForPath', () => {
  it.each([
    ['/', 'home'],
    ['/#contact', 'home'],
    ['/about', 'about'],
    ['/projects', 'projects'],
    ['/projects/some-slug', 'projectDetail'],
    ['/blog?tag=react', 'blog'],
    ['/blog/a-post', 'blogDetail'],
    ['/privacy', 'privacy'],
    ['/admin', 'admin'],
    ['/nope', 'notFound'],
  ])('%s -> %s', (path, page) => {
    expect(pageForPath(path)).toBe(page);
  });
});
