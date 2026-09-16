const express = require('express');
const cors = require('cors');
const supabasePersist = require('./store/supabasePersist');
const db = require('./store/db');
const { seedAll } = require('./data/seed');

// Routes
const citizenRoutes = require('./routes/citizen.routes');
const mpRoutes = require('./routes/mp.routes');
const ministryRoutes = require('./routes/ministry.routes');
const agencyRoutes = require('./routes/agency.routes');
const aiRoutes = require('./routes/ai.routes');
const auditRoutes = require('./routes/audit.routes');
const stateRoutes = require('./routes/state.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ─── Startup: Create tables, load from Supabase, seed if empty ──────────────
async function startup() {
  try {
    await supabasePersist.createTables();
    const loaded = await supabasePersist.loadAll(db.store);
    console.log(`[Server] Loaded ${loaded} records from Supabase`);
    // Always run seedAll — it only seeds data that is missing (isSeeded check)
    // This ensures agencies, proposals, complaints are always available
    seedAll();
  } catch (err) {
    console.error('[Server] Startup error:', err.message);
    seedAll();
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/citizen', citizenRoutes);
app.use('/api/mp', mpRoutes);
app.use('/api/ministry', ministryRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/state', stateRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'MPLAD Sentinel API',
    mps: Object.keys(db.store.mps || {}).length,
    projects: Object.keys(db.store.projects || {}).length,
    agencies: Object.keys(db.store.agencies || {}).length,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server after loading data from Supabase
startup().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 MPLAD Sentinel API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`👥 Real MPs: http://localhost:${PORT}/api/mp/all`);
    console.log(`🔗 Audit Ledger: http://localhost:${PORT}/api/audit/ledger\n`);
  });
});

module.exports = app;

