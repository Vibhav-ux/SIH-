const express = require('express');
const router = express.Router();
const db = require('../store/db');

// GET /api/ministry/proposals — All proposals with filters
router.get('/proposals', (req, res) => {
  const proposals = db.getAll('proposals');
  const mps = db.getAll('mps');

  const enriched = proposals.map(p => ({
    ...p,
    mpName: mps.find(m => m.id === p.mpId)?.name || p.mpId,
    mpConstituency: mps.find(m => m.id === p.mpId)?.constituency || '',
    mpState: mps.find(m => m.id === p.mpId)?.state || '',
  }));

  const { status } = req.query;
  const filtered = status ? enriched.filter(p => p.status === status) : enriched;

  res.json(filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
});

// POST /api/ministry/proposals/:id/approve — Approve proposal
router.post('/proposals/:id/approve', (req, res) => {
  const proposal = db.getById('proposals', req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  if (proposal.status !== 'PENDING') return res.status(400).json({ error: 'Proposal is not in PENDING state' });

  const { remarks } = req.body;
  const updated = db.write('proposals', proposal.id, {
    ...proposal,
    status: 'APPROVED',
    ministerRemarks: remarks || 'Approved.',
    approvedAt: new Date().toISOString(),
  }, 'ministry', 'PROPOSAL_APPROVE');

  res.json({ success: true, proposal: updated });
});

// POST /api/ministry/proposals/:id/reject — Reject proposal
router.post('/proposals/:id/reject', (req, res) => {
  const proposal = db.getById('proposals', req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  if (proposal.status !== 'PENDING') return res.status(400).json({ error: 'Proposal is not in PENDING state' });

  const { remarks } = req.body;
  if (!remarks) return res.status(400).json({ error: 'Rejection remarks are required' });

  const updated = db.write('proposals', proposal.id, {
    ...proposal,
    status: 'REJECTED',
    ministerRemarks: remarks,
    rejectedAt: new Date().toISOString(),
  }, 'ministry', 'PROPOSAL_REJECT');

  res.json({ success: true, proposal: updated });
});

// GET /api/ministry/overview — Ministry dashboard analytics
router.get('/overview', (req, res) => {
  const projects = db.getAll('projects');
  const proposals = db.getAll('proposals');
  const mps = db.getAll('mps');

  const byState = {};
  projects.forEach(p => {
    if (!byState[p.state]) byState[p.state] = { state: p.state, total: 0, budget: 0, highRisk: 0, completed: 0 };
    byState[p.state].total++;
    byState[p.state].budget += p.budget;
    if (p.riskScore >= 70) byState[p.state].highRisk++;
    if (p.status === 'COMPLETED') byState[p.state].completed++;
  });

  res.json({
    proposals: {
      total: proposals.length,
      pending: proposals.filter(p => p.status === 'PENDING').length,
      approved: proposals.filter(p => p.status === 'APPROVED').length,
      rejected: proposals.filter(p => p.status === 'REJECTED').length,
    },
    projects: {
      total: projects.length,
      stalled: projects.filter(p => p.status === 'STALLED').length,
      highRisk: projects.filter(p => p.riskScore >= 70).length,
      lapseRisk: projects.filter(p => p.lapseRisk).length,
    },
    totalFundsAllocated: mps.reduce((s, m) => s + m.totalFunds, 0),
    totalFundsUsed: mps.reduce((s, m) => s + m.usedFunds, 0),
    byState: Object.values(byState),
  });
});

// GET /api/ministry/projects — All projects (ministry view)
router.get('/projects', (req, res) => {
  const projects = db.getAll('projects');
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

module.exports = router;
