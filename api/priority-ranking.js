const fs = require('fs');
const path = require('path');
const PriorityEngine = require('../../js/priority-engine.js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const sheltersPath = path.join(process.cwd(), 'data', 'shelters.json');
    const censusPath = path.join(process.cwd(), 'data', 'census_lookup.json');
    const rawShelters = fs.existsSync(sheltersPath) ? JSON.parse(fs.readFileSync(sheltersPath, 'utf8')) : [];
    const rawVillages = fs.existsSync(censusPath) ? JSON.parse(fs.readFileSync(censusPath, 'utf8')) : [];

    const report = PriorityEngine.generateComprehensiveReport(rawVillages, rawShelters);
    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({ error: 'Priority ranking generation failed: ' + err.message });
  }
};
