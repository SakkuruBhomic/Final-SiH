const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const filePath = path.join(process.cwd(), 'data', 'shelters.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const shelters = JSON.parse(rawData);

    const enriched = shelters.map(s => ({
      ...s,
      available_beds: Math.max(0, s.capacity - s.current_occupancy),
      occupancy_rate_pct: Math.round((s.current_occupancy / s.capacity) * 100),
      is_full: s.status === 'full' || s.current_occupancy >= s.capacity,
      is_closed: s.status === 'closed'
    }));

    const totalCap = enriched.reduce((a, b) => a + b.capacity, 0);
    const totalOcc = enriched.reduce((a, b) => a + b.current_occupancy, 0);

    return res.status(200).json({
      success: true,
      source: 'State Disaster Management Authority (SDMA) Relief Shelter Network',
      count: enriched.length,
      summary: {
        totalCapacity: totalCap,
        totalOccupancy: totalOcc,
        totalAvailableBeds: Math.max(0, totalCap - totalOcc),
        overallOccupancyPct: Math.round((totalOcc / (totalCap || 1)) * 100),
        openSheltersCount: enriched.filter(s => s.status === 'open' && !s.is_full).length
      },
      shelters: enriched
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read shelters data: ' + err.message });
  }
};
