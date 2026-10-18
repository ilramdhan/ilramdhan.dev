import { describe, expect, it, vi } from 'vitest';
import { QUERY_DEFAULTS, createQueryClient } from '@/app/query-client';
import { blogKeys, blogQueries } from '@/features/blog/queries';
import { certificateKeys, certificateQueries } from '@/features/certificates/queries';
import { messageKeys } from '@/features/messages/queries';
import { profileKeys, profileQueries } from '@/features/profile/queries';
import { projectKeys, projectQueries } from '@/features/projects/queries';
import { resumeKeys, resumeQueries } from '@/features/resume/queries';
import { serviceKeys } from '@/features/services/queries';
import { techStackKeys } from '@/features/tech-stack/queries';
import { wakatimeQueries } from '@/features/wakatime/queries';
import { NetworkError, NotFoundError } from './errors';

// The factories import the Supabase client; keep it (and its env checks) out of the test.
vi.mock('@/lib/supabase/client', () => ({ supabase: {} }));

/** True when `key` starts with `prefix` (how React Query matches invalidations). */
const startsWith = (key: readonly unknown[], prefix: readonly unknown[]) =>
  prefix.every((part, i) => JSON.stringify(part) === JSON.stringify(key[i]));

describe('query key factories', () => {
  it('build hierarchical keys with normalised params', () => {
    expect(projectKeys.list({ page: 2, limit: 6 })).toEqual([
      'projects',
      'list',
      { page: 2, limit: 6, tag: null },
    ]);
    expect(projectKeys.detail('my-slug')).toEqual(['projects', 'detail', 'my-slug']);
    expect(blogKeys.list({ page: 1, limit: 6, tag: 'react', query: 'x' })).toEqual([
      'blogs',
      'list',
      { page: 1, limit: 6, tag: 'react', query: 'x', sort: 'newest' },
    ]);
    expect(blogKeys.comments(7)).toEqual(['blogs', 'comments', 7]);
    expect(certificateKeys.list({ page: 1, limit: 9 })).toEqual([
      'certificates',
      'list',
      { page: 1, limit: 9, issuer: null, query: '' },
    ]);
    expect(resumeKeys.list('education')).toEqual(['resume', 'list', 'education']);
  });

  it('nest every key under its feature root so `invalidateQueries(all)` reaches it', () => {
    const cases: [readonly unknown[], (readonly unknown[])[]][] = [
      [
        projectKeys.all,
        [
          projectKeys.list({ page: 1, limit: 6 }),
          projectKeys.featured(),
          projectKeys.tags(),
          projectKeys.detail('a'),
          projectKeys.admin(),
        ],
      ],
      [
        blogKeys.all,
        [
          blogKeys.list({ page: 1, limit: 6 }),
          blogKeys.featured(),
          blogKeys.detail('a'),
          blogKeys.admin(),
          blogKeys.adjacent('2026-01-01'),
          blogKeys.related(1, ['go']),
        ],
      ],
      [certificateKeys.all, [certificateKeys.full(), certificateKeys.issuers()]],
      [profileKeys.all, [profileKeys.detail()]],
      [messageKeys.all, [messageKeys.list()]],
      [serviceKeys.all, [serviceKeys.list()]],
      [techStackKeys.all, [techStackKeys.list()]],
    ];
    for (const [root, keys] of cases) {
      for (const key of keys) expect(startsWith(key, root), JSON.stringify(key)).toBe(true);
    }
    expect(startsWith(projectKeys.lists(), blogKeys.all)).toBe(false);
  });

  it('give distinct pages distinct cache entries', () => {
    expect(projectKeys.list({ page: 1, limit: 6 })).not.toEqual(
      projectKeys.list({ page: 2, limit: 6 }),
    );
    expect(resumeKeys.list('experience')).not.toEqual(resumeKeys.list('education'));
  });
});

describe('queryOptions factories', () => {
  it('pair each key with its fetcher', () => {
    expect(profileQueries.detail().queryKey).toEqual(profileKeys.detail());
    expect(projectQueries.featured().queryKey).toEqual(projectKeys.featured());
    expect(blogQueries.tags().queryKey).toEqual(blogKeys.tags());
    expect(certificateQueries.all().queryKey).toEqual(certificateKeys.full());
    expect(resumeQueries.list('experience').queryKey).toEqual(resumeKeys.list('experience'));
    for (const q of [
      profileQueries.detail(),
      projectQueries.tags(),
      certificateQueries.issuers(),
    ]) {
      expect(typeof q.queryFn).toBe('function');
    }
  });

  it('disable detail/comment queries until their parameter is known', () => {
    expect(projectQueries.detail('').enabled).toBe(false);
    expect(projectQueries.detail('x').enabled).toBe(true);
    expect(blogQueries.detail('').enabled).toBe(false);
    expect(blogQueries.comments(undefined).enabled).toBe(false);
    expect(blogQueries.comments(3).enabled).toBe(true);
  });

  it('keep the previous page while paginating', () => {
    expect(projectQueries.list({ page: 1, limit: 6 }).placeholderData).toBeTypeOf('function');
    expect(blogQueries.list({ page: 1, limit: 6 }).placeholderData).toBeTypeOf('function');
    expect(certificateQueries.list({ page: 1, limit: 9 }).placeholderData).toBeTypeOf('function');
  });

  it('never retry third-party WakaTime requests', () => {
    expect(wakatimeQueries.languages().retry).toBe(false);
    expect(wakatimeQueries.activity().retry).toBe(false);
  });
});

describe('QueryClient defaults', () => {
  it('cache for 5 min, keep 30 min, no refetch on focus, retry only non-4xx once', () => {
    const defaults = createQueryClient().getDefaultOptions().queries;
    expect(defaults).toMatchObject({
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
    });
    const retry = QUERY_DEFAULTS.retry;
    expect(retry(0, new NetworkError('offline'))).toBe(true);
    expect(retry(1, new NetworkError('offline'))).toBe(false);
    expect(retry(0, new NotFoundError('missing'))).toBe(false);
  });
});
