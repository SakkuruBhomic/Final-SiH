const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const filePath = path.join(process.cwd(), 'data', 'census_lookup.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const villages = JSON.parse(rawData);

    const zoneId = req.query?.zone_id;
    const hazard = req.query?.hazard_type;
    let filtered = villages;
    if (zoneId) filtered = filtered.filter(v => v.mapped_zone_id === zoneId);
    if (hazard) filtered = filtered.filter(v => v.hazard_type === hazard);

    return res.status(200).json({
      success: true,
      source: 'Census of India 2011 (Official Village Directory, growth-adjusted to 2026)',
      count: filtered.length,
      totalCensus2011Pop: filtered.reduce((a, b) => a + (b.census_2011_pop || 0), 0),
      totalGrowthAdjustedPop: filtered.reduce((a, b) => a + (b.growth_adjusted_pop || 0), 0),
      villages: filtered
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read census lookup: ' + err.message });
  }
};
