import type { Page, Request, Route } from '@playwright/test';
import { FilterParseError, likeToRegExp, parseOrIlike } from '../../test/postgrest-filters';
import { createDataset, type Row } from './dataset';

/** Must match the VITE_SUPABASE_URL the e2e build is made with (see playwright.config.ts). */
export const MOCK_SUPABASE_URL = 'https://mock.supabase.co';

export interface SupabaseMock {
  /** Tables served to the app; mutate in a test to change what the next request returns. */
  db: Record<string, Row[]>;
  /** Every request the app made to the mock (method, decoded path + query, body). */
  requests: { method: string; url: URL; path: string; body: string | null }[];
}

const json = (route: Route, status: number, body: unknown, headers: Record<string, string> = {}) =>
  route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });

/** Parses a PostgREST array literal such as `{react,"go lang"}`. */
function parseArrayLiteral(value: string): string[] {
  const inner = value.replace(/^\{/, '').replace(/\}$/, '');
  if (!inner) return [];
  return inner.split(',').map((v) => v.trim().replace(/^"(.*)"$/, '$1'));
}

/** Text form of a cell for filter comparisons (numbers/booleans as PostgREST prints them). */
const cell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

/** Applies the subset of PostgREST filters the app uses (eq, cs, ilike, or=ilike). */
function applyFilters(rows: Row[], params: URLSearchParams): Row[] {
  let result = rows;
  for (const [key, value] of params) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
    if (key === 'or') {
      // Throws FilterParseError for malformed filters, like PostgREST's 400 (PGRST100).
      const clauses = parseOrIlike(value);
      result = result.filter((r) =>
        clauses.some(({ column, pattern }) => likeToRegExp(pattern).test(cell(r[column]))),
      );
    } else if (value.startsWith('eq.')) {
      result = result.filter((r) => cell(r[key]) === value.slice(3));
    } else if (value.startsWith('cs.')) {
      const wanted = parseArrayLiteral(value.slice(3));
      result = result.filter((r) => {
        const col = r[key];
        return Array.isArray(col) && wanted.every((w) => col.map(String).includes(w));
      });
    } else if (value.startsWith('ilike.')) {
      const re = likeToRegExp(value.slice(6));
      result = result.filter((r) => re.test(cell(r[key])));
    }
  }
  return result;
}

async function handle(route: Route, request: Request, mock: SupabaseMock) {
  const url = new URL(request.url());
  mock.requests.push({
    method: request.method(),
    url,
    path: decodeURIComponent(url.pathname + url.search),
    body: request.postData(),
  });

  // Anonymous visitor: no session, every auth call is a harmless no-op.
  if (url.pathname.startsWith('/auth/v1/')) return json(route, 200, {});
  // Storage (images uploaded by the owner) — serve a tiny placeholder image.
  if (url.pathname.startsWith('/storage/v1/')) {
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: PLACEHOLDER_SVG });
  }
  if (!url.pathname.startsWith('/rest/v1/')) return json(route, 404, { message: 'not mocked' });

  const table = url.pathname.replace('/rest/v1/', '');
  if (request.method() === 'HEAD') return route.fulfill({ status: 200 });
  if (request.method() !== 'GET') return json(route, 201, []);

  let rows: Row[];
  try {
    rows = applyFilters(mock.db[table] ?? [], url.searchParams);
  } catch (error) {
    if (!(error instanceof FilterParseError)) throw error;
    return json(route, 400, { code: 'PGRST100', message: error.message });
  }

  const single = (request.headers()['accept'] ?? '').includes('vnd.pgrst.object');
  if (single) {
    return rows[0]
      ? json(route, 200, rows[0])
      : json(route, 406, { code: 'PGRST116', message: 'JSON object requested, no rows returned' });
  }

  const limit = Number(url.searchParams.get('limit') ?? 0);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const page = limit ? rows.slice(offset, offset + limit) : rows;
  const range = page.length ? `${offset}-${offset + page.length - 1}` : '*';
  return json(route, 200, page, { 'content-range': `${range}/${rows.length}` });
}

/** A 10x10 SVG used for every third-party image the pages load. */
const PLACEHOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>';

/** Answers any request that leaves the preview server so tests never hit the network. */
function stubThirdParty(route: Route, request: Request) {
  const { hostname } = new URL(request.url());
  if (hostname === 'localhost' || hostname === '127.0.0.1') return route.fallback();
  switch (request.resourceType()) {
    case 'image':
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: PLACEHOLDER_SVG });
    case 'stylesheet':
      return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    case 'font':
      return route.fulfill({ status: 200, contentType: 'font/woff2', body: '' });
    default:
      // fetch/XHR to third-party JSON APIs (WakaTime share links, GitHub, ...).
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  }
}

/**
 * Routes all Supabase traffic of `page` to an in-memory mock (fresh copy of the
 * dataset per test) and stubs every other third-party request so tests are hermetic.
 */
export async function installSupabaseMock(page: Page): Promise<SupabaseMock> {
  const mock: SupabaseMock = { db: createDataset(), requests: [] };
  // Registered first = lowest priority: the Supabase handler below wins for its URLs.
  await page.route('**/*', stubThirdParty);
  await page.route(`${MOCK_SUPABASE_URL}/**`, (route, request) => handle(route, request, mock));
  return mock;
}
