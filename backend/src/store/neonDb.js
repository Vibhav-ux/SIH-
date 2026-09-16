// Neon PostgreSQL connection pool
// Used alongside the in-memory store for real MP data from CSVs
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Neon pool error:', err.message);
});

// Normalize a Neon MP row to the app-expected shape
function normalizeRow(row) {
  return {
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
}

async function getAllMps({ state, type, search, limit = 100, offset = 0 } = {}) {
  let query = 'SELECT * FROM mps WHERE 1=1';
  const params = [];

  if (state) {
    params.push(state);
    query += ` AND LOWER(state) = LOWER($${params.length})`;
  }
  if (type) {
    params.push(type);
    query += ` AND LOWER(type) = LOWER($${params.length})`;
  }
  if (search) {
    params.push('%' + search + '%');
    query += ` AND (LOWER(name) LIKE LOWER($${params.length}) OR LOWER(constituency) LIKE LOWER($${params.length}))`;
  }

  query += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows.map(normalizeRow);
}

async function getMpById(id) {
  const result = await pool.query('SELECT * FROM mps WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return normalizeRow(result.rows[0]);
}

async function getMpStats() {
  const result = await pool.query(`
    SELECT 
      type,
      COUNT(*) as count,
      SUM(total_funds) as total_funds,
      SUM(used_funds) as used_funds,
      AVG(total_funds) as avg_funds
    FROM mps
    GROUP BY type
  `);
  return result.rows;
}

async function getStates() {
  const result = await pool.query('SELECT DISTINCT state FROM mps WHERE state IS NOT NULL ORDER BY state');
  return result.rows.map(r => r.state);
}

module.exports = { getAllMps, getMpById, getMpStats, getStates, pool };
