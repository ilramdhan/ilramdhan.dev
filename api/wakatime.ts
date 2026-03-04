const WAKATIME_STATS_URL = 'https://wakatime.com/api/v1/users/current/stats/last_7_days';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status) {
  return status === 429 || status >= 500;
}

async function fetchWithRetry(url, options) {
  let lastError;

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
        const backoffMs = INITIAL_BACKOFF_MS * (2 ** attempt);
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

      const backoffMs = INITIAL_BACKOFF_MS * (2 ** attempt);
      await sleep(backoffMs);
    }
  }

  throw lastError || new Error('Failed to fetch Wakatime data');
}

export default async function handler(req, res) {
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
      return res.status(response.status).json({ error: 'Failed to fetch from Wakatime' });
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Wakatime fetch error:', error);
    return res.status(502).json({ error: 'Unable to fetch Wakatime data' });
  }
}
