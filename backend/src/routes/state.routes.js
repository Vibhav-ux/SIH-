const express = require('express');
const router = express.Router();
const db = require('../store/db');
const { getAllRiskScores } = require('../services/riskEngine');
const { computeAgencyScores } = require('../services/agencyTrust');

// ─── State & District Level Aggregation Routes ─────────────────────────────

// GET /api/state/overview — All states aggregated
router.get('/overview', (req, res) => {
  const projects = db.getAll('projects');
  const mps = db.getAll('mps');

  const stateMap = {};
  projects.forEach(p => {
    if (!stateMap[p.state]) {
      stateMap[p.state] = {
        state: p.state,
        totalProjects: 0, completedProjects: 0, stalledProjects: 0, inProgressProjects: 0,
        totalBudget: 0, totalDisbursed: 0,
        highRiskProjects: 0, districts: new Set(), mpIds: new Set(),
      };
    }
    const s = stateMap[p.state];
    s.totalProjects++;
    s.totalBudget += p.budget;
    s.totalDisbursed += p.disbursed;
    if (p.status === 'COMPLETED') s.completedProjects++;
    if (p.status === 'STALLED') s.stalledProjects++;
    if (p.status === 'IN_PROGRESS') s.inProgressProjects++;
    if (p.riskScore >= 70) s.highRiskProjects++;
    s.districts.add(p.district);
    s.mpIds.add(p.mpId);
  });

  const states = Object.values(stateMap).map(s => ({
    ...s,
    districts: s.districts.size,
    districtList: [...s.districts],
    mpCount: s.mpIds.size,
    mpIds: [...s.mpIds],
    utilizationPct: Math.round((s.totalDisbursed / s.totalBudget) * 100),
    completionRate: Math.round((s.completedProjects / s.totalProjects) * 100),
    riskLevel: s.highRiskProjects > s.totalProjects * 0.3 ? 'HIGH' : s.highRiskProjects > 0 ? 'MEDIUM' : 'LOW',
  })).sort((a, b) => b.totalBudget - a.totalBudget);

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalDisbursed = projects.reduce((s, p) => s + p.disbursed, 0);

  res.json({
    totalStates: states.length,
    totalProjects: projects.length,
    totalBudget,
    totalDisbursed,
    utilizationPct: Math.round((totalDisbursed / totalBudget) * 100),
    states,
  });
});

// GET /api/state/:state/districts — District breakdown for a state
router.get('/:state/districts', (req, res) => {
  const stateName = decodeURIComponent(req.params.state);
  const projects = db.getAll('projects').filter(p =>
    p.state.toLowerCase() === stateName.toLowerCase()
  );

  if (projects.length === 0) {
    return res.status(404).json({ error: `No projects found for state "${stateName}"` });
  }

  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');

  const districtMap = {};
  projects.forEach(p => {
    if (!districtMap[p.district]) {
      districtMap[p.district] = {
        district: p.district, state: p.state,
        totalProjects: 0, completedProjects: 0, stalledProjects: 0,
        totalBudget: 0, totalDisbursed: 0, highRiskProjects: 0,
        mpIds: new Set(), agencyIds: new Set(),
      };
    }
    const d = districtMap[p.district];
    d.totalProjects++;
    d.totalBudget += p.budget;
    d.totalDisbursed += p.disbursed;
    if (p.status === 'COMPLETED') d.completedProjects++;
    if (p.status === 'STALLED') d.stalledProjects++;
    if (p.riskScore >= 70) d.highRiskProjects++;
    d.mpIds.add(p.mpId);
    d.agencyIds.add(p.agencyId);
  });

  const districts = Object.values(districtMap).map(d => ({
    ...d,
    mpIds: [...d.mpIds],
    agencyIds: [...d.agencyIds],
    mpCount: d.mpIds.size,
    agencyCount: d.agencyIds.size,
    utilizationPct: Math.round((d.totalDisbursed / d.totalBudget) * 100),
    completionRate: Math.round((d.completedProjects / d.totalProjects) * 100),
    mpNames: [...d.mpIds].map(id => mps.find(m => m.id === id)?.name || id),
  })).sort((a, b) => b.totalBudget - a.totalBudget);

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalDisbursed = projects.reduce((s, p) => s + p.disbursed, 0);

  res.json({
    state: stateName,
    totalDistricts: districts.length,
    totalProjects: projects.length,
    totalBudget,
    totalDisbursed,
    utilizationPct: Math.round((totalDisbursed / totalBudget) * 100),
    districts,
  });
});

// GET /api/state/district/:state/:district — Single district detail
router.get('/district/:state/:district', (req, res) => {
  const stateName = decodeURIComponent(req.params.state);
  const districtName = decodeURIComponent(req.params.district);

  const projects = db.getAll('projects').filter(p =>
    p.state.toLowerCase() === stateName.toLowerCase() &&
    p.district.toLowerCase() === districtName.toLowerCase()
  );

  if (projects.length === 0) {
    return res.status(404).json({ error: `No projects found for district "${districtName}" in "${stateName}"` });
  }

  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');
  const complaints = db.getAll('complaints');
  const communityReports = db.getAll('communityReports');

  const enrichedProjects = projects.map(p => ({
    ...p,
    mpName: mps.find(m => m.id === p.mpId)?.name || p.mpId,
    agencyName: agencies.find(a => a.id === p.agencyId)?.name || p.agencyId,
    riskLevel: p.riskScore >= 70 ? 'HIGH' : p.riskScore >= 40 ? 'MEDIUM' : 'LOW',
    complaintCount: complaints.filter(c => c.projectId === p.id).length,
    reportCount: communityReports.filter(r => r.projectId === p.id).length,
  }));

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalDisbursed = projects.reduce((s, p) => s + p.disbursed, 0);

  // MP breakdown
  const mpBreakdown = {};
  projects.forEach(p => {
    if (!mpBreakdown[p.mpId]) {
      const mp = mps.find(m => m.id === p.mpId);
      mpBreakdown[p.mpId] = { mpId: p.mpId, name: mp?.name || p.mpId, constituency: mp?.constituency || '', projects: 0, budget: 0, disbursed: 0 };
    }
    mpBreakdown[p.mpId].projects++;
    mpBreakdown[p.mpId].budget += p.budget;
    mpBreakdown[p.mpId].disbursed += p.disbursed;
  });

  // Agency breakdown
  const agencyBreakdown = {};
  projects.forEach(p => {
    if (!agencyBreakdown[p.agencyId]) {
      const ag = agencies.find(a => a.id === p.agencyId);
      agencyBreakdown[p.agencyId] = { agencyId: p.agencyId, name: ag?.name || p.agencyId, trustScore: ag?.trustScore || 0, projects: 0, budget: 0 };
    }
    agencyBreakdown[p.agencyId].projects++;
    agencyBreakdown[p.agencyId].budget += p.budget;
  });

  res.json({
    state: stateName,
    district: districtName,
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    stalledProjects: projects.filter(p => p.status === 'STALLED').length,
    highRiskProjects: projects.filter(p => p.riskScore >= 70).length,
    totalBudget,
    totalDisbursed,
    utilizationPct: Math.round((totalDisbursed / totalBudget) * 100),
    projects: enrichedProjects,
    mpBreakdown: Object.values(mpBreakdown),
    agencyBreakdown: Object.values(agencyBreakdown),
  });
});

module.exports = router;
