import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
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
  it('round-trips into the query cache, marked stale', () => {
    const client = new QueryClient();
    const json = serializePrerenderedData([
      { key: ['profile', 'detail'], data: { bio: '</script><b>x</b>' }, updatedAt: 1 },
    ]);
    expect(json).not.toContain('</script>');
    seedPrerenderedData(client, docWith(json));
    expect(client.getQueryData(['profile', 'detail'])).toEqual({ bio: '</script><b>x</b>' });
    expect(client.getQueryState(['profile', 'detail'])?.isInvalidated).toBe(true);
  });

  it('ignores missing or malformed data', () => {
    const client = new QueryClient();
    seedPrerenderedData(client, document.implementation.createHTMLDocument());
    seedPrerenderedData(client, docWith('{not json'));
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});
