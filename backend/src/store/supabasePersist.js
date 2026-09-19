// Supabase Persistence Layer
// Lazy-initialized: env vars are read at RUNTIME (first function call),
// never at module load time — prevents Railway build-time secret errors.

let _supabase = null;

function getClient() {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[Supabase] No credentials — running in-memory only (no persistence).');
    // Return a no-op client
    _supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({}),
        insert: () => Promise.resolve({}),
        delete: () => ({ eq: () => Promise.resolve({}) }),
      }),
    };
    return _supabase;
  }

  const { createClient } = require('@supabase/supabase-js');
  _supabase = createClient(url, key);
  console.log('[Supabase] Client initialized ✅');
  return _supabase;
}

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

// ─── No-op: tables created via Supabase Dashboard ────────────────────────────
async function createTables() {
  console.log('[Supabase] Tables managed via Supabase Dashboard.');
  return true;
}

// ─── Load all data from Supabase into the in-memory store ────────────────────
async function loadAll(store) {
  const supabase = getClient();
  let totalLoaded = 0;

  const LOAD_FROM_SUPABASE = ['agencies', 'complaints', 'communityReports', 'externalSchemes', 'progressUpdates'];

  const loadPromises = Object.entries(TABLE_MAP)
    .filter(([storeKey]) => LOAD_FROM_SUPABASE.includes(storeKey))
    .map(async ([storeKey, supabaseTable]) => {
      try {
        const { data, error } = await supabase.from(supabaseTable).select('id, data');
        if (error) {
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
  totalLoaded = counts.reduce((a, b) => a + b, 0);
  console.log(`[Supabase] Loaded ${totalLoaded} records into memory`);
  return totalLoaded;
}

// ─── Persist a record to Supabase (fire-and-forget) ──────────────────────────
async function saveRecord(storeKey, id, data) {
  if (process.env.DISABLE_SUPABASE_PERSIST === 'true') return;
  const supabase = getClient();

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
  const supabase = getClient();
  const supabaseTable = TABLE_MAP[storeKey];
  if (!supabaseTable) return;
  supabase.from(supabaseTable).delete().eq('id', id).then(() => {}).catch(() => {});
}

// ─── Append to audit ledger ───────────────────────────────────────────────────
function appendAudit(entry) {
  if (process.env.DISABLE_SUPABASE_PERSIST === 'true') return;
  const supabase = getClient();
  supabase.from('audit_ledger').insert({
    table_name: entry.table, record_id: entry.id,
    action: entry.action, actor: entry.actor, payload: entry.payload,
  }).then(() => {}).catch(() => {});
}

// ─── Count total records ──────────────────────────────────────────────────────
async function getTotalRecords() {
  const supabase = getClient();
  let total = 0;
  for (const supabaseTable of Object.values(TABLE_MAP)) {
    try {
      const { count, error } = await supabase
        .from(supabaseTable)
        .select('id', { count: 'exact', head: true });
      if (!error) total += count || 0;
    } catch (err) { /* skip */ }
  }
  return total;
}

module.exports = { createTables, loadAll, saveRecord, deleteRecord, appendAudit, getTotalRecords, supabase: null };
