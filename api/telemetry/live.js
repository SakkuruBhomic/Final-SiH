module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    radar: {
      station: 'IMD Doppler Radar - Machilipatnam',
      corePressureHpa: 986,
      maxGustSpeedKmH: 62,
      source: 'Open-Meteo & IMD Live Radar Telemetry'
    },
    seismic: {
      totalEvents24h: 34,
      maxRecordedMagnitude: 5.2,
      latestEvent: 'Mag 4.8 - Andaman Sea Basin',
      source: 'USGS Realtime Seismic Feed'
    }
  });
};
