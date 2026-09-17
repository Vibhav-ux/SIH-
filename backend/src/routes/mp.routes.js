const express = require('express');
const router = express.Router();
const db = require('../store/db');
const supabaseDb = require('../store/supabaseDb');
const { v4: uuidv4 } = require('uuid');
const { scoreProject } = require('../services/riskEngine');
const { forecastProject } = require('../services/forecastEngine');
const { generateMpData } = require('../data/seed');

// ============================================================
// REAL MP DATA FROM NEON DATABASE (CSV-backed)
// ============================================================

// GET /api/mp/all - All real MPs from Neon (with filters & pagination)
router.get('/all', async (req, res) => {
  try {
    const { state, type, search, limit = 100, offset = 0 } = req.query;
    let mps = db.getAll('mps');
    
    if (state) mps = mps.filter(m => m.state && m.state.toLowerCase() === state.toLowerCase());
    if (type) mps = mps.filter(m => m.type && m.type.toLowerCase() === type.toLowerCase());
    if (search) mps = mps.filter(m => 
      (m.name && m.name.toLowerCase().includes(search.toLowerCase())) || 
      (m.constituency && m.constituency.toLowerCase().includes(search.toLowerCase()))
    );

    mps.sort((a, b) => a.name.localeCompare(b.name));
    
    const paginated = mps.slice(Number(offset), Number(offset) + Number(limit));
    res.json({ total: mps.length, mps: paginated });
  } catch (err) {
    console.error('API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch MPs from database' });
  }
});

// GET /api/mp/stats - Aggregate stats (Lok Sabha vs Rajya Sabha)
router.get('/stats', async (req, res) => {
  try {
    const mps = db.getAll('mps');
    const statsObj = mps.reduce((acc, row) => {
      const type = row.type || 'Unknown';
      if (!acc[type]) acc[type] = { type, count: 0, total_funds: 0, used_funds: 0 };
      acc[type].count += 1;
      acc[type].total_funds += Number(row.totalFunds) || 0;
      acc[type].used_funds += Number(row.usedFunds) || 0;
      return acc;
    }, {});
    const stats = Object.values(statsObj).map(s => ({ ...s, avg_funds: s.count > 0 ? (s.total_funds / s.count) : 0 }));
    res.json(stats);
  } catch (err) {
    console.error('API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch MP stats' });
  }
});

