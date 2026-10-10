import { describe, expect, it } from 'vitest';
import { buildHead } from './seo-head';

const meta = (head: ReturnType<typeof buildHead>, key: string) =>
  head.meta.find(([, k]) => k === key)?.[2];

describe('buildHead', () => {
  it('uses a self-referencing absolute canonical per path', () => {
    expect(buildHead({}, '/blog').canonical).toBe('https://ilramdhan.dev/blog');
    expect(buildHead({}, '/blog/a').canonical).toBe('https://ilramdhan.dev/blog/a');
    expect(buildHead({ path: '/x' }, '/blog').canonical).toBe('https://ilramdhan.dev/x');
  });

  it('templates the title and keeps og:url in sync with the canonical', () => {
    const head = buildHead({ title: 'About' }, '/about');
    expect(head.title).toBe('About | Ilham Ramadhan');
    expect(meta(head, 'og:url')).toBe('https://ilramdhan.dev/about');
  });

  it('noindex drops canonical and url tags', () => {
    const head = buildHead({ noindex: true }, '/login');
    expect(head.canonical).toBeNull();
    expect(meta(head, 'robots')).toMatch(/noindex/);
    expect(meta(head, 'og:url')).toBeUndefined();
  });

  it('makes images absolute', () => {
    expect(meta(buildHead({}, '/'), 'og:image')).toBe('https://ilramdhan.dev/logo.png');
    expect(meta(buildHead({ image: 'https://cdn.x/a.png' }, '/'), 'og:image')).toBe(
      'https://cdn.x/a.png',
    );
  });
});
