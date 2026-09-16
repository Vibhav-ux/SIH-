require('dotenv').config({path:'.env.local'});
const {Pool} = require('pg');
const p = new Pool({connectionString:process.env.DATABASE_URL});
p.query("DELETE FROM store_projects").then(()=>console.log('Cleared store_projects')).catch(console.error).finally(()=>p.end());
