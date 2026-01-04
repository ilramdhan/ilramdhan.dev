export default async function handler(req, res) {
  const apiKey = process.env.WAKATIME_API_KEY || process.env.VITE_WAKATIME_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Configuration Error: Missing API Key' });
  }

  try {
    const url = `https://wakatime.com/api/v1/users/current/stats/last_7_days?api_key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: 'Failed to fetch from Wakatime', details: errorText });
    }

    const data = await response.json();
    
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}