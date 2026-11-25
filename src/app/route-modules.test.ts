import { describe, expect, it } from 'vitest';
import { pageForPath } from './route-modules';

describe('pageForPath', () => {
  it.each([
    ['/', 'home'],
    ['/#contact', 'home'],
    ['/id', 'home'],
    ['/id/blog/a-post', 'blogDetail'],
    ['/about', 'about'],
    ['/projects', 'projects'],
    ['/projects/some-slug', 'projectDetail'],
    ['/blog?tag=react', 'blog'],
    ['/blog/a-post', 'blogDetail'],
    ['/privacy', 'privacy'],
    ['/contact', 'contact'],
    ['/id/contact', 'contact'],
    ['/admin', 'admin'],
    ['/nope', 'notFound'],
  ])('%s -> %s', (path, page) => {
    expect(pageForPath(path)).toBe(page);
  });
});
