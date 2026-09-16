// Neon Persistence Layer — Write-Through Cache
// Loads all data from Neon into memory on startup.
// All writes are mirrored to Neon asynchronously.
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('[Neon] Pool error:', err.message);
});

// ─── Table Definitions ──────────────────────────────────────────────────────
// We use JSONB so any object shape works — no schema migration needed per field

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS mps (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        constituency VARCHAR(255),
        state VARCHAR(255),
        party VARCHAR(100),
        total_funds BIGINT,
        used_funds BIGINT,
        email VARCHAR(255),
        phone VARCHAR(100),
        type VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS store_agencies (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS store_projects (
        id VARCHAR(255) PRIMARY KEY,
        mp_id VARCHAR(255),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS store_proposals (
        id VARCHAR(255) PRIMARY KEY,
        mp_id VARCHAR(255),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS store_complaints (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS store_progress_updates (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS store_community_reports (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS store_external_schemes (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_ledger (
        id SERIAL PRIMARY KEY,
        table_name VARCHAR(100),
        record_id VARCHAR(255),
        action VARCHAR(100),
        actor VARCHAR(255),
        payload JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[Neon] All tables ready');
  } finally {
    client.release();
  }
}

// ─── Table → store key mapping ───────────────────────────────────────────────
const TABLE_MAP = {
  agencies: 'store_agencies',
  projects: 'store_projects',
  proposals: 'store_proposals',
  complaints: 'store_complaints',
  progressUpdates: 'store_progress_updates',
  communityReports: 'store_community_reports',
  externalSchemes: 'store_external_schemes',
};

// ─── Load all data from Neon into the in-memory store ────────────────────────
async function loadAll(store) {
  const client = await pool.connect();
  let totalLoaded = 0;
  try {
    for (const [storeKey, neonTable] of Object.entries(TABLE_MAP)) {
      const result = await client.query(`SELECT id, data FROM ${neonTable}`);
      if (!store[storeKey]) store[storeKey] = {};
      for (const row of result.rows) {
        store[storeKey][row.id] = { ...row.data, id: row.id };
        totalLoaded++;
      }
    }

    // Load MPs from the typed mps table
    const mpsResult = await client.query('SELECT * FROM mps');
    if (!store.mps) store.mps = {};
    for (const row of mpsResult.rows) {
      store.mps[row.id] = {
        id: row.id,
        name: row.name,
        constituency: row.constituency,
        state: row.state,
        party: row.party,
        totalFunds: Number(row.total_funds),
        usedFunds: Number(row.used_funds),
        email: row.email,
        phone: row.phone,
        type: row.type,
      };
      totalLoaded++;
    }

    console.log(`[Neon] Loaded ${totalLoaded} records into memory`);
    return totalLoaded;
  } finally {
    client.release();
  }
}

// ─── Persist a record to Neon (called on every write) ────────────────────────
async function saveRecord(storeKey, id, data) {
  if (storeKey === 'mps') {
    // MPs use the typed table
    pool.query(
      `INSERT INTO mps (id, name, constituency, state, party, total_funds, used_funds, email, phone, type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, constituency=$3, state=$4, party=$5,
         total_funds=$6, used_funds=$7, email=$8, phone=$9, type=$10`,
      [data.id, data.name, data.constituency, data.state, data.party,
       data.totalFunds, data.usedFunds, data.email, data.phone, data.type]
    ).catch(err => console.error('[Neon] MP save error:', err.message));
    return;
  }

  const neonTable = TABLE_MAP[storeKey];
  if (!neonTable) return;

  const extraCols = {};
  if (data.mpId) extraCols.mp_id = data.mpId;
  if (data.projectId) extraCols.project_id = data.projectId;

  const colKeys = Object.keys(extraCols);
  const setClauses = colKeys.map((k, i) => `${k}=$${i + 3}`).join(', ');
  const insertCols = colKeys.length ? `, ${colKeys.join(', ')}` : '';
  const insertVals = colKeys.length ? `, ${colKeys.map((_, i) => `$${i + 3}`).join(', ')}` : '';

  pool.query(
    `INSERT INTO ${neonTable} (id, data${insertCols}) VALUES ($1, $2${insertVals})
     ON CONFLICT (id) DO UPDATE SET data=$2, updated_at=NOW()${setClauses ? ', ' + setClauses : ''}`,
    [id, JSON.stringify(data), ...Object.values(extraCols)]
  ).catch(err => console.error(`[Neon] Save error (${storeKey}/${id}):`, err.message));
}

// ─── Delete a record from Neon ────────────────────────────────────────────────
async function deleteRecord(storeKey, id) {
  const neonTable = TABLE_MAP[storeKey];
  if (!neonTable) return;
  pool.query(`DELETE FROM ${neonTable} WHERE id=$1`, [id])
    .catch(err => console.error(`[Neon] Delete error (${storeKey}/${id}):`, err.message));
}

// ─── Append to audit ledger ───────────────────────────────────────────────────
function appendAudit(entry) {
  pool.query(
    `INSERT INTO audit_ledger (table_name, record_id, action, actor, payload)
     VALUES ($1, $2, $3, $4, $5)`,
    [entry.table, entry.id, entry.action, entry.actor, JSON.stringify(entry.payload)]
  ).catch(err => console.error('[Neon] Audit error:', err.message));
}

// ─── Count total records (to check if DB is empty) ───────────────────────────
async function getTotalRecords() {
  const client = await pool.connect();
  try {
    let total = 0;
    for (const neonTable of Object.values(TABLE_MAP)) {
      const r = await client.query(`SELECT COUNT(*) as c FROM ${neonTable}`);
      total += Number(r.rows[0].c);
    }
    return total;
  } finally {
    client.release();
  }
}

module.exports = { createTables, loadAll, saveRecord, deleteRecord, appendAudit, getTotalRecords, pool };
