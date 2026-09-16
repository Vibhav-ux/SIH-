require('dotenv').config({path:'.env.local'});
const {Pool} = require('pg');
const p = new Pool({connectionString:process.env.DATABASE_URL});
p.query("SELECT * FROM store_projects WHERE id='pr-001'").then(r => console.log(r.rows)).catch(console.error).finally(()=>p.end());
