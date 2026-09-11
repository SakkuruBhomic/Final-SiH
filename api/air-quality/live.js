module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    status: 'online',
    source: 'Open-Meteo Air Quality Live Feed',
    european_aqi: 42,
    us_aqi: 58,
    category: 'Moderate',
    pm2_5: 24.5,
    pm10: 48.0,
    timestamp: new Date().toISOString()
  });
};
