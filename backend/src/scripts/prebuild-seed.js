// prebuild-seed.js
// Run ONCE: node backend/src/scripts/prebuild-seed.js
// Generates backend/src/data/seeded-data.json so the server just loads it instantly.

const fs = require('fs');
const path = require('path');

const CATEGORIES = ['ROADS', 'WATER', 'EDUCATION', 'HEALTH', 'ENVIRONMENT', 'COMMUNITY', 'RURAL', 'INFRASTRUCTURE', 'SANITATION', 'ENERGY'];
const STATUSES   = ['COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'STALLED'];
const TEMPLATES = {
  ROADS:          ['CC Road Construction', 'Road Widening', 'Village Road Connectivity', 'Bridge Construction', 'Highway Stretch Repair', 'Bypass Road'],
  WATER:          ['Drinking Water Supply', 'Overhead Tank Construction', 'Pipeline Replacement', 'Borewell Installation', 'Water ATM Network', 'Canal Lining'],
  EDUCATION:      ['School Building Construction', 'Toilet Block in School', 'Classroom Renovation', 'Digital Library Setup', 'Computer Lab', 'Anganwadi Centre'],
  HEALTH:         ['PHC Upgrade', 'Mobile Medical Unit', 'Maternity Ward Construction', 'Community Health Centre', 'Telemedicine Kiosk', 'Blood Bank Setup'],
  ENVIRONMENT:    ['Park Development', 'Plantation Drive', 'Solid Waste Management Plant', 'Sewage Treatment Plant', 'Rainwater Harvesting'],
  COMMUNITY:      ['Community Hall', 'Sports Ground Development', 'Cultural Centre', 'Women Resource Centre', 'Skill Development Centre', 'Market Shed'],
  RURAL:          ['Gram Panchayat Building', 'Irrigation Canal', 'Cold Storage Facility', 'Rural Electrification', 'Cattle Shed Renovation'],
  INFRASTRUCTURE: ['Street Light Installation', 'Public Toilet Block', 'Bus Stand Construction', 'Old Age Home', 'Multi-Level Parking'],
  SANITATION:     ['Community Toilet Complex', 'Open Defecation Free Drive', 'Drainage Network', 'Septic Tank Installation'],
  ENERGY:         ['Solar Street Lighting', 'Solar Micro-Grid', 'LED Streetlight Replacement', 'Rooftop Solar for Schools'],
};
const AGENCY_IDS = ['ag-001','ag-002','ag-003','ag-004','ag-005','ag-006','ag-007','ag-008','ag-009','ag-010','ag-011','ag-012','ag-013','ag-014','ag-015'];

const STATE_COORDS = {
  'Andhra Pradesh':{ lat: 15.9129, lng: 79.74 },'Arunachal Pradesh':{ lat: 28.218, lng: 94.7278 },
  'Assam':{ lat: 26.2006, lng: 92.9376 },'Bihar':{ lat: 25.0961, lng: 85.3131 },
  'Chhattisgarh':{ lat: 21.2787, lng: 81.8661 },'Goa':{ lat: 15.2993, lng: 74.124 },
  'Gujarat':{ lat: 22.2587, lng: 71.1924 },'Haryana':{ lat: 29.0588, lng: 76.0856 },
  'Himachal Pradesh':{ lat: 31.1048, lng: 77.1734 },'Jharkhand':{ lat: 23.6102, lng: 85.2799 },
  'Karnataka':{ lat: 15.3173, lng: 75.7139 },'Kerala':{ lat: 10.8505, lng: 76.2711 },
  'Madhya Pradesh':{ lat: 22.9734, lng: 78.6569 },'Maharashtra':{ lat: 19.7515, lng: 75.7139 },
  'Manipur':{ lat: 24.6637, lng: 93.9063 },'Meghalaya':{ lat: 25.467, lng: 91.3662 },
  'Mizoram':{ lat: 23.1645, lng: 92.9376 },'Nagaland':{ lat: 26.1584, lng: 94.5624 },
  'Odisha':{ lat: 20.9517, lng: 85.0985 },'Punjab':{ lat: 31.1471, lng: 75.3412 },
  'Rajasthan':{ lat: 27.0238, lng: 74.2179 },'Sikkim':{ lat: 27.533, lng: 88.5122 },
  'Tamil Nadu':{ lat: 11.1271, lng: 78.6569 },'Telangana':{ lat: 18.1124, lng: 79.0193 },
  'Tripura':{ lat: 23.9408, lng: 91.9882 },'Uttar Pradesh':{ lat: 26.8467, lng: 80.9462 },
  'Uttarakhand':{ lat: 30.0668, lng: 79.0193 },'West Bengal':{ lat: 22.9868, lng: 87.855 },
  'Delhi':{ lat: 28.7041, lng: 77.1025 },'Jammu And Kashmir':{ lat: 33.7782, lng: 76.5762 },
  'Jammu and Kashmir':{ lat: 33.7782, lng: 76.5762 },'Ladakh':{ lat: 34.1526, lng: 77.5771 },
  'Puducherry':{ lat: 11.9416, lng: 79.8083 },'Chandigarh':{ lat: 30.7333, lng: 76.7794 },
  'Andaman And Nicobar Islands':{ lat: 11.7401, lng: 92.6586 },'Lakshadweep':{ lat: 10.5667, lng: 72.6417 },
  'Dadra And Nagar Haveli And Daman And Diu':{ lat: 20.1809, lng: 73.0169 },
};

let _seed = 42;
function seededRand() { _seed = (_seed * 1664525 + 1013904223) & 0xffffffff; return Math.abs(_seed) / 0xffffffff; }
function pick(arr, s) { _seed = s !== undefined ? s : _seed; return arr[Math.floor(seededRand() * arr.length)]; }
function randInt(a, b) { return Math.floor(seededRand() * (b - a + 1)) + a; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; }
function normState(s) { if (!s) return 'India'; return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()); }
function stateCoords(state) { return STATE_COORDS[state] || { lat: 20.5937, lng: 78.9629 }; }

