import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTranslationsProbe, selectWithTranslations } from './translations';

beforeEach(resetTranslationsProbe);

describe('selectWithTranslations', () => {
  it('does not ask for the column when not wanted', async () => {
    const run = vi.fn().mockResolvedValue({ error: null });
    await selectWithTranslations(false, 'a,b', run);
    expect(run).toHaveBeenCalledWith('a,b');
  });
  it('adds the column when wanted', async () => {
    const run = vi.fn().mockResolvedValue({ error: null });
    await selectWithTranslations(true, 'a,b', run);
    expect(run).toHaveBeenCalledWith('a,b,translations');
  });
  it('retries without the column once when it is missing, then stops asking', async () => {
    const err = { code: '42703', message: 'column blogs.translations does not exist' };
    const run = vi.fn((cols: string) =>
      Promise.resolve({ error: cols.includes('translations') ? err : null }),
    );
    expect((await selectWithTranslations(true, 'a', run)).error).toBeNull();
    expect(run.mock.calls.map((c) => c[0])).toEqual(['a,translations', 'a']);
    await selectWithTranslations(true, 'a', run);
    expect(run.mock.calls.map((c) => c[0])).toEqual(['a,translations', 'a', 'a']);
  });
  it('passes unrelated errors through', async () => {
    const err = { code: '42501', message: 'denied' };
    const run = vi.fn().mockResolvedValue({ error: err });
    expect((await selectWithTranslations(true, 'a', run)).error).toBe(err);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
