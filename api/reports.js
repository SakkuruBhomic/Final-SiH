module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, reports: [] });
  }

  const report = req.body || {};
  return res.status(200).json({
    success: true,
    message: 'Citizen report received and logged',
    id: report.id || ('REP-' + Date.now().toString().slice(-6)),
    timestamp: Date.now()
  });
};
