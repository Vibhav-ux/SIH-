const db = require('../store/db');
const { stringSimilarity, haversineDistance, datesOverlap } = require('../utils/similarity');

// ─── Duplicate / Ghost Project Detector ───────────────────────────────────────
// Flags project pairs where:
//   - Title similarity > 0.65
//   - Geographic proximity < 3km
//   - Date ranges overlap

const TITLE_THRESHOLD = 0.65;
const GEO_THRESHOLD_KM = 3.0;

function detectDuplicates() {
  const projects = db.getAll('projects');
  const flagged = [];
  const seen = new Set();

  // For hackathon demo performance, limit to 200 projects to avoid 4M comparisons
  const limitProjects = projects.slice(0, 200);

  for (let i = 0; i < limitProjects.length; i++) {
    for (let j = i + 1; j < limitProjects.length; j++) {
      const a = limitProjects[i];
      const b = limitProjects[j];

      // Skip if same MP (intra-MP comparison still valid but less suspicious)
      const pairKey = [a.id, b.id].sort().join('|');
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      const titleSim = stringSimilarity(a.title, b.title);
      const geoDist = haversineDistance(a.lat, a.lng, b.lat, b.lng);
      const dateOverlap = datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate);

      // Count how many signals match
      const titleMatch = titleSim >= TITLE_THRESHOLD;
      const geoMatch = geoDist <= GEO_THRESHOLD_KM;
      const dateMatch = dateOverlap;

      const signals = [titleMatch, geoMatch, dateMatch].filter(Boolean).length;
      if (signals < 2) continue;

      const confidence = (
        (titleSim * 0.45) +
        (geoMatch ? Math.max(0, 1 - geoDist / GEO_THRESHOLD_KM) * 0.35 : 0) +
        (dateMatch ? 0.20 : 0)
      );

      flagged.push({
        pair: [a.id, b.id],
        projectA: { id: a.id, title: a.title, mpId: a.mpId, budget: a.budget, status: a.status, lat: a.lat, lng: a.lng, startDate: a.startDate, endDate: a.endDate },
        projectB: { id: b.id, title: b.title, mpId: b.mpId, budget: b.budget, status: b.status, lat: b.lat, lng: b.lng, startDate: b.startDate, endDate: b.endDate },
        similarity: {
          titleSimilarity: Math.round(titleSim * 100),
          distanceKm: Math.round(geoDist * 100) / 100,
          datesOverlap: dateMatch,
          signalsMatched: signals,
          confidenceScore: Math.round(confidence * 100),
        },
        severity: confidence >= 0.75 ? 'HIGH' : confidence >= 0.5 ? 'MEDIUM' : 'LOW',
        combinedBudget: a.budget + b.budget,
      });
    }
  }

  return flagged.sort((a, b) => b.similarity.confidenceScore - a.similarity.confidenceScore);
}

module.exports = { detectDuplicates };
