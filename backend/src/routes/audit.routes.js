const express = require('express');
const router = express.Router();
const auditLedger = require('../services/auditLedger');

// GET /api/audit/ledger — Full audit ledger
router.get('/ledger', (req, res) => {
  const entries = auditLedger.getAll();
  const { limit, offset } = req.query;
  const start = Number(offset) || 0;
  const end = limit ? start + Number(limit) : entries.length;

  res.json({
    total: entries.length,
    offset: start,
    limit: limit ? Number(limit) : entries.length - start,
    entries: entries.slice(start, end).reverse(), // most recent first
  });
});

// GET /api/audit/verify — Chain integrity check
router.get('/verify', (req, res) => {
  const result = auditLedger.verify();
  res.json({
    ...result,
    verifiedAt: new Date().toISOString(),
  });
});

// GET /api/audit/ledger/:table — Filter ledger by table
router.get('/ledger/:table', (req, res) => {
  const entries = auditLedger.getAll().filter(e => e.table === req.params.table);
  res.json({ total: entries.length, entries: entries.reverse() });
});

module.exports = router;
