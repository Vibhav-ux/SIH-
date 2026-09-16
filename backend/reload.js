require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function reloadAndCheck() {
  try {
    await pool.query("NOTIFY pgrst, 'reload schema';");
    console.log("Notified PostgREST to reload schema.");
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}
reloadAndCheck();
