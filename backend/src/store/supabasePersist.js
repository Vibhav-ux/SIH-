// Supabase Persistence Layer — Drop-in replacement for neonPersist.js
// Same function signatures — everything else in the codebase stays unchanged.
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // fallback for Railway/production
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_KEY not set — running without Supabase persistence.');
}

const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : { from: () => ({ select: () => ({ data: [], error: null }), insert: () => ({}), delete: () => ({}) }) };


// ─── Table → store key mapping ───────────────────────────────────────────────
const TABLE_MAP = {
  agencies:          'store_agencies',
  projects:          'store_projects',
  proposals:         'store_proposals',
  complaints:        'store_complaints',
  progressUpdates:   'store_progress_updates',
  communityReports:  'store_community_reports',
  externalSchemes:   'store_external_schemes',
};

// ─── Create all tables via Supabase RPC (runs raw SQL) ───────────────────────
// Supabase doesn't support direct DDL from the client — tables must be created
// via the Supabase Dashboard SQL editor or via migrations.
// This function is kept for API compatibility but is a no-op in Supabase.
async function createTables() {
  console.log('[Supabase] Using Supabase as persistence layer. Tables must be created via Supabase Dashboard.');
  return true;
}

// ─── Load all data from Supabase into the in-memory store ────────────────────
async function loadAll(store) {
  let totalLoaded = 0;

  // Only load non-seed tables from Supabase.
  // projects/proposals/mps come from seeded-data.json — loading old Supabase
  // versions would overwrite with stale data (old mpId formats like "mp-005").
  const LOAD_FROM_SUPABASE = ['agencies', 'complaints', 'communityReports', 'externalSchemes', 'progressUpdates'];

  const loadPromises = Object.entries(TABLE_MAP)
    .filter(([storeKey]) => LOAD_FROM_SUPABASE.includes(storeKey))
    .map(async ([storeKey, supabaseTable]) => {

    try {
      const { data, error } = await supabase
        .from(supabaseTable)
        .select('id, data');

      if (error) {
        console.warn(`[Supabase] Could not load ${supabaseTable}: ${error.message}`);
        if (!store[storeKey]) store[storeKey] = {};
        return 0;
      }

      if (!store[storeKey]) store[storeKey] = {};
      let count = 0;
      for (const row of (data || [])) {
        store[storeKey][row.id] = { ...row.data, id: row.id };
        count++;
      }
      return count;
    } catch (err) {
      console.warn(`[Supabase] Load error for ${supabaseTable}:`, err.message);
      return 0;
    }
  });

  const counts = await Promise.all(loadPromises);
  totalLoaded += counts.reduce((a, b) => a + b, 0);

  // NOTE: MPs are NOT loaded from Supabase — they come from seeded-data.json
  // which uses the correct LS-001/RS-001 ID format.

  console.log(`[Supabase] Loaded ${totalLoaded} records into memory`);
  return totalLoaded;
}

// ─── Persist a record to Supabase (fire-and-forget) ──────────────────────────
async function saveRecord(storeKey, id, data) {
  // Skip all writes if persistence is disabled (e.g. Vercel cold start)
  if (process.env.DISABLE_SUPABASE_PERSIST === 'true') return;

  if (storeKey === 'mps') {
    supabase.from('mps').upsert({
      id: data.id, mp_name: data.name, constituency: data.constituency,
      state: data.state, party: data.party, house: data.type || data.house,
      allocated_amount: data.totalFunds, total_expenditure: data.usedFunds,
    }, { onConflict: 'id' }).then(() => {}).catch(() => {});
    return;
  }

  const supabaseTable = TABLE_MAP[storeKey];
  if (!supabaseTable) return;

  const record = {
    id, data: JSON.stringify(data),
    updated_at: new Date().toISOString(),
  };
  if (data.mpId)      record.mp_id = data.mpId;
  if (data.projectId) record.project_id = data.projectId;

  supabase.from(supabaseTable)
    .upsert(record, { onConflict: 'id' })
    .then(() => {}).catch(() => {});
}

// ─── Delete a record from Supabase ───────────────────────────────────────────
function deleteRecord(storeKey, id) {
  if (process.env.DISABLE_SUPABASE_PERSIST === 'true') return;
  const supabaseTable = TABLE_MAP[storeKey];
  if (!supabaseTable) return;
  supabase.from(supabaseTable).delete().eq('id', id).then(() => {}).catch(() => {});
}

// ─── Append to audit ledger ───────────────────────────────────────────────────
function appendAudit(entry) {
  if (process.env.DISABLE_SUPABASE_PERSIST === 'true') return;
  supabase.from('audit_ledger').insert({
    table_name: entry.table, record_id: entry.id,
    action: entry.action, actor: entry.actor, payload: entry.payload,
  }).then(() => {}).catch(() => {});
}

// ─── Count total records (to check if DB is empty) ───────────────────────────
async function getTotalRecords() {
  let total = 0;
  for (const supabaseTable of Object.values(TABLE_MAP)) {
    try {
      const { count, error } = await supabase
        .from(supabaseTable)
        .select('id', { count: 'exact', head: true });
      if (!error) total += count || 0;
    } catch (err) {
      // Table may not exist yet, skip
    }
  }
  return total;
}

module.exports = { createTables, loadAll, saveRecord, deleteRecord, appendAudit, getTotalRecords, supabase };
