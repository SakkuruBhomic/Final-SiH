module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    status: 'ACTIVE',
    mode: 'STANDALONE_FALLBACK',
    timestamp: new Date().toISOString(),
    zones: [
      { id: 'Z_COASTAL_SURGE', name: 'Uppada Coastal Inundation Belt', level: 'RED', hazard_type: 'cyclone', pop_at_risk: 42000 },
      { id: 'Z_SEISMIC_CORRIDOR', name: 'Andaman-Nicobar Seismic Subduction Arc', level: 'ORANGE', hazard_type: 'earthquake', pop_at_risk: 18500 },
      { id: 'Z_SLOPE_LANDSLIDE', name: 'Eastern Ghats Slope Failure Sector', level: 'YELLOW', hazard_type: 'landslide', pop_at_risk: 8400 }
    ]
  });
};
