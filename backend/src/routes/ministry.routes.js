const express = require('express');
const router = express.Router();
const db = require('../store/db');

function buildMpMap() {
  const m = {};
  db.getAll('mps').forEach(mp => { m[mp.id] = mp; });
  return m;
}
function buildAgencyMap() {
  const m = {};
  db.getAll('agencies').forEach(a => { m[a.id] = a; });
  return m;
}

// GET /api/ministry/proposals
router.get('/proposals', (req, res) => {
  const proposals = db.getAll('proposals');
  const mpMap = buildMpMap();
  const { status } = req.query;
  let enriched = proposals.map(p => {
    const mp = mpMap[p.mpId] || {};
    return { ...p, mpName: mp.name || p.mpId, mpConstituency: mp.constituency || '', mpState: mp.state || '' };
  });
  if (status) enriched = enriched.filter(p => p.status === status);
  res.json(enriched.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
});

// POST /api/ministry/proposals/:id/approve
router.post('/proposals/:id/approve', (req, res) => {
  const proposal = db.getById('proposals', req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  if (proposal.status !== 'PENDING') return res.status(400).json({ error: 'Proposal is not in PENDING state' });
  const updated = db.write('proposals', proposal.id, {
    ...proposal, status: 'APPROVED',
    ministerRemarks: req.body.remarks || 'Approved.',
    approvedAt: new Date().toISOString(),
  }, 'ministry', 'PROPOSAL_APPROVE');
  res.json({ success: true, proposal: updated });
});

// POST /api/ministry/proposals/:id/reject
router.post('/proposals/:id/reject', (req, res) => {
  const proposal = db.getById('proposals', req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  if (proposal.status !== 'PENDING') return res.status(400).json({ error: 'Proposal is not in PENDING state' });
  if (!req.body.remarks) return res.status(400).json({ error: 'Rejection remarks are required' });
  const updated = db.write('proposals', proposal.id, {
    ...proposal, status: 'REJECTED',
    ministerRemarks: req.body.remarks,
    rejectedAt: new Date().toISOString(),
  }, 'ministry', 'PROPOSAL_REJECT');
  res.json({ success: true, proposal: updated });
});

// GET /api/ministry/overview — single-pass aggregation (no .filter() chains)
router.get('/overview', (req, res) => {
  const projects = db.getAll('projects');
  const proposals = db.getAll('proposals');
  const mps = db.getAll('mps');
  const byState = {};
  let pStalled = 0, pHighRisk = 0, pLapse = 0;
  let propPending = 0, propApproved = 0, propRejected = 0;
  let totalFunds = 0, totalUsed = 0;

  for (const p of projects) {
    if (p.status === 'STALLED') pStalled++;
    if (p.riskScore >= 70) pHighRisk++;
    if (p.lapseRisk) pLapse++;
    const s = p.state || 'Unknown';
    if (!byState[s]) byState[s] = { state: s, total: 0, budget: 0, highRisk: 0, completed: 0 };
    byState[s].total++;
    byState[s].budget += p.budget || 0;
    if (p.riskScore >= 70) byState[s].highRisk++;
    if (p.status === 'COMPLETED') byState[s].completed++;
  }
  for (const p of proposals) {
    if (p.status === 'PENDING') propPending++;
    else if (p.status === 'APPROVED') propApproved++;
    else if (p.status === 'REJECTED') propRejected++;
  }
  for (const m of mps) { totalFunds += m.totalFunds || 0; totalUsed += m.usedFunds || 0; }

  res.json({
    proposals: { total: proposals.length, pending: propPending, approved: propApproved, rejected: propRejected },
    projects: { total: projects.length, stalled: pStalled, highRisk: pHighRisk, lapseRisk: pLapse },
    totalFundsAllocated: totalFunds,
    totalFundsUsed: totalUsed,
    byState: Object.values(byState),
  });
});

// GET /api/ministry/projects — O(1) lookups via maps
router.get('/projects', (req, res) => {
  const projects = db.getAll('projects');
  const mpMap = buildMpMap();
  const agMap = buildAgencyMap();
  const enriched = projects.map(p => ({
    ...p,
    mpName: mpMap[p.mpId]?.name || p.mpId,
    agencyName: agMap[p.agencyId]?.name || p.agencyId,
    riskLevel: p.riskScore >= 70 ? 'HIGH' : p.riskScore >= 40 ? 'MEDIUM' : 'LOW',
  }));
  res.json(enriched);
});

module.exports = router;