function parseCSV(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = text.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const cols = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').replace(/"/g, '').trim(); });
    return obj;
  });
}

let agIdx = 0;
function generateForMp(id, state, constituency, lat, lng, totalFunds) {
  const projects = [];
  const proposals = [];
  const numProjects = 3 + (Math.abs(_seed) % 5); // deterministic 3-7

  for (let i = 0; i < numProjects; i++) {
    _seed = _seed ^ ((id.charCodeAt(0) || 65) * (i + 1) * 7919);
    const cat = CATEGORIES[Math.abs(_seed) % CATEGORIES.length];
    const status = STATUSES[Math.abs(_seed >> 3) % STATUSES.length];
    const template = TEMPLATES[cat][Math.abs(_seed >> 5) % TEMPLATES[cat].length];
    const budget = 1000000 + Math.abs(_seed % 4000000);
    const disbursed = status === 'COMPLETED' ? budget
      : status === 'STALLED' ? Math.round(budget * 0.12)
      : Math.round(budget * (0.3 + (Math.abs(_seed >> 8) % 55) / 100));
    const completionPct = status === 'COMPLETED' ? 100 : status === 'STALLED' ? 5 + Math.abs(_seed >> 10) % 30 : 25 + Math.abs(_seed >> 12) % 57;
    const monthStart = 1 + Math.abs(_seed >> 14) % 9;
    const startDate = `202${2 + Math.abs(_seed >> 16) % 3}-${String(monthStart).padStart(2,'0')}-01`;
    const endDate = addDays(startDate, 180 + Math.abs(_seed >> 18) % 550);
    const riskScore = status === 'STALLED' ? 55 + Math.abs(_seed >> 20) % 37 : status === 'COMPLETED' ? 3 + Math.abs(_seed >> 20) % 20 : 15 + Math.abs(_seed >> 20) % 53;
    const latOff = ((Math.abs(_seed >> 22) % 40) - 20) / 100;
    const lngOff = ((Math.abs(_seed >> 24) % 40) - 20) / 100;

    projects.push({
      id: `pr-${id}-${i}`,
      mpId: id,
      agencyId: AGENCY_IDS[agIdx++ % AGENCY_IDS.length],
      title: `${template} - ${constituency}`,
      category: cat,
      state,
      district: constituency,
      lat: parseFloat((lat + latOff).toFixed(4)),
      lng: parseFloat((lng + lngOff).toFixed(4)),
      budget,
      disbursed,
      completionPct,
      status,
      startDate,
      endDate,
      riskScore,
      lapseRisk: status === 'STALLED' && riskScore > 65,
      duplicateFlag: false,
      description: `${template} for ${constituency} constituency.`,
    });
  }

  const propStatuses = ['PENDING', 'APPROVED'];
  for (let i = 0; i < 2; i++) {
    _seed = _seed ^ ((id.charCodeAt(0) || 65) * (i + 100) * 6571);
    const cat = CATEGORIES[Math.abs(_seed) % CATEGORIES.length];
    const status = propStatuses[i];
    proposals.push({
      id: `prop-${id}-${i}`,
      mpId: id,
      title: `${TEMPLATES[cat][Math.abs(_seed >> 4) % TEMPLATES[cat].length]} - Proposed`,
      category: cat,
      estimatedBudget: 1500000 + Math.abs(_seed % 3500000),
      description: `Proposed ${cat.toLowerCase()} development for ${constituency}.`,
      lat: parseFloat((lat + ((Math.abs(_seed >> 8) % 10) - 5) / 100).toFixed(4)),
      lng: parseFloat((lng + ((Math.abs(_seed >> 10) % 10) - 5) / 100).toFixed(4)),
      status,
      submittedAt: new Date(Date.now() - (30 + Math.abs(_seed >> 12) % 150) * 86400000).toISOString(),
      ministerRemarks: status === 'PENDING' ? null : 'Approved by oversight committee. Proceed with work order.',
    });
  }
  return { projects, proposals };
}

