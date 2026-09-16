const { v4: uuidv4 } = require('uuid');
const auditLedger = require('../services/auditLedger');
const supabasePersist = require('./supabasePersist');

// ─── In-Memory Data Store ─────────────────────────────────────────────────────
const store = {
  mps: {},
  agencies: {},
  projects: {},
  proposals: {},
  complaints: {},
  progressUpdates: {},
  communityReports: {},
  externalSchemes: {},
};

let seeded = false;
function markSeeded() { seeded = true; }
function isSeeded() { return seeded; }

// ─── Generic Read (sync — served from memory) ─────────────────────────────────
function getAll(table) {
  return Object.values(store[table] || {});
}

function getById(table, id) {
  return (store[table] || {})[id] || null;
}

function query(table, predicate) {
  return Object.values(store[table] || {}).filter(predicate);
}

// ─── Audited Write (memory + async Supabase persist) ────────────────────
function write(table, id, data, actor = 'system', action = 'WRITE') {
  const record = { ...data, id: id || uuidv4(), updatedAt: new Date().toISOString() };
  if (!store[table]) store[table] = {};
  store[table][record.id] = record;

  // Persist to audit log
  auditLedger.append({ table, id: record.id, action, actor, payload: record });
  supabasePersist.appendAudit({ table, id: record.id, action, actor, payload: record });

  // Persist to Supabase asynchronously (fire-and-forget)
  supabasePersist.saveRecord(table, record.id, record);

  return record;
}

// ─── Silent Write (no audit — for seeding) ────────────────────────────────────
function seed(table, id, data) {
  if (!store[table]) store[table] = {};
  const record = { ...data, id };
  store[table][id] = record;

  // Also persist to Supabase silently
  supabasePersist.saveRecord(table, id, record);

  return record;
}

// ─── Delete ───────────────────────────────────────────────────────────────────
function remove(table, id, actor = 'system') {
  if (store[table] && store[table][id]) {
    auditLedger.append({ table, id, action: 'DELETE', actor, payload: null });
    supabasePersist.deleteRecord(table, id);
    delete store[table][id];
    return true;
  }
  return false;
}

module.exports = { store, getAll, getById, query, write, seed, remove, markSeeded, isSeeded };
