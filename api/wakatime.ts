import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.VITE_WAKATIME_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Wakatime API Key not configured' });
  }

  try {
    // Fetch stats for the last 7 days
    const response = await fetch('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`
      }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Wakatime API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Set Cache-Control header for better performance (cache for 1 hour)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Wakatime Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch Wakatime stats', details: error.message });
  }
}