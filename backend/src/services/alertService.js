const db = require('../store/db');
const { getAllRiskScores } = require('./riskEngine');
const { getForecastAll } = require('./forecastEngine');
const { detectDuplicates } = require('./duplicateDetector');
const { detectDoubleFunding } = require('./doubleFundingDetector');
const { getAllCommunityTrustScores } = require('./communityTrust');

// ─── Centralized Alert Aggregation Service ──────────────────────────────────
// Collects alerts from all detection services into one unified feed,
// sorted by severity and timestamp.

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };

function aggregateAlerts() {
  const alerts = [];
  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');
  const projects = db.getAll('projects');

  // Pre-build project map for O(1) lookup
  const projectMap = {};
  for (const p of projects) projectMap[p.id] = p;
  const agencyMap = {};
  for (const a of agencies) agencyMap[a.id] = a;
  const mpMap = {};
  for (const m of mps) mpMap[m.id] = m;

  const riskScores = getAllRiskScores();
  riskScores.filter(r => r.riskScore >= 60).forEach(r => {
    const project = projectMap[r.projectId];
    alerts.push({
      id: `risk-${r.projectId}`,
      type: 'RISK_ANOMALY',
      severity: r.riskScore >= 80 ? 'CRITICAL' : 'HIGH',
      title: `High-Risk Project Detected`,
      message: r.flags[0] || `Risk score ${r.riskScore}/100 for "${r.projectTitle}"`,
      projectId: r.projectId,
      projectTitle: r.projectTitle,
      projectLat: project?.lat,
      projectLng: project?.lng,
      projectBudget: project?.budget,
      projectAgency: agencyMap[project?.agencyId]?.name,
      score: r.riskScore,
      mpName: mpMap[project?.mpId]?.name || '',
      category: 'Risk Engine',
      icon: '🚨',
      timestamp: new Date().toISOString(),
    });
  });

  // ── 2. Fund Lapse Warnings ────────────────────────────────────────────────
  const forecasts = getForecastAll();
  forecasts.filter(f => f.willLapse).forEach(f => {
    const project = projectMap[f.projectId];
    alerts.push({
      id: `lapse-${f.projectId}`,
      type: 'FUND_LAPSE',
      severity: f.lapseRiskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      title: `Fund Lapse Risk`,
      message: f.message,
      projectId: f.projectId,
      projectTitle: f.projectTitle,
      projectLat: project?.lat,
      projectLng: project?.lng,
      projectBudget: project?.budget,
      score: f.projectedUtilizationPct,
      mpName: mpMap[f.mpId]?.name || '',
      category: 'Fund Forecast',
      icon: '💸',
      timestamp: new Date().toISOString(),
    });
  });

  // ── 3. Duplicate Project Flags ────────────────────────────────────────────
  const duplicates = detectDuplicates();
  duplicates.forEach(d => {
    const project = projectMap[d.pair[0]];
    alerts.push({
      id: `dup-${d.pair.join('-')}`,
      type: 'DUPLICATE_PROJECT',
      severity: d.severity,
      title: `Potential Duplicate/Ghost Project`,
      message: `"${d.projectA.title}" and "${d.projectB.title}" — ${d.similarity.titleSimilarity}% title match, ${d.similarity.distanceKm}km apart`,
      projectId: d.pair[0],
      projectTitle: d.projectA.title,
      projectLat: d.projectA.lat,
      projectLng: d.projectA.lng,
      projectBudget: project?.budget,
      score: d.similarity.confidenceScore,
      category: 'Duplicate Detector',
      icon: '👻',
      timestamp: new Date().toISOString(),
    });
  });

  // ── 4. Cross-Scheme Double Funding ────────────────────────────────────────
  const doubleFunding = detectDoubleFunding();
  doubleFunding.forEach(df => {
    alerts.push({
      id: `dbl-${df.mpladjProject.id}-${df.externalScheme.id}`,
      type: 'DOUBLE_FUNDING',
      severity: df.severity,
      title: `Cross-Scheme Double Funding`,
      message: df.message,
      projectId: df.mpladjProject.id,
      projectTitle: df.mpladjProject.title,
      score: df.overlap.confidenceScore,
      mpName: df.mpladjProject.mpName,
      category: 'Double Funding',
      icon: '💰',
      timestamp: new Date().toISOString(),
    });
  });

  // ── 5. Community Mismatch Alerts ──────────────────────────────────────────
  const communityScores = getAllCommunityTrustScores();
  communityScores.filter(c => c.mismatchScore >= 30).forEach(c => {
    const project = projectMap[c.projectId];
    alerts.push({
      id: `community-${c.projectId}`,
      type: 'COMMUNITY_MISMATCH',
      severity: c.mismatchLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
      title: `Community vs Official Mismatch`,
      message: c.message,
      projectId: c.projectId,
      projectTitle: project?.title || c.projectId,
      projectLat: project?.lat,
      projectLng: project?.lng,
      projectBudget: project?.budget,
      score: c.mismatchScore,
      mpName: mpMap[project?.mpId]?.name || '',
      category: 'Community Trust',
      icon: '👥',
      timestamp: new Date().toISOString(),
    });
  });

  // ── 6. Complaint Alerts ───────────────────────────────────────────────────
  const complaints = db.getAll('complaints');
  complaints.filter(c => c.status === 'OPEN' || c.status === 'ESCALATED').forEach(c => {
    const project = projects.find(p => p.id === c.projectId);
    alerts.push({
      id: `complaint-${c.id}`,
      type: 'COMPLAINT',
      severity: c.status === 'ESCALATED' ? 'HIGH' : 'MEDIUM',
      title: `${c.category} Complaint — ${c.status}`,
      message: c.description,
      projectId: c.projectId,
      projectTitle: project?.title || c.projectId,
      score: null,
      mpName: mps.find(m => m.id === project?.mpId)?.name || '',
      category: 'Complaints',
      icon: '📢',
      timestamp: c.createdAt,
    });
  });

  // Sort by severity then by score
  alerts.sort((a, b) => {
    const sevDiff = (SEVERITY_ORDER[a.severity] || 9) - (SEVERITY_ORDER[b.severity] || 9);
    if (sevDiff !== 0) return sevDiff;
    return (b.score || 0) - (a.score || 0);
  });

  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    high: alerts.filter(a => a.severity === 'HIGH').length,
    medium: alerts.filter(a => a.severity === 'MEDIUM').length,
    low: alerts.filter(a => a.severity === 'LOW').length,
    alerts,
  };
}

module.exports = { aggregateAlerts };
