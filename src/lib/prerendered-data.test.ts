import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import {
  PRERENDERED_DATA_ID,
  seedPrerenderedData,
  serializePrerenderedData,
} from './prerendered-data';

const docWith = (json: string) => {
  const doc = document.implementation.createHTMLDocument();
  const script = doc.createElement('script');
  script.type = 'application/json';
  script.id = PRERENDERED_DATA_ID;
  script.textContent = json;
  doc.body.appendChild(script);
  return doc;
};

describe('prerendered data', () => {
  it('round-trips into the query cache', () => {
    const client = new QueryClient();
    const json = serializePrerenderedData([
      { key: ['profile', 'detail'], data: { bio: '</script><b>x</b>' }, updatedAt: 1 },
    ]);
    expect(json).not.toContain('</script>');
    seedPrerenderedData(client, docWith(json));
    expect(client.getQueryData(['profile', 'detail'])).toEqual({ bio: '</script><b>x</b>' });
  });

  it('ignores missing or malformed data', () => {
    const client = new QueryClient();
    seedPrerenderedData(client, document.implementation.createHTMLDocument());
    seedPrerenderedData(client, docWith('{not json'));
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it('idle refresh skips queries already refetched since the build (no double fetch)', () => {
    vi.useFakeTimers();
    try {
      const client = new QueryClient();
      const json = serializePrerenderedData([
        { key: ['profile'], data: 'build', updatedAt: 1 },
        { key: ['blogs'], data: 'build', updatedAt: 1 },
      ]);
      const invalidate = vi.spyOn(client, 'invalidateQueries');
      seedPrerenderedData(client, docWith(json));
      // The build is older than staleTime, so the mount already refetched the profile.
      client.setQueryData(['profile'], 'fresh');
      window.dispatchEvent(new Event('load'));
      vi.runAllTimers();
      expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([['blogs']]);
    } finally {
      vi.useRealTimers();
    }
  });
});
