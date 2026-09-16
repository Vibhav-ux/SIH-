const db = require('../store/db');

// ─── Fund-Lapse Forecast Engine ───────────────────────────────────────────────
// MPLAD funds must be utilized within statutory window.
// Uses linear regression on disbursement velocity to predict whether
// a project will hit >= 80% utilization before its end date.

const LAPSE_THRESHOLD = 0.80; // 80% utilization target

function linearRegression(points) {
  // points: [{x: daysSinceStart, y: disbursedAmount}]
  if (points.length < 2) return null;
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function forecastProject(project) {
  const today = new Date();
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);

  const totalDays = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, (endDate - today) / (1000 * 60 * 60 * 24));

  // Simulate disbursement timeline from start to now
  // Real system: query disbursement events. Here: simulate 3 data points.
  const disbursementPct = project.budget > 0 ? project.disbursed / project.budget : 0;
  const currentDisbursed = project.disbursed;

  // Two synthetic data points: 0 at start, currentDisbursed at now
  const points = [
    { x: 0, y: 0 },
    { x: elapsedDays, y: currentDisbursed },
  ];

  const regression = linearRegression(points);
  const projectedAtEnd = regression
    ? regression.slope * totalDays + regression.intercept
    : currentDisbursed;

  const projectedUtilization = project.budget > 0 ? projectedAtEnd / project.budget : 0;
  const willLapse = projectedUtilization < LAPSE_THRESHOLD;
  const shortfallAmount = willLapse
    ? Math.max(0, project.budget * LAPSE_THRESHOLD - currentDisbursed)
    : 0;

  const confidence = elapsedDays > totalDays * 0.2 ? 'HIGH' : 'LOW';

  return {
    projectId: project.id,
    projectTitle: project.title,
    mpId: project.mpId,
    budget: project.budget,
    disbursed: project.disbursed,
    currentUtilizationPct: Math.round(disbursementPct * 100),
    projectedUtilizationPct: Math.min(100, Math.round(projectedUtilization * 100)),
    endDate: project.endDate,
    remainingDays: Math.round(remainingDays),
    willLapse,
    shortfallAmount: Math.round(shortfallAmount),
    lapseRiskLevel: willLapse
      ? (remainingDays < 90 ? 'CRITICAL' : 'HIGH')
      : 'SAFE',
    confidence,
    message: willLapse
      ? `At current pace, only ${Math.round(projectedUtilization * 100)}% will be utilized by ${project.endDate}. ₹${(shortfallAmount / 1e5).toFixed(1)}L at risk of lapse.`
      : `On track. Projected ${Math.round(projectedUtilization * 100)}% utilization by deadline.`,
  };
}

function getForecastAll() {
  const projects = db.getAll('projects').filter(p => p.status !== 'COMPLETED');
  return projects.map(forecastProject).sort((a, b) => a.projectedUtilizationPct - b.projectedUtilizationPct);
}

module.exports = { forecastProject, getForecastAll };
