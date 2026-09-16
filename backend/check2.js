require('dotenv').config({path:'.env.local'});
const {Pool} = require('pg');
const p = new Pool({connectionString:process.env.DATABASE_URL});
p.query("SELECT COUNT(*) FROM store_projects WHERE mp_id='6a98d96eddf878e1e6c89a30'").then(r => console.log(r.rows)).catch(console.error).finally(()=>p.end());
