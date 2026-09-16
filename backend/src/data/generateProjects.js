// generateProjects.js — generates realistic projects for ALL MPs in Supabase
// Run once: node backend/src/data/generateProjects.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const CATEGORIES = ['ROADS', 'WATER', 'EDUCATION', 'HEALTH', 'ENVIRONMENT', 'COMMUNITY', 'RURAL', 'INFRASTRUCTURE'];
const STATUSES   = ['COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'STALLED'];
const TEMPLATES  = {
  ROADS:         ['CC Road Construction', 'Road Widening', 'Village Road Connectivity', 'Bridge Construction', 'Drain Lining', 'Highway Stretch Repair'],
  WATER:         ['Drinking Water Supply', 'Overhead Tank Construction', 'Pipeline Replacement', 'Borewell Installation', 'Canal Lining', 'Water ATM Network'],
  EDUCATION:     ['School Building Construction', 'Toilet Block in School', 'Classroom Renovation', 'Digital Library Setup', 'Computer Lab', 'Anganwadi Centre'],
  HEALTH:        ['PHC Upgrade', 'Mobile Medical Unit', 'Maternity Ward', 'Medicine Storage', 'Community Health Centre', 'Telemedicine Kiosk'],
  ENVIRONMENT:   ['Park Development', 'Plantation Drive', 'Solid Waste Management Plant', 'Sewage Treatment Plant', 'Rainwater Harvesting'],
  COMMUNITY:     ['Community Hall', 'Sports Ground', 'Cultural Centre', 'Market Shed', 'Women Resource Centre', 'Skill Development Centre'],
  RURAL:         ['Gram Panchayat Building', 'Irrigation Canal', 'Cold Storage', 'Rural Electrification', 'Cattle Shed Renovation'],
  INFRASTRUCTURE:['Street Light Installation', 'Public Toilet Block', 'Bus Stand Construction', 'Old Age Home', 'Parking Complex'],
};
const AGENCY_IDS = ['ag-001','ag-002','ag-003','ag-004','ag-005','ag-006','ag-007','ag-008','ag-009','ag-010','ag-011','ag-012','ag-013','ag-014','ag-015'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; }

async function main() {
  console.log('🔗 Connecting to Supabase...');

  // Fetch all MPs from Supabase
  const { data: mps, error: mpError } = await supabase.from('mps').select('id, mp_name, constituency, state, allocated_amount');
  if (mpError) { console.error('Failed to fetch MPs:', mpError.message); process.exit(1); }
  console.log(`📋 Found ${mps.length} MPs in Supabase`);

  // Find which MPs already have projects (to avoid duplicates)
  const { data: existingRows, error: existError } = await supabase
    .from('store_projects')
    .select('mp_id');
  
  const existingMpIds = new Set((existingRows || []).map(r => r.mp_id));
  const mpsToProcess = mps.filter(mp => !existingMpIds.has(mp.id));
  console.log(`🏗️ Generating projects for ${mpsToProcess.length} MPs (${existingMpIds.size} already have projects)...`);

  if (mpsToProcess.length === 0) {
    console.log('✅ All MPs already have projects. Nothing to do!');
    return;
  }

  const allProjects = [];
  let agIdx = 0;

  for (const mp of mpsToProcess) {
    const n = randInt(3, 7); // 3-7 projects per MP
    const allocation = Number(mp.allocated_amount) || 2500000;

    for (let i = 0; i < n; i++) {
      const cat = pick(CATEGORIES);
      const status = pick(STATUSES);
      const template = pick(TEMPLATES[cat]);
      const title = `${template} - ${mp.constituency}`;
      const budget = Math.round(allocation * (0.04 + Math.random() * 0.22));
      const disbursed = status === 'COMPLETED' ? budget
        : status === 'STALLED' ? Math.round(budget * (0.05 + Math.random() * 0.25))
        : Math.round(budget * (0.3 + Math.random() * 0.55));
      const completionPct = status === 'COMPLETED' ? 100 : status === 'STALLED' ? randInt(5, 35) : randInt(25, 82);
      const startDate = `202${randInt(2, 4)}-${String(randInt(1, 12)).padStart(2, '0')}-01`;
      const endDate = addDays(startDate, randInt(180, 730));
      const riskScore = status === 'STALLED' ? randInt(55, 92) : status === 'COMPLETED' ? randInt(3, 22) : randInt(15, 68);

      const project = {
        id: `pr-${mp.id}-${i}`,
        mpId: mp.id,
        agencyId: AGENCY_IDS[agIdx++ % AGENCY_IDS.length],
        title,
        category: cat,
        state: mp.state,
        district: mp.constituency,
        lat: parseFloat((8 + Math.random() * 29).toFixed(4)),
        lng: parseFloat((68 + Math.random() * 29).toFixed(4)),
        budget,
        disbursed,
        completionPct,
        status,
        startDate,
        endDate,
        riskScore,
        lapseRisk: status === 'STALLED' && riskScore > 65,
        duplicateFlag: false,
        fraudFlags: riskScore > 75 ? randInt(1, 3) : 0,
        delayDays: status === 'STALLED' ? randInt(30, 180) : 0,
        description: `${template} for ${mp.constituency} constituency`,
        lastProgressUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      allProjects.push(project);
    }
  }

  console.log(`📦 Generated ${allProjects.length} projects. Uploading to Supabase...`);

  // Upload in chunks of 100
  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < allProjects.length; i += CHUNK) {
    const chunk = allProjects.slice(i, i + CHUNK);
    const rows = chunk.map(p => ({
      id: p.id,
      mp_id: p.mpId,
      data: p,
    }));

    const { error } = await supabase
      .from('store_projects')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error(`Chunk ${Math.floor(i / CHUNK) + 1} error:`, error.message);
    } else {
      inserted += chunk.length;
      process.stdout.write(`\r✅ Uploaded ${inserted}/${allProjects.length} projects...`);
    }
  }

  console.log(`\n\n🎉 Done! ${inserted} projects stored in Supabase for ${mpsToProcess.length} MPs.`);
}

main().catch(console.error);
