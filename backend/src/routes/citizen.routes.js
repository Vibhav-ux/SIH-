const express = require('express');
const router = express.Router();
const db = require('../store/db');
const { v4: uuidv4 } = require('uuid');

// ─── In-memory cache ─────────────────────────────────────────────────────────
let _statsCache = null;
let _statsCacheTs = 0;
const STATS_TTL = 2 * 60 * 1000; // 2 min

function buildLookupMaps() {
  const mpMap = {};
  db.getAll('mps').forEach(m => { mpMap[m.id] = m.name || m.id; });
  const agMap = {};
  db.getAll('agencies').forEach(a => { agMap[a.id] = a.name || a.id; });
  return { mpMap, agMap };
}

function enrichProject(p, mpMap, agMap) {
  return {
    id: p.id, mpId: p.mpId, title: p.title, category: p.category,
    state: p.state, district: p.district, lat: p.lat, lng: p.lng,
    budget: p.budget, disbursed: p.disbursed, status: p.status,
    completionPct: p.completionPct, riskScore: p.riskScore,
    lapseRisk: p.lapseRisk, duplicateFlag: p.duplicateFlag,
    startDate: p.startDate, endDate: p.endDate,
    description: p.description,
    mpName: mpMap[p.mpId] || p.mpId,
    agencyName: agMap[p.agencyId] || p.agencyId,
    riskLevel: p.riskScore >= 70 ? 'HIGH' : p.riskScore >= 40 ? 'MEDIUM' : 'LOW',
  };
}

// GET /api/citizen/stats — cached national aggregate
router.get('/stats', (req, res) => {
  if (_statsCache && Date.now() - _statsCacheTs < STATS_TTL) {
    return res.json(_statsCache);
  }

  const projects = db.getAll('projects');
  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');
  const complaints = db.getAll('complaints');

  let totalBudget = 0, totalDisbursed = 0, highRisk = 0, completed = 0, stalled = 0, inProg = 0;
  const stateSet = new Set();
  for (const p of projects) {
    totalBudget += p.budget || 0;
    totalDisbursed += p.disbursed || 0;
    if (p.riskScore >= 70) highRisk++;
    if (p.status === 'COMPLETED') completed++;
    else if (p.status === 'STALLED') stalled++;
    else inProg++;
    if (p.state) stateSet.add(p.state);
  }

  _statsCache = {
    totalProjects: projects.length,
    completedProjects: completed,
    inProgressProjects: inProg,
    stalledProjects: stalled,
    totalMPs: mps.length,
    totalAgencies: agencies.length,
    totalBudget, totalDisbursed,
    utilizationRate: totalBudget ? Math.round((totalDisbursed / totalBudget) * 100) : 0,
    highRiskProjects: highRisk,
    openComplaints: complaints.filter(c => c.status === 'OPEN').length,
    fraudAlerts: complaints.filter(c => c.category === 'FRAUD').length,
    states: Math.min(stateSet.size, 29),
  };
  _statsCacheTs = Date.now();
  res.json(_statsCache);
});

// GET /api/citizen/projects — paginated, with O(1) lookups
router.get('/projects', (req, res) => {
  const { state, district, category, status, mpId, risk, search, page = 1, limit = 60 } = req.query;
  let projects = db.getAll('projects');

  // Filter first (cheap)
  if (state)    projects = projects.filter(p => p.state?.toLowerCase().includes(state.toLowerCase()));
  if (district) projects = projects.filter(p => p.district?.toLowerCase().includes(district.toLowerCase()));
  if (category) projects = projects.filter(p => p.category === category);
  if (status)   projects = projects.filter(p => p.status === status);
  if (mpId)     projects = projects.filter(p => p.mpId === mpId);
  if (risk === 'HIGH')   projects = projects.filter(p => p.riskScore >= 70);
  if (risk === 'MEDIUM') projects = projects.filter(p => p.riskScore >= 40 && p.riskScore < 70);
  if (risk === 'LOW')    projects = projects.filter(p => p.riskScore < 40);
  if (search) {
    const q = search.toLowerCase();
    projects = projects.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q) ||
      p.state?.toLowerCase().includes(q)
    );
  }

  const total = projects.length;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const start = (pageNum - 1) * limitNum;
  const pageData = projects.slice(start, start + limitNum);

  // Build lookup maps ONCE for this page (O(1) per project)
  const { mpMap, agMap } = buildLookupMaps();
  const enriched = pageData.map(p => enrichProject(p, mpMap, agMap));

  res.json({ total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum), projects: enriched });
});

