import { siteConfig } from '@/config/site';
import { toAppError } from '@/lib/errors';

// Shapes of the public share JSON files (only the fields the UI reads).
export interface WakatimeLanguage {
  name: string;
  text: string;
  percent: number;
}

export interface WakatimeLanguagesResponse {
  data: WakatimeLanguage[];
}

export interface WakatimeDay {
  date: string;
  total: number;
  categories: { name: string; total: number }[];
}

async function fetchJson<T>(url: string, what: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw toAppError(error);
  }
  if (!response.ok) {
    throw toAppError(
      { message: `Failed to fetch Wakatime ${what}: ${response.statusText}` },
      response.status,
    );
  }
  return (await response.json()) as T;
}

/** Languages chart of the public WakaTime share link (CORS-enabled JSON). */
export async function getWakatimeStats(): Promise<WakatimeLanguagesResponse> {
  try {
    return await fetchJson<WakatimeLanguagesResponse>(siteConfig.wakatime.languagesUrl, 'stats');
  } catch (error) {
    console.warn('Direct fetch failed, trying JSONP approach (simulated via error)');
    throw error;
  }
}

/** Daily coding activity of the public WakaTime share link (`{ days: [...] }`). */
export async function getWakatimeCodingActivity(): Promise<WakatimeDay[]> {
  try {
    const data = await fetchJson<{ days: WakatimeDay[] }>(
      siteConfig.wakatime.activityUrl,
      'coding activity',
    );
    return data.days;
  } catch (error) {
    console.error('Failed to fetch Wakatime coding activity:', error);
    throw error;
  }
}
