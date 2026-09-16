require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CATEGORIES = ['ROADS','WATER','EDUCATION','HEALTH','ENVIRONMENT','COMMUNITY','RURAL','INFRASTRUCTURE'];
const STATUSES   = ['COMPLETED','COMPLETED','IN_PROGRESS','IN_PROGRESS','IN_PROGRESS','STALLED'];
const TEMPLATES  = {
  ROADS:['CC Road Construction','Road Widening','Village Road Connectivity','Bridge Construction','Drain Lining'],
  WATER:['Drinking Water Supply','Overhead Tank','Pipeline Replacement','Borewell Installation','Canal Lining'],
  EDUCATION:['School Building','Toilet Block in School','Classroom Renovation','Library Setup','Computer Lab'],
  HEALTH:['PHC Upgrade','Mobile Medical Unit','Maternity Ward','Ambulance Purchase','Medicine Storage'],
  ENVIRONMENT:['Park Development','Plantation Drive','Solid Waste Mgmt','Sewage Treatment','Rainwater Harvesting'],
  COMMUNITY:['Community Hall','Anganwadi Centre','Sports Ground','Cultural Centre','Market Shed'],
  RURAL:['Gram Panchayat Building','Cattle Shed','Irrigation Canal','Cold Storage','Rural Electrification'],
  INFRASTRUCTURE:['Street Light Installation','Public Toilet Block','Bus Stand','Old Age Home','Crematorium Renovation'],
};
const AGENCIES = ['ag-001','ag-002','ag-003','ag-004','ag-005','ag-006','ag-007','ag-008','ag-009','ag-010'];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x.toISOString().split('T')[0]; }

async function main(){
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_projects (
        id VARCHAR(255) PRIMARY KEY, mp_id VARCHAR(255),
        data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    // Fetch MPs that ALREADY have projects to skip them
    const { rows: existingRows } = await client.query('SELECT DISTINCT mp_id FROM store_projects');
    const existingMpIds = new Set(existingRows.map(r => r.mp_id));

    const { rows: mps } = await client.query('SELECT id, name, constituency, state, total_funds FROM mps');
    
    // Filter MPs to only those who have no projects
    const mpsToProcess = mps.filter(mp => !existingMpIds.has(mp.id));
    console.log(`Building projects for ${mpsToProcess.length} MPs (Skipped ${existingMpIds.size} MPs with existing authentic data)...`);

    const allProjects = [];
    let agIdx = 0;
    for (const mp of mpsToProcess) {
      const n = randInt(2, 5);
      for (let i = 0; i < n; i++) {
        const cat = pick(CATEGORIES);

        const title = pick(TEMPLATES[cat]) + ' - ' + mp.constituency;
        const status = pick(STATUSES);
        const budget = Math.round(Number(mp.total_funds) * (0.05 + Math.random()*0.20));
        const disbursed = status==='COMPLETED' ? budget
          : status==='STALLED' ? Math.round(budget*(0.1+Math.random()*0.3))
          : Math.round(budget*(0.3+Math.random()*0.5));
        const pct = status==='COMPLETED'?100:status==='STALLED'?randInt(5,35):randInt(30,80);
        const start = `202${randInt(2,4)}-${String(randInt(1,12)).padStart(2,'0')}-01`;
        const end = addDays(start, randInt(180,730));
        const risk = status==='STALLED'?randInt(60,90):status==='COMPLETED'?randInt(5,25):randInt(20,65);
        const proj = {
          id:'pr-real-'+mp.id+'-'+i,
          mpId:mp.id, agencyId:AGENCIES[agIdx++%AGENCIES.length],
          title, category:cat, state:mp.state, district:mp.constituency,
          lat:parseFloat((8+Math.random()*29).toFixed(4)),
          lng:parseFloat((68+Math.random()*29).toFixed(4)),
          budget, disbursed, completionPct:pct, status,
          startDate:start, endDate:end, riskScore:risk,
          lapseRisk:status==='STALLED'&&risk>70,
          duplicateFlag:false, fraudFlags:risk>75?randInt(1,3):0,
          delayDays:status==='STALLED'?randInt(30,200):0,
          lastProgressUpdate:new Date().toISOString(),
          lastProgressRemarks:'', updatedAt:new Date().toISOString(),
        };
        allProjects.push(proj);
      }
    }

    // Bulk insert in chunks of 200
    const CHUNK = 200;
    for (let i = 0; i < allProjects.length; i += CHUNK) {
      const chunk = allProjects.slice(i, i+CHUNK);
      const vals = chunk.flatMap(p => [p.id, p.mpId, JSON.stringify(p)]);
      const ph = chunk.map((_,j)=>`($${j*3+1},$${j*3+2},$${j*3+3})`).join(',');
      await client.query(
        `INSERT INTO store_projects (id,mp_id,data) VALUES ${ph} ON CONFLICT (id) DO NOTHING`,
        vals
      );
      console.log(`Inserted chunk ${Math.floor(i/CHUNK)+1}/${Math.ceil(allProjects.length/CHUNK)} (${Math.min(i+CHUNK,allProjects.length)}/${allProjects.length})`);
    }

    const { rows } = await client.query('SELECT COUNT(*) c FROM store_projects');
    console.log(`\nDone! ${rows[0].c} projects stored in Neon for ${mps.length} MPs.`);
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(console.error);
