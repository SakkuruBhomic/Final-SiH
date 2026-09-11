module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    hasKey: Boolean(process.env.WINDY_API_KEY),
    isConfigured: true,
    defaultLat: 16.9891,
    defaultLon: 82.2475
  });
};
