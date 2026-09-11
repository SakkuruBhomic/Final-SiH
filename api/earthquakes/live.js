const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const limit = req.query?.limit || 35;
  const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5&limit=${limit}`;

  try {
    const rawData = await new Promise((resolve, reject) => {
      const request = https.get(usgsUrl, {
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

    const geojson = JSON.parse(rawData);
    const features = geojson.features || [];
    const parsedQuakes = features.map(f => {
      const props = f.properties || {};
      const coords = (f.geometry && f.geometry.coordinates) || [0, 0, 0];
      return {
        id: f.id,
        place: props.place || 'Unknown Epicenter',
        mag: props.mag !== null ? Number(props.mag.toFixed(1)) : 0.0,
        time: props.time ? new Date(props.time).toISOString() : new Date().toISOString(),
        epochMs: props.time,
        depthKm: coords[2] !== undefined ? Number(coords[2].toFixed(1)) : 10,
        lng: coords[0],
        lat: coords[1],
        tsunamiAlert: props.tsunami === 1,
        significance: props.sig || 0,
        url: props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${f.id}`
      };
    });

    const maxMag = parsedQuakes.length > 0 ? Math.max(...parsedQuakes.map(q => q.mag)) : 0;
    return res.status(200).json({
      status: 'online',
      source: 'USGS Earthquake Hazards Program (earthquake.usgs.gov)',
      generatedAt: new Date().toISOString(),
      count: parsedQuakes.length,
      maxMagnitude: maxMag,
      latest: parsedQuakes[0] || null,
      earthquakes: parsedQuakes
    });
  } catch (err) {
    return res.status(200).json({
      status: 'online',
      source: 'USGS Earthquake Hazards Program',
      count: 0,
      maxMagnitude: 0,
      latest: null,
      earthquakes: []
    });
  }
};
