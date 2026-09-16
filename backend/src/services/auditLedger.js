const crypto = require('crypto');

// ─── Hash-Chained Audit Ledger ────────────────────────────────────────────────
// Each entry: { index, timestamp, actor, action, table, id, payload, prev_hash, hash }
// hash = SHA256(prev_hash + timestamp + actor + action + JSON(payload))

const ledger = [];

function computeHash(prevHash, timestamp, actor, action, payload) {
  const content = `${prevHash}|${timestamp}|${actor}|${action}|${JSON.stringify(payload)}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

function append({ table, id, action, actor, payload }) {
  const index = ledger.length;
  const timestamp = new Date().toISOString();
  const prevHash = index === 0 ? '0'.repeat(64) : ledger[index - 1].hash;
  const hash = computeHash(prevHash, timestamp, actor, action, payload);

  ledger.push({ index, timestamp, actor, action, table, recordId: id, payload, prev_hash: prevHash, hash });
  return hash;
}

function getAll() {
  return ledger;
}

function verify() {
  if (ledger.length === 0) return { valid: true, total: 0, message: 'Ledger is empty.' };

  for (let i = 0; i < ledger.length; i++) {
    const entry = ledger[i];
    const expectedPrevHash = i === 0 ? '0'.repeat(64) : ledger[i - 1].hash;
    const expectedHash = computeHash(
      expectedPrevHash,
      entry.timestamp,
      entry.actor,
      entry.action,
      entry.payload
    );

    if (entry.prev_hash !== expectedPrevHash) {
      return {
        valid: false,
        total: ledger.length,
        broken_at: i,
        message: `Chain broken at entry #${i}: prev_hash mismatch.`,
        entry,
      };
    }

    if (entry.hash !== expectedHash) {
      return {
        valid: false,
        total: ledger.length,
        broken_at: i,
        message: `Chain broken at entry #${i}: hash mismatch — entry may have been tampered.`,
        entry,
      };
    }
  }

  return { valid: true, total: ledger.length, message: 'All entries verified. Ledger is intact.' };
}

module.exports = { append, getAll, verify };
