const db = require('../store/db');

// ─── MP Accountability Scorecard ──────────────────────────────────────────────
// A transparent, data-driven scorecard per MP.
// Same formula applied equally to every MP.
// Metrics:
//   Completion ratio       25%
//   Fund utilization rate  25%
//   Average delay score    20%
//   Fraud flag rate        20%
//   Community score        10%

function computeMPScores() {
  const mps = db.getAll('mps');
  const projects = db.getAll('projects');
  const communityReports = db.getAll('communityReports');
  const agencies = db.getAll('agencies');

  return mps.map(mp => {
    const mpProjects = projects.filter(p => p.mpId === mp.id);
    const total = mpProjects.length || 1;

    // Completion ratio
    const completed = mpProjects.filter(p => p.status === 'COMPLETED').length;
    const completionRatio = completed / total;

    // Fund utilization
    const totalBudget = mpProjects.reduce((s, p) => s + p.budget, 0) || 1;
    const totalDisbursed = mpProjects.reduce((s, p) => s + p.disbursed, 0);
    const utilizationRate = totalDisbursed / totalBudget;

    // Delay score: average timeline adherence
    const today = new Date();
    const delayedProjects = mpProjects.filter(p => {
      if (p.status === 'COMPLETED') return false;
      const endDate = new Date(p.endDate);
      return endDate < today;
    }).length;
    const delayRate = delayedProjects / total;
    const delayScore = 1 - delayRate;

    // Fraud flag rate: from agencies used + community mismatches
    const mpAgencyIds = [...new Set(mpProjects.map(p => p.agencyId))];
    const mpAgencies = agencies.filter(a => mpAgencyIds.includes(a.id));
    const avgFraudFlags = mpAgencies.length > 0
      ? mpAgencies.reduce((s, a) => s + (a.fraudFlags || 0), 0) / mpAgencies.length
      : 0;
    const fraudScore = Math.max(0, 1 - avgFraudFlags / 5);

    // Community score: community reports about MP's projects
    const mpProjectIds = new Set(mpProjects.map(p => p.id));
    const relevantReports = communityReports.filter(r => mpProjectIds.has(r.projectId));
    let communityScore = 0.7; // default if no reports
    if (relevantReports.length > 0) {
      const positiveReports = relevantReports.filter(r =>
        r.statusClaim === 'MORE_THAN_75_PCT' || r.statusClaim === 'COMPLETED'
      ).length;
      communityScore = positiveReports / relevantReports.length;
    }

    const accountabilityScore = Math.round(
      completionRatio * 25 +
      utilizationRate * 25 +
      delayScore * 20 +
      fraudScore * 20 +
      communityScore * 10
    );

    // Stalled projects
    const stalledCount = mpProjects.filter(p => p.status === 'STALLED').length;
    const highRiskCount = mpProjects.filter(p => p.riskScore >= 70).length;

    return {
      mpId: mp.id,
      name: mp.name,
      constituency: mp.constituency,
      state: mp.state,
      party: mp.party,
      totalFunds: mp.totalFunds,
      usedFunds: mp.usedFunds,
      accountabilityScore,
      grade: accountabilityScore >= 80 ? 'A' : accountabilityScore >= 65 ? 'B' : accountabilityScore >= 50 ? 'C' : accountabilityScore >= 35 ? 'D' : 'F',
      metrics: {
        totalProjects: mpProjects.length,
        completedProjects: completed,
        completionRatioPct: Math.round(completionRatio * 100),
        fundUtilizationPct: Math.round(utilizationRate * 100),
        stalledProjects: stalledCount,
        highRiskProjects: highRiskCount,
        avgFraudFlags: Math.round(avgFraudFlags * 10) / 10,
        communityScorePct: Math.round(communityScore * 100),
        delayScorePct: Math.round(delayScore * 100),
      },
      breakdown: {
        completionScore: Math.round(completionRatio * 25),
        utilizationScore: Math.round(utilizationRate * 25),
        delayScore: Math.round(delayScore * 20),
        fraudScore: Math.round(fraudScore * 20),
        communityScore: Math.round(communityScore * 10),
      }
    };
  }).sort((a, b) => b.accountabilityScore - a.accountabilityScore);
}

module.exports = { computeMPScores };
