require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS mps (
      id VARCHAR(255) PRIMARY KEY,
      mp_name VARCHAR(255),
      house VARCHAR(100),
      state VARCHAR(100),
      constituency VARCHAR(255),
      allocated_amount NUMERIC,
      total_expenditure NUMERIC,
      utilization_percentage NUMERIC,
      completed_works_count INT,
      recommended_works_count INT,
      completion_rate NUMERIC,
      unspent_amount NUMERIC,
      payment_gap_percentage NUMERIC,
      risk_score NUMERIC
    );
  `;
  try {
    await pool.query(query);
    console.log("Table 'mps' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err.message);
  } finally {
    pool.end();
  }
}
createTable();
