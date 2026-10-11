/**
 * `fetch` backed by the e2e Supabase mock. The e2e build is prerendered with it
 * (`PRERENDER_MOCK=1`, see scripts/prerender.mjs), so the static HTML holds the same
 * dataset the tests run against and the build never touches the network.
 */
import { createMock, MOCK_SUPABASE_URL, respond } from './supabase-mock';

export function installMockFetch(): void {
  const mock = createMock();
  const realFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const request = new Request(input, init);
    if (!request.url.startsWith(MOCK_SUPABASE_URL)) return realFetch(input, init);
    const answer = respond(mock, {
      method: request.method,
      url: request.url,
      accept: request.headers.get('accept') ?? undefined,
    });
    const headers = new Headers(answer.headers);
    if (answer.contentType) headers.set('content-type', answer.contentType);
    return Promise.resolve(new Response(answer.body ?? null, { status: answer.status, headers }));
  };
}
