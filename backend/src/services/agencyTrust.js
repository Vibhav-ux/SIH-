const db = require('../store/db');

// ─── Cross-Constituency Agency Trust Score ────────────────────────────────────
// A national reputation score that follows agencies across MPs, districts, states.
// Score formula (0–100):
//   Completion rate  40%
//   Delay rate       30% (lower delay = higher score)
//   Fraud flag rate  20% (fewer = higher)
//   Community score  10%

function computeAgencyScores() {
  const agencies = db.getAll('agencies');
  const projects = db.getAll('projects');
  const communityReports = db.getAll('communityReports');

  return agencies.map(agency => {
    const agencyProjects = projects.filter(p => p.agencyId === agency.id);
    const totalProjects = agencyProjects.length || agency.totalProjects || 1;
    const completed = agencyProjects.filter(p => p.status === 'COMPLETED').length || agency.completedProjects || 0;
    const completionRate = completed / totalProjects;

    // Delay score: invert avg delay (max 120 days mapped to 0)
    const avgDelay = agency.avgDelayDays || 0;
    const delayScore = Math.max(0, 1 - avgDelay / 120);

    // Fraud flag score: invert (max 5 flags mapped to 0)
    const fraudScore = Math.max(0, 1 - (agency.fraudFlags || 0) / 5);

    // Community score: average of community reports about agency's projects
    const agencyProjectIds = new Set(agencyProjects.map(p => p.id));
    const relevantReports = communityReports.filter(r => agencyProjectIds.has(r.projectId));
    let communityScore = 0.7; // default
    if (relevantReports.length > 0) {
      const positiveReports = relevantReports.filter(r =>
        r.statusClaim === 'MORE_THAN_75_PCT' || r.statusClaim === 'COMPLETED'
      ).length;
      communityScore = positiveReports / relevantReports.length;
    }

    const trustScore = Math.round(
      completionRate * 40 +
      delayScore * 30 +
      fraudScore * 20 +
      communityScore * 10
    );

    const mpIds = [...new Set(agencyProjects.map(p => p.mpId))];
    const states = [...new Set(agencyProjects.map(p => p.state))];

    return {
      ...agency,
      trustScore,
      completionRate: Math.round(completionRate * 100),
      delayScore: Math.round(delayScore * 100),
      fraudScore: Math.round(fraudScore * 100),
      communityScore: Math.round(communityScore * 100),
      activeProjects: agencyProjects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'STALLED').length,
      mpCount: mpIds.length,
      stateCount: states.length,
      mpIds,
      states,
      riskLevel: trustScore < 40 ? 'HIGH_RISK' : trustScore < 60 ? 'MEDIUM_RISK' : 'LOW_RISK',
    };
  }).sort((a, b) => b.trustScore - a.trustScore);
}

function getAgencyById(agencyId) {
  const scores = computeAgencyScores();
  return scores.find(a => a.id === agencyId) || null;
}

module.exports = { computeAgencyScores, getAgencyById };
