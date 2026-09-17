const express = require('express');
const router = express.Router();
const db = require('../store/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/citizen/stats — National aggregate stats
router.get('/stats', (req, res) => {
  const projects = db.getAll('projects');
  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');
  const complaints = db.getAll('complaints');

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalDisbursed = projects.reduce((s, p) => s + p.disbursed, 0);
  const highRiskProjects = projects.filter(p => p.riskScore >= 70).length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const stalledProjects = projects.filter(p => p.status === 'STALLED').length;

  res.json({
    totalProjects: projects.length,
    completedProjects,
    inProgressProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
    stalledProjects,
    totalMPs: mps.length,
    totalAgencies: agencies.length,
    totalBudget,
    totalDisbursed,
    utilizationRate: Math.round((totalDisbursed / totalBudget) * 100),
    highRiskProjects,
    openComplaints: complaints.filter(c => c.status === 'OPEN').length,
    fraudAlerts: complaints.filter(c => c.category === 'FRAUD').length,
    states: Math.min([...new Set(projects.map(p => p.state))].length, 29),
  });
});

// GET /api/citizen/projects — All projects with optional filters
router.get('/projects', (req, res) => {
  let projects = db.getAll('projects');
  const { state, district, category, status, mpId, risk, search } = req.query;

  if (state) projects = projects.filter(p => p.state.toLowerCase().includes(state.toLowerCase()));
  if (district) projects = projects.filter(p => p.district.toLowerCase().includes(district.toLowerCase()));
  if (category) projects = projects.filter(p => p.category === category);
  if (status) projects = projects.filter(p => p.status === status);
  if (mpId) projects = projects.filter(p => p.mpId === mpId);
  if (risk === 'HIGH') projects = projects.filter(p => p.riskScore >= 70);
  if (risk === 'MEDIUM') projects = projects.filter(p => p.riskScore >= 40 && p.riskScore < 70);
  if (risk === 'LOW') projects = projects.filter(p => p.riskScore < 40);
  if (search) {
    const q = search.toLowerCase();
    projects = projects.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q)
    );
  }

  // Enrich with MP names and agency names
  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');
  const enriched = projects.map(p => ({
    ...p,
    mpName: mps.find(m => m.id === p.mpId)?.name || p.mpId,
    agencyName: agencies.find(a => a.id === p.agencyId)?.name || p.agencyId,
    riskLevel: p.riskScore >= 70 ? 'HIGH' : p.riskScore >= 40 ? 'MEDIUM' : 'LOW',
  }));

  res.json(enriched);
});

// GET /api/citizen/projects/:id — Single project detail
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
  const enriched = mps.map(mp => {
    const mpProjects = projects.filter(p => p.mpId === mp.id);
    return {
      ...mp,
      totalProjects: mpProjects.length,
      completedProjects: mpProjects.filter(p => p.status === 'COMPLETED').length,
    };
  });
  res.json(enriched);
});

// POST /api/citizen/report — Submit community report
router.post('/report', (req, res) => {
  const { projectId, name, statusClaim, evidenceText, lat, lng } = req.body;
  if (!projectId || !statusClaim) return res.status(400).json({ error: 'projectId and statusClaim are required' });

  const project = db.getById('projects', projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const report = db.write('communityReports', uuidv4(), {
    projectId,
    reporterId: `citizen-${uuidv4().slice(0, 8)}`,
    name: name || 'Anonymous',
    statusClaim,
    evidenceText: evidenceText || '',
    lat: lat || project.lat,
    lng: lng || project.lng,
    verified: false,
    createdAt: new Date().toISOString(),
  }, 'citizen', 'COMMUNITY_REPORT_SUBMIT');

  res.status(201).json({ success: true, report });
});

// POST /api/citizen/complaint — Submit complaint
router.post('/complaint', (req, res) => {
  const { projectId, complainantName, complainantPhone, category, description } = req.body;
  if (!projectId || !category || !description) return res.status(400).json({ error: 'projectId, category, description required' });

  const complaint = db.write('complaints', uuidv4(), {
    projectId,
    complainantName: complainantName || 'Anonymous',
    complainantPhone: complainantPhone || '',
    category,
    description,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  }, 'citizen', 'COMPLAINT_SUBMIT');

  res.status(201).json({ success: true, complaint });
});

module.exports = router;