// GET /api/citizen/summary — single call returns stats + first 60 projects
router.get('/summary', (req, res) => {
  // Reuse stats cache
  const needStats = !_statsCache || Date.now() - _statsCacheTs >= STATS_TTL;
  if (needStats) {
    const projects = db.getAll('projects');
    const mps = db.getAll('mps');
    const agencies = db.getAll('agencies');
    const complaints = db.getAll('complaints');
    let totalBudget = 0, totalDisbursed = 0, highRisk = 0, completed = 0, stalled = 0, inProg = 0;
    const stateSet = new Set();
    for (const p of projects) {
      totalBudget += p.budget || 0;
      totalDisbursed += p.disbursed || 0;
      if (p.riskScore >= 70) highRisk++;
      if (p.status === 'COMPLETED') completed++;
      else if (p.status === 'STALLED') stalled++;
      else inProg++;
      if (p.state) stateSet.add(p.state);
    }
    _statsCache = {
      totalProjects: projects.length, completedProjects: completed,
      inProgressProjects: inProg, stalledProjects: stalled,
      totalMPs: mps.length, totalAgencies: agencies.length,
      totalBudget, totalDisbursed,
      utilizationRate: totalBudget ? Math.round((totalDisbursed / totalBudget) * 100) : 0,
      highRiskProjects: highRisk,
      openComplaints: complaints.filter(c => c.status === 'OPEN').length,
      fraudAlerts: complaints.filter(c => c.category === 'FRAUD').length,
      states: Math.min(stateSet.size, 29),
    };
    _statsCacheTs = Date.now();
  }

  const allProjects = db.getAll('projects');
  const { mpMap, agMap } = buildLookupMaps();
  const first60 = allProjects.slice(0, 60).map(p => enrichProject(p, mpMap, agMap));

  res.json({ stats: _statsCache, projects: first60, total: allProjects.length });
});

// GET /api/citizen/projects/:id — single project detail
router.get('/projects/:id', (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const mp = db.getById('mps', project.mpId);
  const agency = db.getById('agencies', project.agencyId);
  const reports = db.query('communityReports', r => r.projectId === project.id);
  const complaints = db.query('complaints', c => c.projectId === project.id);
  res.json({ ...project, mp, agency, communityReports: reports, complaints });
});

// GET /api/citizen/mps — All MPs (public summary)
router.get('/mps', (req, res) => {
  const mps = db.getAll('mps');
  const projects = db.getAll('projects');

  // Build project count map instead of nested filter
  const countMap = {};
  const completedMap = {};
  for (const p of projects) {
    countMap[p.mpId] = (countMap[p.mpId] || 0) + 1;
    if (p.status === 'COMPLETED') completedMap[p.mpId] = (completedMap[p.mpId] || 0) + 1;
  }

  const enriched = mps.map(mp => ({
    ...mp,
    totalProjects: countMap[mp.id] || 0,
    completedProjects: completedMap[mp.id] || 0,
  }));
  res.json(enriched);
});

// POST /api/citizen/report
router.post('/report', (req, res) => {
  const { projectId, name, statusClaim, evidenceText, lat, lng } = req.body;
  if (!projectId || !statusClaim) return res.status(400).json({ error: 'projectId and statusClaim are required' });
  const project = db.getById('projects', projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const report = db.write('communityReports', uuidv4(), {
    projectId, reporterId: `citizen-${uuidv4().slice(0, 8)}`,
    name: name || 'Anonymous', statusClaim, evidenceText: evidenceText || '',
    lat: lat || project.lat, lng: lng || project.lng,
    verified: false, createdAt: new Date().toISOString(),
  }, 'citizen', 'COMMUNITY_REPORT_SUBMIT');
  res.status(201).json({ success: true, report });
});

// POST /api/citizen/complaint
router.post('/complaint', (req, res) => {
  const { projectId, complainantName, complainantPhone, category, description } = req.body;
  if (!projectId || !category || !description) return res.status(400).json({ error: 'projectId, category, description required' });
  const complaint = db.write('complaints', uuidv4(), {
    projectId, complainantName: complainantName || 'Anonymous',
    complainantPhone: complainantPhone || '', category, description,
    status: 'OPEN', createdAt: new Date().toISOString(),
  }, 'citizen', 'COMPLAINT_SUBMIT');
  res.status(201).json({ success: true, complaint });
});

module.exports = router;
