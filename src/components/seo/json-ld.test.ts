import { describe, expect, it } from 'vitest';
import { blogPostingJsonLd, homeJsonLd, projectJsonLd } from './json-ld';

const crumbs = [{ name: 'Home', path: '/id' }];

describe('json-ld', () => {
  it('home: Person + WebSite, inLanguage matches locale', () => {
    const [person, site] = homeJsonLd('id', { description: 'd' });
    expect(person).toMatchObject({ '@type': 'Person' });
    expect(person).not.toHaveProperty('image');
    expect(site).toMatchObject({
      '@type': 'WebSite',
      inLanguage: 'id',
      url: 'https://ilramdhan.dev/id',
    });
  });

  it('blog post: absolute urls, inLanguage, unknown fields omitted', () => {
    const [post, crumb] = blogPostingJsonLd({
      locale: 'id',
      path: '/id/blog/a',
      title: 'T',
      images: ['/a.png'],
      published: '2026-01-01T00:00:00Z',
      crumbs,
    });
    expect(post).toMatchObject({
      '@type': 'BlogPosting',
      inLanguage: 'id',
      url: 'https://ilramdhan.dev/id/blog/a',
      image: ['https://ilramdhan.dev/a.png'],
    });
    expect(post).not.toHaveProperty('description');
    expect(post).not.toHaveProperty('keywords');
    expect(crumb).toMatchObject({ '@type': 'BreadcrumbList' });
  });

  it('project: SoftwareSourceCode only with a repo', () => {
    const base = { locale: 'en' as const, path: '/projects/p', title: 'P', crumbs };
    expect(projectJsonLd(base)[0]).toMatchObject({ '@type': 'CreativeWork', inLanguage: 'en' });
    expect(projectJsonLd({ ...base, repo: 'https://github.com/x/y' })[0]).toMatchObject({
      '@type': 'SoftwareSourceCode',
      codeRepository: 'https://github.com/x/y',
    });
  });
});
