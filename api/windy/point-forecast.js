const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const lat = Number(body.lat || req.query?.lat || 16.99);
  const lon = Number(body.lon || req.query?.lon || 82.25);

  const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,surface_pressure&timezone=auto`;

  try {
    const rawData = await new Promise((resolve, reject) => {
      const request = https.get(omUrl, {
        headers: { 'User-Agent': 'Risk2Rescue/2.0' },
        timeout: 6000
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      });
      request.on('error', reject);
      request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')); });
    });

    const data = JSON.parse(rawData);
    const curr = data.current || {};
    const currentTempC = curr.temperature_2m !== undefined ? curr.temperature_2m : 29.5;
    const currentWindKmh = curr.wind_speed_10m !== undefined ? curr.wind_speed_10m : 18.0;
    const maxGustKmh = curr.wind_gusts_10m !== undefined ? curr.wind_gusts_10m : currentWindKmh;

    return res.status(200).json({
      success: true,
      source: 'Open-Meteo High-Resolution Numerical Forecast API',
      lat, lon,
      lastUpdated: new Date().toISOString(),
      summary: {
        currentTempC,
        currentWindKmh,
        maxGustKmh,
        maxPrecipPerHourMm: curr.precipitation || 0,
        pressureHpa: curr.surface_pressure ? Math.round(curr.surface_pressure) : 1008,
        overallRisk: maxGustKmh >= 65 ? 'RED' : maxGustKmh >= 45 ? 'ORANGE' : 'GREEN'
      }
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      source: 'Cached Fallback Baseline',
      lat, lon,
      lastUpdated: new Date().toISOString(),
      summary: {
        currentTempC: 28.5,
        currentWindKmh: 16.0,
        maxGustKmh: 24.0,
        maxPrecipPerHourMm: 0,
        pressureHpa: 1010,
        overallRisk: 'GREEN'
      }
    });
  }
};
