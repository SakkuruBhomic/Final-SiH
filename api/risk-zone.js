module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const lat = Number(body.lat || req.query?.lat || 16.9891);
  const lng = Number(body.lng || req.query?.lng || 82.2475);

  // Check coastal vicinity
  const isUppadaCoastal = Math.abs(lat - 17.08) < 0.28 && Math.abs(lng - 82.33) < 0.28;
  const isKakinadaPort = Math.abs(lat - 16.99) < 0.15 && Math.abs(lng - 82.25) < 0.15;

  if (isUppadaCoastal || isKakinadaPort) {
    return res.status(200).json({
      riskLevel: 'Red Zone',
      riskColor: '#ef4444',
      zone: isUppadaCoastal ? 'Uppada Coastal Inundation Belt' : 'Kakinada Port Surge Sector',
      shelters: [
        { id: 'SS001', name: 'Kakinada Port Relief Camp', lat: 16.9891, lng: 82.2475, dist_km: '4.2' },
        { id: 'SS003', name: 'Surampalem Cyclone Cyclone Shelter', lat: 17.0942, lng: 82.0624, dist_km: '18.6' }
      ],
      advisory: 'Severe coastal surge risk active. Evacuate immediately to designated relief shelters.',
      district: 'Kakinada'
    });
  }

  return res.status(200).json({
    riskLevel: 'Caution',
    riskColor: '#f59e0b',
    zone: 'Monitored Coastal Sector',
    shelters: [
      { id: 'SS001', name: 'Kakinada Port Relief Camp', lat: 16.9891, lng: 82.2475, dist_km: '12.0' }
    ],
    advisory: 'Standard advisory active. Monitor local weather bulletins and keep emergency kit accessible.',
    district: 'Andhra Pradesh'
  });
};
