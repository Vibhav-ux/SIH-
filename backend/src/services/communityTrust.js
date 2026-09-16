const db = require('../store/db');

// ─── Community Trust Score ─────────────────────────────────────────────────────
// Compares crowd-reported status vs. official status.
// When crowd strongly disagrees with official progress, that gap is a fraud signal.

const STATUS_VALUES = {
  NOT_STARTED: 0,
  LESS_THAN_25_PCT: 15,
  ABOUT_50_PCT: 50,
  MORE_THAN_75_PCT: 80,
  COMPLETED: 100,
};

function computeMismatchScore(officialPct, crowdPct) {
  // Scale the gap to 0–100 mismatch score
  return Math.min(100, Math.abs(officialPct - crowdPct));
}

function computeCommunityTrust(projectId) {
  const project = db.getById('projects', projectId);
  if (!project) return null;

  const reports = db.query('communityReports', r => r.projectId === projectId);

  if (reports.length === 0) {
    return {
      projectId,
      reportCount: 0,
      crowdConsensusStatus: null,
      crowdConsensusPct: null,
      officialPct: project.completionPct,
      mismatchScore: 0,
      mismatchLevel: 'NO_DATA',
      message: 'No community reports submitted for this project.',
      reports: [],
    };
  }

  // Compute crowd consensus: weighted average of status claims
  const crowdValues = reports.map(r => STATUS_VALUES[r.statusClaim] ?? 0);
  const crowdConsensusPct = Math.round(
    crowdValues.reduce((a, b) => a + b, 0) / crowdValues.length
  );

  // Most common claim
  const claimCounts = {};
  reports.forEach(r => {
    claimCounts[r.statusClaim] = (claimCounts[r.statusClaim] || 0) + 1;
  });
  const crowdConsensusStatus = Object.entries(claimCounts).sort((a, b) => b[1] - a[1])[0][0];

  const mismatchScore = computeMismatchScore(project.completionPct, crowdConsensusPct);
  const mismatchLevel = mismatchScore >= 40 ? 'HIGH' : mismatchScore >= 20 ? 'MEDIUM' : 'LOW';

  const message = mismatchScore >= 40
    ? `🚨 High mismatch: Official reports ${project.completionPct}% complete, but community consensus is only ~${crowdConsensusPct}%. Possible falsified progress reporting.`
    : mismatchScore >= 20
    ? `⚠️ Moderate mismatch: Official ${project.completionPct}% vs community ${crowdConsensusPct}%. Monitor closely.`
    : `✅ Community reports broadly align with official progress (${project.completionPct}% official vs ${crowdConsensusPct}% crowd).`;

  return {
    projectId,
    reportCount: reports.length,
    crowdConsensusStatus,
    crowdConsensusPct,
    officialPct: project.completionPct,
    mismatchScore,
    mismatchLevel,
    message,
    reports: reports.map(r => ({
      id: r.id,
      statusClaim: r.statusClaim,
      evidenceText: r.evidenceText,
      verified: r.verified,
      createdAt: r.createdAt,
    })),
  };
}

function getAllCommunityTrustScores() {
  const projects = db.getAll('projects');
  return projects.map(p => computeCommunityTrust(p.id)).filter(Boolean);
}

module.exports = { computeCommunityTrust, getAllCommunityTrustScores };
