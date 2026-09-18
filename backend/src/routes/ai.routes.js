const express = require('express');
const router = express.Router();
const { scoreProject, getAllRiskScores } = require('../services/riskEngine');
const { detectDuplicates } = require('../services/duplicateDetector');
const { getForecastAll, forecastProject } = require('../services/forecastEngine');
const { getAllCommunityTrustScores, computeCommunityTrust } = require('../services/communityTrust');
const { buildNexusGraph } = require('../services/nexusDetector');
const { detectDoubleFunding } = require('../services/doubleFundingDetector');
const { computeMPScores } = require('../services/mpScorecard');
const { computeTrends } = require('../services/trendService');
const { aggregateAlerts } = require('../services/alertService');
const db = require('../store/db');

// GET /api/ai/risk — All project risk scores
router.get('/risk', (req, res) => {
  const scores = getAllRiskScores();
  res.json(scores.sort((a, b) => b.riskScore - a.riskScore));
});

// GET /api/ai/risk/:projectId — Single project risk score
router.get('/risk/:projectId', (req, res) => {
  const project = db.getById('projects', req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(scoreProject(project));
});

// GET /api/ai/duplicates — All flagged duplicate pairs
router.get('/duplicates', (req, res) => {
  const duplicates = detectDuplicates();
  res.json({ total: duplicates.length, flagged: duplicates });
});

// GET /api/ai/forecast — Fund-lapse forecasts (active projects only)
router.get('/forecast', (req, res) => {
  const forecasts = getForecastAll();
  const lapseRisk = forecasts.filter(f => f.willLapse);
  res.json({
    total: forecasts.length,
    lapseRiskCount: lapseRisk.length,
    criticalCount: lapseRisk.filter(f => f.lapseRiskLevel === 'CRITICAL').length,
    forecasts,
  });
});

// GET /api/ai/community — All community trust scores
router.get('/community', (req, res) => {
  const scores = getAllCommunityTrustScores();
  res.json({
    total: scores.length,
    highMismatch: scores.filter(s => s.mismatchLevel === 'HIGH').length,
    scores: scores.sort((a, b) => b.mismatchScore - a.mismatchScore),
  });
});

// GET /api/ai/community/:projectId
router.get('/community/:projectId', (req, res) => {
  const score = computeCommunityTrust(req.params.projectId);
  if (!score) return res.status(404).json({ error: 'Project not found' });
  res.json(score);
});

// GET /api/ai/nexus — Corruption network graph
router.get('/nexus', (req, res) => {
  const graph = buildNexusGraph();
  res.json(graph);
});

// GET /api/ai/double-funding — Cross-scheme double-funding flags
router.get('/double-funding', (req, res) => {
  const flags = detectDoubleFunding();
  res.json({
    total: flags.length,
    highConfidence: flags.filter(f => f.severity === 'HIGH').length,
    combinedAtRisk: flags.reduce((s, f) => s + f.combinedPublicFunding, 0),
    flags,
  });
});

// GET /api/ai/mp-scores — MP accountability scorecards
router.get('/mp-scores', (req, res) => {
  const scores = computeMPScores();
  const avg = Math.round(scores.reduce((s, m) => s + m.accountabilityScore, 0) / scores.length);
  res.json({
    total: scores.length,
    nationalAverage: avg,
    gradeDistribution: {
      A: scores.filter(s => s.grade === 'A').length,
      B: scores.filter(s => s.grade === 'B').length,
      C: scores.filter(s => s.grade === 'C').length,
      D: scores.filter(s => s.grade === 'D').length,
      F: scores.filter(s => s.grade === 'F').length,
    },
    scores,
  });
});

// GET /api/ai/trends — Trend analysis data
router.get('/trends', (req, res) => {
  const trends = computeTrends();
  res.json(trends);
});

// GET /api/ai/alerts — Centralized alerts from all detection services
let _alertsCache = null;
let _alertsCacheTs = 0;
const ALERTS_TTL = 2 * 60 * 1000; // 2 minutes

router.get('/alerts', (req, res) => {
  const now = Date.now();
  if (_alertsCache && (now - _alertsCacheTs) < ALERTS_TTL) {
    return res.json(_alertsCache);
  }
  const alerts = aggregateAlerts();
  _alertsCache = alerts;
  _alertsCacheTs = now;
  res.json(alerts);
});

module.exports = router;
