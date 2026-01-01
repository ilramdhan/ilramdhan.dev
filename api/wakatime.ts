import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Support both naming conventions
  const apiKey = process.env.WAKATIME_API_KEY || process.env.VITE_WAKATIME_API_KEY;

  if (!apiKey) {
    console.error('Wakatime API Key is missing in environment variables.');
    return res.status(500).json({ error: 'Server Configuration Error: Missing API Key' });
  }

  try {
    // Use query parameter for authentication to avoid header/buffer issues in serverless environment
    const url = `https://wakatime.com/api/v1/users/current/stats/last_7_days?api_key=${apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Wakatime API Error (${response.status}): ${errorText}`);
        return res.status(response.status).json({ error: 'Failed to fetch from Wakatime', details: errorText });
    }

    const data = await response.json();
    
    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Wakatime Fetch Exception:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}