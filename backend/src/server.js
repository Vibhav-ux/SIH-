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

// ─── Global GET cache middleware (3 min TTL for heavy computed routes) ────────────
const _routeCache = new Map();
const ROUTE_TTL = 3 * 60 * 1000;
function cacheMiddleware(req, res, next) {
  if (req.method !== 'GET') return next();
  const key = req.originalUrl;
  const hit = _routeCache.get(key);
  if (hit && Date.now() - hit.ts < ROUTE_TTL) {
    return res.json(hit.data);
  }
  const origJson = res.json.bind(res);
  res.json = (data) => {
    _routeCache.set(key, { data, ts: Date.now() });
    return origJson(data);
  };
  next();
}

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

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/citizen', citizenRoutes);
app.use('/api/mp', mpRoutes);
app.use('/api/ministry', cacheMiddleware, ministryRoutes);  // cached — heavy O(n) scans
app.use('/api/agency', agencyRoutes);
app.use('/api/ai', cacheMiddleware, aiRoutes);              // cached — riskEngine, forecast, mpScores
app.use('/api/audit', auditRoutes);
app.use('/api/state', cacheMiddleware, stateRoutes);

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

    // ─── Keep-Alive Self-Ping (prevents Render free-tier cold start) ──────────
    // Render spins down after 15 min of inactivity. We ping ourselves every 8 min.
    const PING_URL = process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
      : null;

    if (PING_URL) {
      const https = require('https');
      const http  = require('http');
      const client = PING_URL.startsWith('https') ? https : http;

      setInterval(() => {
        client.get(PING_URL, (res) => {
          console.log(`[KeepAlive] ♻️  Self-ping → ${res.statusCode} (${new Date().toISOString()})`);
        }).on('error', (err) => {
          console.warn(`[KeepAlive] ⚠️  Ping failed: ${err.message}`);
        });
      }, 8 * 60 * 1000); // every 8 minutes

      console.log(`[KeepAlive] ✅ Self-ping active → ${PING_URL} (every 8 min)`);
    } else {
      console.log('[KeepAlive] ℹ️  RENDER_EXTERNAL_URL not set — self-ping skipped (local dev)');
    }
    // ─────────────────────────────────────────────────────────────────────────
  });
});


module.exports = app;