function main() {
  const dataDir = path.join(__dirname, '../data');
  const lsRows = parseCSV(path.join(dataDir, 'lok_sabha_mps.csv'));
  const rsRows = parseCSV(path.join(dataDir, 'rajya_sabha_mps.csv'));

  const mps = {};
  const projects = {};
  const proposals = {};

  const processRows = (rows, type, nameKey) => {
    rows.forEach((row, idx) => {
      const name = row[nameKey] || '';
      if (!name) return;
      const state = normState(row['State'] || '');
      const allocation = parseFloat(row['Allocated AMOUNT ( \u20b9 )']) || 25000000;
      const id = `${type === 'Lok Sabha' ? 'LS' : 'RS'}-${String(idx + 1).padStart(3, '0')}`;
      const coords = stateCoords(state);
      const constituency = type === 'Lok Sabha' ? (row['Constituency'] || state) : `${state} (Rajya Sabha)`;

      _seed = (id.charCodeAt(0) * 397) ^ (id.charCodeAt(3) * 1013) ^ idx;
      const usedPct = 0.35 + (Math.abs(_seed) % 60) / 100;
      const usedFunds = Math.round(allocation * usedPct);

      mps[id] = {
        id, name, constituency, state, party: '', type,
        totalFunds: allocation, usedFunds,
        unspentAmount: allocation - usedFunds,
        utilizationPercentage: Math.round(usedPct * 100),
        completedWorksCount: 5 + Math.abs(_seed >> 4) % 20,
        recommendedWorksCount: 2 + Math.abs(_seed >> 6) % 9,
        completionRate: Math.round(usedPct * 90),
        paymentGapPercentage: Math.abs(_seed >> 8) % 15,
        lat: coords.lat, lng: coords.lng,
        email: `${name.split(' ')[0].toLowerCase()}.${id.toLowerCase()}@mp.gov.in`,
        phone: `+91-98765${String(10000 + Math.abs(_seed >> 10) % 89999)}`,
      };

      const { projects: ps, proposals: props } = generateForMp(id, state, constituency, coords.lat, coords.lng, allocation);
      ps.forEach(p => { projects[p.id] = p; });
      props.forEach(p => { proposals[p.id] = p; });
    });
  };

  processRows(lsRows, 'Lok Sabha', "Hon'ble Members of Parliaments");
  processRows(rsRows, 'Rajya Sabha', "Hon'ble Members of Parliament");

  const out = { mps, projects, proposals };
  const outPath = path.join(dataDir, 'seeded-data.json');
  fs.writeFileSync(outPath, JSON.stringify(out));

  const mpCount = Object.keys(mps).length;
  const projCount = Object.keys(projects).length;
  const propCount = Object.keys(proposals).length;
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`✅ Generated seeded-data.json`);
  console.log(`   MPs: ${mpCount} | Projects: ${projCount} | Proposals: ${propCount} | Size: ${sizeKb} KB`);
}

main();
