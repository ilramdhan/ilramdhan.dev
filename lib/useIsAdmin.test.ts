import { afterEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn<(fn: string) => Promise<unknown>>();
vi.mock('./supabase/client', () => ({ supabase: { rpc: (fn: string) => rpc(fn) } }));

const { fetchIsAdmin, isMissingFunctionError } = await import('./useIsAdmin');

afterEach(() => {
  rpc.mockReset();
  vi.restoreAllMocks();
});

describe('fetchIsAdmin', () => {
  it('returns the database answer once is_admin() exists', async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await expect(fetchIsAdmin()).resolves.toBe(true);
    rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(fetchIsAdmin()).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledWith('is_admin');
  });

  it('treats a missing function (migration not applied) as admin and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    rpc.mockResolvedValueOnce({ data: null, error: { code: 'PGRST202', message: 'not found' } });
    await expect(fetchIsAdmin()).resolves.toBe(true);
    expect(warn).toHaveBeenCalledOnce();
  });

  it.each([
    ['a 404 without a code', { status: 404, error: { message: 'Not Found' } }],
    [
      'a "function does not exist" message',
      { status: 400, error: { message: 'function public.is_admin() does not exist' } },
    ],
    ['Postgres 42883', { status: 400, error: { code: '42883', message: 'undefined function' } }],
  ])('also treats %s as a missing function', async (_label, response) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    rpc.mockResolvedValueOnce({ data: null, ...response });
    await expect(fetchIsAdmin()).resolves.toBe(true);
  });

  it('never grants access on a permission error', async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      status: 401,
      error: { code: '42501', message: 'permission denied for function is_admin' },
    });
    await expect(fetchIsAdmin()).rejects.toThrow('permission denied');
  });

  it('throws on any other error instead of granting access', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: '500', message: 'boom' } });
    await expect(fetchIsAdmin()).rejects.toThrow('boom');
  });
});

describe('isMissingFunctionError', () => {
  it('recognises PostgREST and Postgres "undefined function" codes only', () => {
    expect(isMissingFunctionError({ code: 'PGRST202' })).toBe(true);
    expect(isMissingFunctionError({ code: '42883' })).toBe(true);
    expect(isMissingFunctionError({ code: '42501' })).toBe(false);
    expect(isMissingFunctionError({ message: 'boom' }, 500)).toBe(false);
    expect(isMissingFunctionError({ message: 'Not Found' }, 404)).toBe(true);
    expect(isMissingFunctionError(null, 404)).toBe(false);
    expect(isMissingFunctionError(null)).toBe(false);
  });
});
