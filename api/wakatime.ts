import type { VercelRequest, VercelResponse } from '@vercel/node';

const WAKATIME_STATS_URL = 'https://wakatime.com/api/v1/users/current/stats/last_7_days';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 300;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number) {
  return status === 429 || status >= 500;
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok && shouldRetry(response.status) && attempt < MAX_RETRIES) {
        // Release the unread body so the connection can be reused before retrying.
        await response.body?.cancel().catch(() => {});
        const backoffMs = INITIAL_BACKOFF_MS * 2 ** attempt;
        await sleep(backoffMs);
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt >= MAX_RETRIES) {
        throw error;
      }

      const backoffMs = INITIAL_BACKOFF_MS * 2 ** attempt;
      await sleep(backoffMs);
    }
  }

  // eslint-disable-next-line @typescript-eslint/only-throw-error -- rethrows whatever fetch threw, unchanged
  throw lastError || new Error('Failed to fetch Wakatime data');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Configuration Error' });
  }

  const authToken = Buffer.from(`${apiKey}:`).toString('base64');

  try {
    const response = await fetchWithRetry(WAKATIME_STATS_URL, {
      headers: {
        Authorization: `Basic ${authToken}`,
      },
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      console.error('Wakatime upstream error:', response.status, details.slice(0, 500));
      return res.status(response.status).json({ error: 'Failed to fetch from Wakatime' });
    }

    const data: unknown = await response.json();

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Wakatime fetch error:', error);
    return res.status(502).json({ error: 'Unable to fetch Wakatime data' });
  }
}
