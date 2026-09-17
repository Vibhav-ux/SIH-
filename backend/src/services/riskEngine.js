const db = require('../store/db');

// ─── Risk Engine: Cost + Timeline Anomaly Scoring ─────────────────────────────
// Returns a score (0–100) and plain-language explanations for each project

function computeMedian(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function computeStdDev(arr, mean) {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function computeZScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

function scoreProject(project) {
  const flags = [];
  let riskScore = 0;

  // ── 1. Cost Anomaly ────────────────────────────────────────────────────────
  const categoryBudgets = project._categoryBudgets || [];
  if (categoryBudgets.length >= 3) {
    const mean = categoryBudgets.reduce((a, b) => a + b, 0) / categoryBudgets.length;
    const stdDev = computeStdDev(categoryBudgets, mean);
    const z = computeZScore(project.budget, mean, stdDev);
    if (z > 2) {
      riskScore += 30;
      flags.push(`⚠️ Cost Outlier: Budget ₹${(project.budget / 1e5).toFixed(1)}L is ${z.toFixed(1)}σ above the median for ${project.category} projects (median: ₹${(computeMedian(categoryBudgets) / 1e5).toFixed(1)}L).`);
    } else if (z < -1.5) {
      riskScore += 15;
      flags.push(`⚠️ Suspiciously Low Budget: At ${z.toFixed(1)}σ below category median — may indicate under-scoping to win tender.`);
    }
  }

  // ── 2. Disbursement Velocity Anomaly ──────────────────────────────────────
  const disbursementRatio = project.budget > 0 ? project.disbursed / project.budget : 0;
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const today = new Date();
  const totalDuration = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
  const elapsed = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
  const expectedProgress = Math.min(1, elapsed / totalDuration);

  const progressGap = expectedProgress - (project.completionPct / 100);
  if (progressGap > 0.3) {
    const penalty = Math.min(35, Math.round(progressGap * 80));
    riskScore += penalty;
    flags.push(`🐢 Severe Delay: Expected ${Math.round(expectedProgress * 100)}% completion by today, actual is ${project.completionPct}%. Project is ${Math.round(progressGap * 100)} percentage points behind schedule.`);
  } else if (progressGap > 0.15) {
    riskScore += 15;
    flags.push(`⏱️ Behind Schedule: Project is ${Math.round(progressGap * 100)} percentage points behind expected timeline.`);
  }

  // ── 3. Fund Utilization vs Progress Mismatch ──────────────────────────────
  const fundUtilizationRatio = disbursementRatio;
  const completionRatio = project.completionPct / 100;
  const mismatch = Math.abs(fundUtilizationRatio - completionRatio);
  if (fundUtilizationRatio > completionRatio + 0.25) {
    riskScore += 20;
    flags.push(`💰 Over-disbursement: ${Math.round(fundUtilizationRatio * 100)}% of funds disbursed but only ${project.completionPct}% complete — funds released faster than work progressing.`);
  } else if (completionRatio > fundUtilizationRatio + 0.3) {
    riskScore += 10;
    flags.push(`📊 Under-disbursement: ${project.completionPct}% complete but only ${Math.round(fundUtilizationRatio * 100)}% of funds disbursed — unusual for this stage.`);
  }

  // ── 4. Agency Trust Penalty ───────────────────────────────────────────────
  const agency = db.getById('agencies', project.agencyId);
  if (agency) {
    if (agency.trustScore < 40) {
      riskScore += 15;
      flags.push(`🚩 Low-Trust Agency: "${agency.name}" has a national trust score of ${agency.trustScore}/100 — flagged for past delays and fraud incidents.`);
    } else if (agency.trustScore < 55) {
      riskScore += 8;
      flags.push(`⚠️ Below-Average Agency: "${agency.name}" trust score ${agency.trustScore}/100 — monitor closely.`);
    }
    if (agency.shellAlert) {
      riskScore += 20;
      flags.push(`🔴 Shell Entity Alert: "${agency.name}" shares address/director with another flagged agency — potential shell company network.`);
    }
    if (agency.fraudFlags >= 3) {
      riskScore += 10;
      flags.push(`🚩 Fraud History: Agency has ${agency.fraudFlags} prior fraud flags across constituencies.`);
    }
  }

  // ── 5. Community Mismatch ─────────────────────────────────────────────────
  const reports = project._communityReports || [];
  if (reports.length >= 2) {
    const disputeReports = reports.filter(r =>
      r.statusClaim === 'NOT_STARTED' || r.statusClaim === 'LESS_THAN_25_PCT'
    );
    if (disputeReports.length / reports.length >= 0.6 && project.completionPct > 40) {
      riskScore += 15;
      flags.push(`👥 Community Dispute: ${disputeReports.length} of ${reports.length} citizen reports indicate far less progress than official ${project.completionPct}% — ground truth mismatch.`);
    }
  }

  const finalScore = Math.min(100, Math.max(0, riskScore));
  return {
    projectId: project.id,
    projectTitle: project.title,
    riskScore: finalScore,
    riskLevel: finalScore >= 70 ? 'HIGH' : finalScore >= 40 ? 'MEDIUM' : 'LOW',
    flags: flags.length ? flags : ['✅ No significant anomalies detected for this project.'],
    meta: {
      disbursementRatio: Math.round(disbursementRatio * 100),
      expectedProgress: Math.round(expectedProgress * 100),
      actualProgress: project.completionPct,
      daysElapsed: Math.round(elapsed),
      totalDays: Math.round(totalDuration),
    }
  };
}

function getAllRiskScores() {
  const allProjects = db.getAll('projects');
  
  // Pre-compute category budgets to avoid O(N^2)
  const categoryBudgets = {};
  for (const p of allProjects) {
    if (p.budget) {
      if (!categoryBudgets[p.category]) categoryBudgets[p.category] = [];
      categoryBudgets[p.category].push(p.budget);
    }
  }

  // Pre-compute community reports by project to avoid O(N^2)
  const allReports = db.getAll('communityReports');
  const reportsByProject = {};
  for (const r of allReports) {
    if (!reportsByProject[r.projectId]) reportsByProject[r.projectId] = [];
    reportsByProject[r.projectId].push(r);
  }

  return allProjects.map(p => {
    // Inject pre-computed data to avoid db.getAll or array scanning inside scoreProject
    p._categoryBudgets = categoryBudgets[p.category] || [];
    p._communityReports = reportsByProject[p.id] || [];
    return scoreProject(p);
  });
}

module.exports = { scoreProject, getAllRiskScores };

