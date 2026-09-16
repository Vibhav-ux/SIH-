const db = require('../store/db');

// ─── Trend Analysis Service ──────────────────────────────────────────────────
// Aggregates project data into time-series and categorical trends
// for visualization on the Trend Analysis dashboard.

function computeTrends() {
  const projects = db.getAll('projects');
  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');

  // ── 1. Monthly Expenditure Timeline ─────────────────────────────────────────
  // Simulate monthly disbursement by distributing each project's
  // disbursed amount linearly across its active months.
  const monthlyData = {};
  projects.forEach(p => {
    const start = new Date(p.startDate);
    const end = p.status === 'COMPLETED' ? new Date(p.endDate) : new Date();
    const months = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)));
    const monthlyDisbursement = p.disbursed / months;

    for (let i = 0; i < months; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { month: key, disbursed: 0, budget: 0, projects: 0 };
      monthlyData[key].disbursed += monthlyDisbursement;
      monthlyData[key].budget += p.budget / months;
      monthlyData[key].projects++;
    }
  });
  const expenditureTrend = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({
      ...m,
      disbursed: Math.round(m.disbursed),
      budget: Math.round(m.budget),
    }));

  // ── 2. Category Distribution ────────────────────────────────────────────────
  const categoryMap = {};
  projects.forEach(p => {
    if (!categoryMap[p.category]) categoryMap[p.category] = { category: p.category, count: 0, budget: 0, disbursed: 0, completed: 0 };
    categoryMap[p.category].count++;
    categoryMap[p.category].budget += p.budget;
    categoryMap[p.category].disbursed += p.disbursed;
    if (p.status === 'COMPLETED') categoryMap[p.category].completed++;
  });
  const categoryDistribution = Object.values(categoryMap)
    .sort((a, b) => b.budget - a.budget);

  // ── 3. State-wise Performance ───────────────────────────────────────────────
  const stateMap = {};
  projects.forEach(p => {
    if (!stateMap[p.state]) stateMap[p.state] = { state: p.state, count: 0, budget: 0, disbursed: 0, completed: 0, highRisk: 0 };
    stateMap[p.state].count++;
    stateMap[p.state].budget += p.budget;
    stateMap[p.state].disbursed += p.disbursed;
    if (p.status === 'COMPLETED') stateMap[p.state].completed++;
    if (p.riskScore >= 70) stateMap[p.state].highRisk++;
  });
  const statePerformance = Object.values(stateMap)
    .map(s => ({ ...s, utilizationPct: Math.round((s.disbursed / s.budget) * 100) }))
    .sort((a, b) => b.budget - a.budget);

  // ── 4. Risk Distribution ────────────────────────────────────────────────────
  const riskDistribution = {
    high: projects.filter(p => p.riskScore >= 70).length,
    medium: projects.filter(p => p.riskScore >= 40 && p.riskScore < 70).length,
    low: projects.filter(p => p.riskScore < 40).length,
  };

  // ── 5. Status Distribution ──────────────────────────────────────────────────
  const statusDistribution = {
    COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
    IN_PROGRESS: projects.filter(p => p.status === 'IN_PROGRESS').length,
    STALLED: projects.filter(p => p.status === 'STALLED').length,
  };

  // ── 6. Completion Velocity (quarterly) ──────────────────────────────────────
  const quarterlyCompletion = {};
  projects.filter(p => p.status === 'COMPLETED').forEach(p => {
    const end = new Date(p.endDate);
    const q = `${end.getFullYear()}-Q${Math.ceil((end.getMonth() + 1) / 3)}`;
    quarterlyCompletion[q] = (quarterlyCompletion[q] || 0) + 1;
  });

  // ── 7. Top Risk Projects ────────────────────────────────────────────────────
  const topRiskProjects = projects
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      title: p.title,
      riskScore: p.riskScore,
      status: p.status,
      mpName: mps.find(m => m.id === p.mpId)?.name || p.mpId,
      agencyName: agencies.find(a => a.id === p.agencyId)?.name || p.agencyId,
      budget: p.budget,
      completionPct: p.completionPct,
    }));

  return {
    expenditureTrend,
    categoryDistribution,
    statePerformance,
    riskDistribution,
    statusDistribution,
    quarterlyCompletion,
    topRiskProjects,
    summary: {
      totalProjects: projects.length,
      totalBudget: projects.reduce((s, p) => s + p.budget, 0),
      totalDisbursed: projects.reduce((s, p) => s + p.disbursed, 0),
      avgRiskScore: Math.round(projects.reduce((s, p) => s + p.riskScore, 0) / projects.length),
      avgCompletionPct: Math.round(projects.reduce((s, p) => s + p.completionPct, 0) / projects.length),
    },
  };
}

module.exports = { computeTrends };
