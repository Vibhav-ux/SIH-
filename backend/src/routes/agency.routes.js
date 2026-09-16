const express = require('express');
const router = express.Router();
const db = require('../store/db');
const { computeAgencyScores, getAgencyById } = require('../services/agencyTrust');

// GET /api/agency/trust — All agency trust scores
router.get('/trust', (req, res) => {
  const scores = computeAgencyScores();
  res.json(scores);
});

// GET /api/agency/:agencyId — Single agency profile
router.get('/:agencyId', (req, res) => {
  const agency = getAgencyById(req.params.agencyId);
  if (!agency) return res.status(404).json({ error: 'Agency not found' });

  const projects = db.query('projects', p => p.agencyId === req.params.agencyId);
  const mps = db.getAll('mps');

  res.json({
    ...agency,
    projects: projects.map(p => ({
      ...p,
      mpName: mps.find(m => m.id === p.mpId)?.name || p.mpId,
      riskLevel: p.riskScore >= 70 ? 'HIGH' : p.riskScore >= 40 ? 'MEDIUM' : 'LOW',
    })),
  });
});

// POST /api/agency/:agencyId/progress/:projectId — Submit progress update
router.post('/:agencyId/progress/:projectId', (req, res) => {
  const project = db.getById('projects', req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.agencyId !== req.params.agencyId) return res.status(403).json({ error: 'Agency not assigned to this project' });

  const { completionPct, remarks, disbursedAmount } = req.body;
  if (completionPct === undefined) return res.status(400).json({ error: 'completionPct required' });

  const newStatus = completionPct >= 100 ? 'COMPLETED' : project.status === 'STALLED' ? 'IN_PROGRESS' : project.status;
  const newDisbursed = disbursedAmount !== undefined ? Number(disbursedAmount) : project.disbursed;

  const updatedProject = db.write('projects', project.id, {
    ...project,
    completionPct: Math.min(100, Number(completionPct)),
    status: newStatus,
    disbursed: newDisbursed,
    lastProgressUpdate: new Date().toISOString(),
    lastProgressRemarks: remarks || '',
  }, req.params.agencyId, 'PROGRESS_UPDATE');

  // Also log in progressUpdates table
  const progressRecord = db.write('progressUpdates', undefined, {
    projectId: project.id,
    agencyId: req.params.agencyId,
    completionPct: Number(completionPct),
    disbursedAmount: newDisbursed,
    remarks: remarks || '',
    recordedAt: new Date().toISOString(),
  }, req.params.agencyId, 'PROGRESS_UPDATE');

  res.json({ success: true, project: updatedProject, progressRecord });
});

// GET /api/agency/:agencyId/projects — Agency's projects
router.get('/:agencyId/projects', (req, res) => {
  const projects = db.query('projects', p => p.agencyId === req.params.agencyId);
  const mps = db.getAll('mps');

  res.json(projects.map(p => ({
    ...p,
    mpName: mps.find(m => m.id === p.mpId)?.name || p.mpId,
    riskLevel: p.riskScore >= 70 ? 'HIGH' : p.riskScore >= 40 ? 'MEDIUM' : 'LOW',
  })));
});

module.exports = router;
