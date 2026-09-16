const db = require('../store/db');
const { stringSimilarity, haversineDistance, datesOverlap } = require('../utils/similarity');

// ─── Cross-Scheme Double Funding Detector ─────────────────────────────────────
// Checks MPLAD projects against external scheme dataset.
// Flags: same GPS area + similar description + overlapping dates

const GEO_THRESHOLD_KM = 0.5; // 500m — very close for same physical project
const DESC_THRESHOLD = 0.55;

function detectDoubleFunding() {
  const mpladjProjects = db.getAll('projects');
  const externalSchemes = db.getAll('externalSchemes');
  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');

  const flagged = [];

  const limitMpProjects = mpladjProjects.slice(0, 200);

  for (const mp of limitMpProjects) {
    for (const ext of externalSchemes) {
      const dist = haversineDistance(mp.lat, mp.lng, ext.lat, ext.lng);
      if (dist > GEO_THRESHOLD_KM) continue;

      const titleSim = stringSimilarity(mp.title, ext.title);
      const descSim = stringSimilarity(mp.description || '', ext.description || '');
      const combinedTextSim = titleSim * 0.6 + descSim * 0.4;

      if (combinedTextSim < DESC_THRESHOLD) continue;

      const dateMatch = datesOverlap(mp.startDate, mp.endDate, ext.startDate, ext.endDate);

      const confidence = Math.round(
        (1 - dist / GEO_THRESHOLD_KM) * 0.4 * 100 +
        combinedTextSim * 0.4 * 100 +
        (dateMatch ? 20 : 0)
      );

      const mpData = mps.find(m => m.id === mp.mpId);
      const agencyData = agencies.find(a => a.id === mp.agencyId);

      flagged.push({
        mpladjProject: {
          id: mp.id,
          title: mp.title,
          mpName: mpData?.name || mp.mpId,
          agencyName: agencyData?.name || mp.agencyId,
          budget: mp.budget,
          state: mp.state,
          district: mp.district,
          lat: mp.lat,
          lng: mp.lng,
          startDate: mp.startDate,
          endDate: mp.endDate,
          status: mp.status,
        },
        externalScheme: {
          id: ext.id,
          scheme: ext.scheme,
          title: ext.title,
          budget: ext.budget,
          contractor: ext.contractor,
          lat: ext.lat,
          lng: ext.lng,
          startDate: ext.startDate,
          endDate: ext.endDate,
        },
        overlap: {
          distanceMeters: Math.round(dist * 1000),
          titleSimilarity: Math.round(titleSim * 100),
          descriptionSimilarity: Math.round(descSim * 100),
          datesOverlap: dateMatch,
          confidenceScore: confidence,
        },
        severity: confidence >= 75 ? 'HIGH' : confidence >= 50 ? 'MEDIUM' : 'LOW',
        combinedPublicFunding: mp.budget + ext.budget,
        message: `MPLAD project "${mp.title}" may overlap with ${ext.scheme} scheme "${ext.title}" — ${dist < 0.1 ? 'same' : 'very close'} GPS location, similar description, ${dateMatch ? 'overlapping' : 'adjacent'} timeframes. Combined public funding: ₹${((mp.budget + ext.budget) / 1e5).toFixed(1)}L.`,
      });
    }
  }

  return flagged.sort((a, b) => b.overlap.confidenceScore - a.overlap.confidenceScore);
}

module.exports = { detectDoubleFunding };