// GET /api/mp/states - List of all states with MPs
router.get('/states', async (req, res) => {
  try {
    const mps = db.getAll('mps');
    const states = [...new Set(mps.map(r => r.state).filter(Boolean))];
    res.json(states.sort());
  } catch (err) {
    console.error('API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// GET /api/mp/neon/:mpId - Single MP from Neon by ID (e.g. LS-1, RS-5)
router.get('/neon/:mpId', async (req, res) => {
  try {
    const mp = await supabaseDb.getMpById(req.params.mpId);
    if (!mp) return res.status(404).json({ error: 'MP not found' });
    res.json(mp);
  } catch (err) {
    console.error('Neon error:', err.message);
    res.status(500).json({ error: 'Failed to fetch MP' });
  }
});

// Helper: ensure MP data exists (uses seed.js generator)
function ensureMpDataExists(mpId, mp) {
  const projects = db.query('projects', p => p.mpId === mpId);
  if (projects.length > 0) return;
  const state = mp?.state || 'India';
  const constituency = mp?.constituency || 'Constituency';
  const lat = mp?.lat || 22.0 + Math.random() * 5;
  const lng = mp?.lng || 78.0 + Math.random() * 5;
  generateMpData(mpId, state, constituency, lat, lng);
}

// Simple in-memory response cache: mpId → { payload, ts }
const _fullCache = new Map();
const FULL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET /api/mp/:mpId/full — Combined endpoint: overview + projects + proposals + alerts in ONE request
router.get('/:mpId/full', async (req, res) => {
  const { mpId } = req.params;

  // Serve from cache if fresh
  const hit = _fullCache.get(mpId);
  if (hit && Date.now() - hit.ts < FULL_CACHE_TTL) {
    return res.json(hit.payload);
  }

  let mp = db.getById('mps', mpId);
  if (!mp) return res.status(404).json({ error: 'MP not found' });

  ensureMpDataExists(mpId, mp);

  const projects = db.query('projects', p => p.mpId === mpId);
  const proposals = db.query('proposals', p => p.mpId === mpId);

  const agencies = db.getAll('agencies');

  const enrichedProjects = projects.map(p => ({
    ...p,
    agencyName: agencies.find(a => a.id === p.agencyId)?.name || p.agencyId,
    riskLevel: p.riskScore >= 70 ? 'HIGH' : p.riskScore >= 40 ? 'MEDIUM' : 'LOW',
    forecast: forecastProject(p),
  }));

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalDisbursed = projects.reduce((s, p) => s + p.disbursed, 0);
  const utilizationRate = mp.utilizationPercentage || Math.round((totalDisbursed / (totalBudget || 1)) * 100);

  const alerts = [];
  projects.forEach(p => {
    if (p.riskScore >= 70) alerts.push({ type: 'HIGH_RISK', projectId: p.id, title: p.title, message: `Project "${p.title}" has a risk score of ${p.riskScore}/100`, severity: 'HIGH' });
    if (p.lapseRisk) alerts.push({ type: 'LAPSE_RISK', projectId: p.id, title: p.title, message: `Project "${p.title}" is at risk of fund lapse before ${p.endDate}`, severity: 'CRITICAL' });
    if (p.duplicateFlag) alerts.push({ type: 'DUPLICATE_ALERT', projectId: p.id, title: p.title, message: `Project "${p.title}" may be a duplicate`, severity: 'HIGH' });
  });

  res.json({
    mp,
    stats: {
      totalProjects: mp.completedWorksCount !== undefined ? (mp.completedWorksCount + mp.recommendedWorksCount) : projects.length,
      completedProjects: mp.completedWorksCount !== undefined ? mp.completedWorksCount : projects.filter(p => p.status === 'COMPLETED').length,
      inProgressProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
      stalledProjects: projects.filter(p => p.status === 'STALLED').length,
      totalBudget: mp.totalFunds || totalBudget,
      totalDisbursed: mp.usedFunds || totalDisbursed,
      utilizationRate,
      remainingFunds: mp.unspentAmount !== undefined ? mp.unspentAmount : (mp.totalFunds - mp.usedFunds),
      completionRate: mp.completionRate || 0,
      paymentGapPercentage: mp.paymentGapPercentage || 0,
    },
    projects: enrichedProjects,
    proposals,
    alerts: alerts.sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1)),
  };

  // Store in cache for 5 minutes
  _fullCache.set(mpId, { payload, ts: Date.now() });
  res.json(payload);
});



// GET /api/mp/:mpId/overview - MP dashboard overview
router.get('/:mpId/overview', async (req, res) => {
  const { mpId } = req.params;
  ensureMpDataExists(mpId);
  
  const mp = db.getById('mps', mpId);
  if (!mp) return res.status(404).json({ error: 'MP not found' });

  const projects = db.query('projects', p => p.mpId === mpId);
  const proposals = db.query('proposals', p => p.mpId === mpId);

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalDisbursed = projects.reduce((s, p) => s + p.disbursed, 0);

  // If we have live Supabase data, use its utilization percentage, else calculate from mock
  const utilizationRate = mp.utilizationPercentage || Math.round((totalDisbursed / (totalBudget || 1)) * 100);

  res.json({
    mp,
    stats: {
      totalProjects: mp.completedWorksCount !== undefined ? (mp.completedWorksCount + mp.recommendedWorksCount) : projects.length,
      completedProjects: mp.completedWorksCount !== undefined ? mp.completedWorksCount : projects.filter(p => p.status === 'COMPLETED').length,
      inProgressProjects: mp.recommendedWorksCount !== undefined ? mp.recommendedWorksCount : projects.filter(p => p.status === 'IN_PROGRESS').length,
      stalledProjects: projects.filter(p => p.status === 'STALLED').length,
      totalBudget: mp.totalFunds || totalBudget,
      totalDisbursed: mp.usedFunds || totalDisbursed,
      utilizationRate,
      remainingFunds: mp.unspentAmount !== undefined ? mp.unspentAmount : (mp.totalFunds - mp.usedFunds),
      completionRate: mp.completionRate || 0,
      paymentGapPercentage: mp.paymentGapPercentage || 0,
    },
    proposals: {
      total: proposals.length,
      pending: proposals.filter(p => p.status === 'PENDING').length,
      approved: proposals.filter(p => p.status === 'APPROVED').length,
      rejected: proposals.filter(p => p.status === 'REJECTED').length,
    },
  });
});

// GET /api/mp/:mpId/projects - MP's projects with risk scores
router.get('/:mpId/projects', (req, res) => {
  const { mpId } = req.params;
  ensureMpDataExists(mpId);
  const projects = db.query('projects', p => p.mpId === mpId);
  const agencies = db.getAll('agencies');

  const enriched = projects.map(p => ({
    ...p,
    agencyName: agencies.find(a => a.id === p.agencyId)?.name || p.agencyId,
    riskLevel: p.riskScore >= 70 ? 'HIGH' : p.riskScore >= 40 ? 'MEDIUM' : 'LOW',
    forecast: forecastProject(p),
  }));

  res.json(enriched);
});

// GET /api/mp/:mpId/proposals - MP's proposals
router.get('/:mpId/proposals', (req, res) => {
  const { mpId } = req.params;
  ensureMpDataExists(mpId);
  const proposals = db.query('proposals', p => p.mpId === mpId);
  res.json(proposals);
});

// POST /api/mp/:mpId/proposals - Create new proposal
router.post('/:mpId/proposals', (req, res) => {
  const { mpId } = req.params;
  const mp = db.getById('mps', mpId);
  if (!mp) return res.status(404).json({ error: 'MP not found' });

  const { title, category, estimatedBudget, description, lat, lng } = req.body;
  if (!title || !category || !estimatedBudget) {
    return res.status(400).json({ error: 'title, category, estimatedBudget required' });
  }

  if (estimatedBudget > mp.totalFunds - mp.usedFunds) {
    return res.status(400).json({ error: 'Estimated budget exceeds remaining fund balance' });
  }

  const proposal = db.write('proposals', uuidv4(), {
    mpId,
    title,
    category,
    estimatedBudget: Number(estimatedBudget),
    description: description || '',
    lat: lat || null,
    lng: lng || null,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
    ministerRemarks: null,
  }, mpId, 'PROPOSAL_SUBMIT');

  res.status(201).json({ success: true, proposal });
});

// GET /api/mp/:mpId/alerts - Risk alerts for MP
router.get('/:mpId/alerts', (req, res) => {
  const { mpId } = req.params;
  ensureMpDataExists(mpId);
  const projects = db.query('projects', p => p.mpId === mpId);
  const alerts = [];

  projects.forEach(p => {
    if (p.riskScore >= 70) alerts.push({ type: 'HIGH_RISK', projectId: p.id, title: p.title, message: `Project "${p.title}" has a risk score of ${p.riskScore}/100`, severity: 'HIGH' });
    if (p.lapseRisk) alerts.push({ type: 'LAPSE_RISK', projectId: p.id, title: p.title, message: `Project "${p.title}" is at risk of fund lapse before ${p.endDate}`, severity: 'CRITICAL' });
    if (p.duplicateFlag) alerts.push({ type: 'DUPLICATE_ALERT', projectId: p.id, title: p.title, message: `Project "${p.title}" may be a duplicate of another active project`, severity: 'HIGH' });
  });

  res.json(alerts.sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1)));
});

module.exports = router;
