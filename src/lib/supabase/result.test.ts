import { describe, expect, it, vi } from 'vitest';
import { NotFoundError, ValidationError } from '@/lib/errors';

const rpc = vi.fn<(fn: string) => Promise<unknown>>();
vi.mock('@/lib/supabase/client', () => ({ supabase: { rpc: (fn: string) => rpc(fn) } }));

const { assertOk, pageRange, unwrap, unwrapPage } = await import('./result');
const { distinctSorted, fetchDistinct } = await import('./distinct');
const { columns } = await import('./columns');

describe('unwrap / unwrapPage / assertOk', () => {
  it('returns data or throws a typed error', () => {
    expect(unwrap({ data: [1], error: null })).toEqual([1]);
    expect(() =>
      unwrap({ data: null, error: { code: 'PGRST116', message: 'none' }, status: 406 }),
    ).toThrow(NotFoundError);
    expect(() => assertOk({ error: { code: '23505', message: 'dup' }, status: 409 })).toThrow(
      ValidationError,
    );
    expect(() => assertOk({ error: null })).not.toThrow();
  });

  it('defaults a page to empty data and count 0', () => {
    expect(unwrapPage({ data: null, error: null, count: null })).toEqual({ data: [], count: 0 });
    expect(unwrapPage({ data: [1, 2], error: null, count: 9 })).toEqual({ data: [1, 2], count: 9 });
  });

  it('computes inclusive range bounds for 1-based pages', () => {
    expect(pageRange(1, 6)).toEqual([0, 5]);
    expect(pageRange(3, 9)).toEqual([18, 26]);
    expect(pageRange(0, 6)).toEqual([0, 5]);
  });
});

describe('columns', () => {
  it('joins column names for select()', () => {
    expect(columns('projects', 'id', 'slug', 'title')).toBe('id,slug,title');
  });
});

describe('fetchDistinct', () => {
  it('sorts and de-duplicates', () => {
    expect(distinctSorted(['b', 'a', null, '', 'b', undefined])).toEqual(['a', 'b']);
  });

  it('uses the database function when it exists', async () => {
    rpc.mockResolvedValueOnce({ data: ['go', 'react', 'go'], error: null, status: 200 });
    const fallback = vi.fn<() => Promise<string[]>>();
    await expect(fetchDistinct('project_tags', fallback)).resolves.toEqual(['go', 'react']);
    expect(rpc).toHaveBeenCalledWith('project_tags');
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back to the column scan while the migration is not applied', async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function' },
      status: 404,
    });
    await expect(fetchDistinct('blog_tags', () => Promise.resolve(['x']))).resolves.toEqual(['x']);
  });

  it('throws other errors as typed errors', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' }, status: 503 });
    await expect(fetchDistinct('certificate_issuers', () => Promise.resolve([]))).rejects.toThrow(
      'boom',
    );
  });
});
