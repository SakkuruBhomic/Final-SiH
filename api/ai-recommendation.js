module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    success: true,
    recommendations: [
      {
        priority: 'CRITICAL',
        title: 'Issue Immediate Evacuation Directive for Uppada Coastal Belt',
        rationale: 'Doppler Radar telemetry indicates storm surge risks exceeding 1.8m within 6 hours.',
        action: 'Deploy 4 NDRF battalions with inflatable rescue boats to NH-216 coastal access nodes.'
      },
      {
        priority: 'HIGH',
        title: 'Pre-position Mobile Water Purification at Kakinada Port Camp',
        rationale: 'Shelter capacity reaches 78% under incoming rural evacuation intake.',
        action: 'Dispatch AP SDMA emergency logistics trucks carrying water purification packets and cots.'
      },
      {
        priority: 'MODERATE',
        title: 'Suspend Commercial Fishing Crafts within 35 Nautical Miles',
        rationale: 'Wind gusts observed up to 62 km/h in maritime sector.',
        action: 'Broadcast VHF channel 16 maritime distress warnings through Coast Guard stations.'
      }
    ]
  });
};
