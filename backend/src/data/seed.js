const db = require('../store/db');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// ─── State → approx center coordinates ─────────────────────────────────────
const STATE_COORDS = {
  'Andhra Pradesh':     { lat: 15.9129, lng: 79.7400 },
  'Arunachal Pradesh':  { lat: 28.2180, lng: 94.7278 },
  'Assam':              { lat: 26.2006, lng: 92.9376 },
  'Bihar':              { lat: 25.0961, lng: 85.3131 },
  'Chhattisgarh':       { lat: 21.2787, lng: 81.8661 },
  'Goa':                { lat: 15.2993, lng: 74.1240 },
  'Gujarat':            { lat: 22.2587, lng: 71.1924 },
  'Haryana':            { lat: 29.0588, lng: 76.0856 },
  'Himachal Pradesh':   { lat: 31.1048, lng: 77.1734 },
  'Jharkhand':          { lat: 23.6102, lng: 85.2799 },
  'Karnataka':          { lat: 15.3173, lng: 75.7139 },
  'Kerala':             { lat: 10.8505, lng: 76.2711 },
  'Madhya Pradesh':     { lat: 22.9734, lng: 78.6569 },
  'Maharashtra':        { lat: 19.7515, lng: 75.7139 },
  'Manipur':            { lat: 24.6637, lng: 93.9063 },
  'Meghalaya':          { lat: 25.4670, lng: 91.3662 },
  'Mizoram':            { lat: 23.1645, lng: 92.9376 },
  'Nagaland':           { lat: 26.1584, lng: 94.5624 },
  'Odisha':             { lat: 20.9517, lng: 85.0985 },
  'Punjab':             { lat: 31.1471, lng: 75.3412 },
  'Rajasthan':          { lat: 27.0238, lng: 74.2179 },
  'Sikkim':             { lat: 27.5330, lng: 88.5122 },
  'Tamil Nadu':         { lat: 11.1271, lng: 78.6569 },
  'Telangana':          { lat: 18.1124, lng: 79.0193 },
  'Tripura':            { lat: 23.9408, lng: 91.9882 },
  'Uttar Pradesh':      { lat: 26.8467, lng: 80.9462 },
  'Uttarakhand':        { lat: 30.0668, lng: 79.0193 },
  'West Bengal':        { lat: 22.9868, lng: 87.8550 },
  'Delhi':              { lat: 28.7041, lng: 77.1025 },
  'Jammu And Kashmir':  { lat: 33.7782, lng: 76.5762 },
  'Jammu and Kashmir':  { lat: 33.7782, lng: 76.5762 },
  'Ladakh':             { lat: 34.1526, lng: 77.5771 },
  'Puducherry':         { lat: 11.9416, lng: 79.8083 },
  'Chandigarh':         { lat: 30.7333, lng: 76.7794 },
  'Andaman And Nicobar Islands': { lat: 11.7401, lng: 92.6586 },
  'Lakshadweep':        { lat: 10.5667, lng: 72.6417 },
  'Dadra And Nagar Haveli And Daman And Diu': { lat: 20.1809, lng: 73.0169 },
};

function stateCoords(state) {
  return STATE_COORDS[state] || { lat: 20.5937, lng: 78.9629 }; // India center fallback
}

// ─── Project generation helpers ─────────────────────────────────────────────
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

let _agIdx = 0;
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; }

// ─── Generate projects + proposals for a single MP ──────────────────────────
function generateMpData(mpId, stateName, constituency, baseLat, baseLng, allocation) {
  const totalFunds = allocation || 25000000;
  const numProjects = randInt(3, 7);

  for (let i = 0; i < numProjects; i++) {
    const cat = pick(CATEGORIES);
    const status = pick(STATUSES);
    const template = pick(TEMPLATES[cat]);
    const title = `${template} - ${constituency}`;
    const budget = Math.round(totalFunds * (0.04 + Math.random() * 0.22));
    const disbursed = status === 'COMPLETED' ? budget
      : status === 'STALLED' ? Math.round(budget * (0.05 + Math.random() * 0.25))
      : Math.round(budget * (0.3 + Math.random() * 0.55));
    const completionPct = status === 'COMPLETED' ? 100 : status === 'STALLED' ? randInt(5, 35) : randInt(25, 82);
    const startDate = `202${randInt(2, 4)}-${String(randInt(1, 12)).padStart(2, '0')}-01`;
    const endDate = addDays(startDate, randInt(180, 730));
    const riskScore = status === 'STALLED' ? randInt(55, 92) : status === 'COMPLETED' ? randInt(3, 22) : randInt(15, 68);

    db.seed('projects', `pr-${mpId}-${i}`, {
      mpId,
      agencyId: AGENCY_IDS[_agIdx++ % AGENCY_IDS.length],
      title,
      category: cat,
      state: stateName,
      district: constituency,
      lat: parseFloat((baseLat + (Math.random() - 0.5) * 0.4).toFixed(4)),
      lng: parseFloat((baseLng + (Math.random() - 0.5) * 0.4).toFixed(4)),
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
      updatedAt: new Date().toISOString(),
    });
  }

  // 2 proposals per MP
  const propStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  for (let i = 0; i < 2; i++) {
    const cat = pick(CATEGORIES);
    const status = propStatuses[i % propStatuses.length];
    db.seed('proposals', `prop-${mpId}-${i}`, {
      mpId,
      title: `${pick(TEMPLATES[cat])} - Proposed`,
      category: cat,
      estimatedBudget: randInt(1500000, 5000000),
      description: `Proposed ${cat.toLowerCase()} development for ${constituency}.`,
      lat: parseFloat((baseLat + (Math.random() - 0.5) * 0.2).toFixed(4)),
      lng: parseFloat((baseLng + (Math.random() - 0.5) * 0.2).toFixed(4)),
      status,
      submittedAt: new Date(Date.now() - randInt(30, 180) * 86400000).toISOString(),
      ministerRemarks: status === 'PENDING' ? null : status === 'APPROVED'
        ? 'Approved by oversight committee. Proceed with work order.'
        : 'Budget ceiling exceeded. Please resubmit with reduced scope.',
    });
  }
}

// ─── Simple CSV parser (handles quoted fields with commas) ──────────────────
function parseCSV(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''); // strip BOM
  const lines = text.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQ = false;
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

// ─── Normalize state names from CSV ─────────────────────────────────────────
function normState(s) {
  if (!s) return 'India';
  // Title-case each word
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function seedAll() {
  if (db.isSeeded()) return;

  // ─── Agencies ───────────────────────────────────────────────────────────
  const agencies = [
    { id: 'ag-001', name: 'Shree Ram Constructions Pvt Ltd',       registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Ramesh Gupta',       gstIn: '09AAAAA0000A1Z5', category: 'CONSTRUCTION',  trustScore: 38, completedProjects: 12, totalProjects: 18, fraudFlags: 3, avgDelayDays: 45, state: 'Uttar Pradesh',     completionRate: 67, delayScore: 45, fraudScore: 30, communityScore: 50, mpCount: 4,  riskLevel: 'HIGH_RISK' },
    { id: 'ag-002', name: 'Kerala Infrastructure Development Corp', registeredAddress: '12 Technopark, Thiruvananthapuram', director: 'Anilkumar V',       gstIn: '32BBBBB1111B2Z6', category: 'INFRASTRUCTURE',trustScore: 84, completedProjects: 28, totalProjects: 31, fraudFlags: 0, avgDelayDays:  8, state: 'Kerala',             completionRate: 90, delayScore: 88, fraudScore: 98, communityScore: 82, mpCount: 7,  riskLevel: 'LOW_RISK'  },
    { id: 'ag-003', name: 'Vishal Projects Limited',                registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Vikas Gupta',       gstIn: '09CCCCC2222C3Z7', category: 'CONSTRUCTION',  trustScore: 31, completedProjects:  5, totalProjects: 14, fraudFlags: 4, avgDelayDays: 92, state: 'Uttar Pradesh',     completionRate: 36, delayScore: 20, fraudScore: 15, communityScore: 30, mpCount: 3,  riskLevel: 'HIGH_RISK', shellAlert: true },
    { id: 'ag-004', name: 'Sunrise Road Works',                     registeredAddress: '78 MG Road, Chennai, TN',          director: 'Selvam K',          gstIn: '33DDDDD3333D4Z8', category: 'ROADS',         trustScore: 72, completedProjects: 19, totalProjects: 22, fraudFlags: 1, avgDelayDays: 18, state: 'Tamil Nadu',         completionRate: 86, delayScore: 75, fraudScore: 80, communityScore: 72, mpCount: 5,  riskLevel: 'LOW_RISK'  },
    { id: 'ag-005', name: 'Gujarat Civil Engineers Consortium',     registeredAddress: '90 GIDC, Ahmedabad, GJ',           director: 'Bharat Shah',       gstIn: '24EEEEE4444E5Z9', category: 'INFRASTRUCTURE',trustScore: 67, completedProjects: 15, totalProjects: 20, fraudFlags: 1, avgDelayDays: 28, state: 'Gujarat',            completionRate: 75, delayScore: 65, fraudScore: 70, communityScore: 62, mpCount: 4,  riskLevel: 'MEDIUM_RISK'},
    { id: 'ag-006', name: 'Deccan Builders & Associates',           registeredAddress: '23 Banjara Hills, Hyderabad, TS',  director: 'Mohammed Salim',    gstIn: '36FFFFF5555F6Z0', category: 'CONSTRUCTION',  trustScore: 55, completedProjects: 10, totalProjects: 16, fraudFlags: 2, avgDelayDays: 35, state: 'Telangana',          completionRate: 63, delayScore: 52, fraudScore: 55, communityScore: 48, mpCount: 3,  riskLevel: 'MEDIUM_RISK'},
    { id: 'ag-007', name: 'Bengal Public Works Solutions',          registeredAddress: '11 Park Street, Kolkata, WB',      director: 'Amit Ghosh',        gstIn: '19GGGGG6666G7Z1', category: 'INFRASTRUCTURE',trustScore: 62, completedProjects: 14, totalProjects: 19, fraudFlags: 1, avgDelayDays: 22, state: 'West Bengal',        completionRate: 74, delayScore: 68, fraudScore: 72, communityScore: 58, mpCount: 4,  riskLevel: 'MEDIUM_RISK'},
    { id: 'ag-008', name: 'Andhra Rural Development Trust',         registeredAddress: '5 Governorpet, Vijayawada, AP',    director: 'Srinivas Rao',      gstIn: '37HHHHH7777H8Z2', category: 'RURAL',         trustScore: 43, completedProjects:  4, totalProjects: 11, fraudFlags: 3, avgDelayDays: 78, state: 'Andhra Pradesh',    completionRate: 36, delayScore: 30, fraudScore: 32, communityScore: 42, mpCount: 2,  riskLevel: 'HIGH_RISK' },
    { id: 'ag-009', name: 'Punjab Water & Sanitation Board',        registeredAddress: '22 Lawrence Road, Amritsar, PB',   director: 'Gurjeet Kaur',      gstIn: '03IIIII8888I9Z3', category: 'WATER',         trustScore: 79, completedProjects: 22, totalProjects: 26, fraudFlags: 0, avgDelayDays: 12, state: 'Punjab',             completionRate: 85, delayScore: 80, fraudScore: 95, communityScore: 76, mpCount: 6,  riskLevel: 'LOW_RISK'  },
    { id: 'ag-010', name: 'MP State Road Development Corp',         registeredAddress: '67 Hoshangabad Road, Bhopal, MP',  director: 'Kamal Pandey',      gstIn: '23JJJJJ9999J0Z4', category: 'ROADS',         trustScore: 58, completedProjects:  9, totalProjects: 15, fraudFlags: 2, avgDelayDays: 42, state: 'Madhya Pradesh',    completionRate: 60, delayScore: 50, fraudScore: 55, communityScore: 52, mpCount: 3,  riskLevel: 'MEDIUM_RISK'},
    { id: 'ag-011', name: 'National Smart Infra Ltd',               registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Ramesh Kumar Gupta', gstIn: '09KKKKK0001K1Z5', category: 'CONSTRUCTION', trustScore: 29, completedProjects:  3, totalProjects: 10, fraudFlags: 5, avgDelayDays: 110,state: 'Uttar Pradesh',     completionRate: 30, delayScore: 15, fraudScore: 10, communityScore: 25, mpCount: 2,  riskLevel: 'HIGH_RISK', shellAlert: true },
    { id: 'ag-012', name: 'South India Civil Works',                registeredAddress: '78 MG Road, Chennai, TN',          director: 'Selvakumar P',      gstIn: '33LLLLL1112L2Z6', category: 'CONSTRUCTION',  trustScore: 69, completedProjects: 16, totalProjects: 20, fraudFlags: 1, avgDelayDays: 20, state: 'Tamil Nadu',         completionRate: 80, delayScore: 72, fraudScore: 75, communityScore: 65, mpCount: 5,  riskLevel: 'LOW_RISK'  },
    { id: 'ag-013', name: 'Rapid Build Infrastructure',             registeredAddress: '90 GIDC, Ahmedabad, GJ',           director: 'Nilesh Patel',      gstIn: '24MMMMM2223M3Z7', category: 'ROADS',         trustScore: 75, completedProjects: 18, totalProjects: 22, fraudFlags: 0, avgDelayDays: 15, state: 'Gujarat',            completionRate: 82, delayScore: 80, fraudScore: 92, communityScore: 70, mpCount: 4,  riskLevel: 'LOW_RISK'  },
    { id: 'ag-014', name: 'GreenPath Environmental Works',          registeredAddress: '33 Koramangala, Bengaluru, KA',    director: 'Suresh Babu',       gstIn: '29NNNNN3334N4Z8', category: 'ENVIRONMENT',   trustScore: 88, completedProjects: 25, totalProjects: 27, fraudFlags: 0, avgDelayDays:  5, state: 'Karnataka',          completionRate: 93, delayScore: 92, fraudScore: 98, communityScore: 88, mpCount: 8,  riskLevel: 'LOW_RISK'  },
    { id: 'ag-015', name: 'Hill Region Development Agency',         registeredAddress: '8 Mall Road, Shimla, HP',          director: 'Vikram Thakur',     gstIn: '02OOOOO4445O5Z9', category: 'RURAL',         trustScore: 71, completedProjects: 13, totalProjects: 17, fraudFlags: 1, avgDelayDays: 25, state: 'Himachal Pradesh',   completionRate: 76, delayScore: 72, fraudScore: 80, communityScore: 68, mpCount: 3,  riskLevel: 'LOW_RISK'  },
  ];
  agencies.forEach(a => db.seed('agencies', a.id, a));

  // ─── Load ALL MPs from CSV files ─────────────────────────────────────────
  const dataDir = __dirname;
  const lsRows = parseCSV(path.join(dataDir, 'lok_sabha_mps.csv'));
  const rsRows = parseCSV(path.join(dataDir, 'rajya_sabha_mps.csv'));

  const allMpRecords = [];

  // Lok Sabha
  lsRows.forEach((row, idx) => {
    const name = row["Hon'ble Members of Parliaments"] || row["Name"] || '';
    const state = normState(row['State'] || '');
    const constituency = row['Constituency'] || '';
    const allocation = parseFloat(row['Allocated AMOUNT ( ₹ )']) || 25000000;
    if (!name) return;

    const id = `LS-${String(idx + 1).padStart(3, '0')}`;
    const coords = stateCoords(state);
    const usedPct = 0.35 + Math.random() * 0.6;
    const totalFunds = allocation;
    const usedFunds = Math.round(totalFunds * usedPct);
    const completedWorks = randInt(5, 25);
    const inProgressWorks = randInt(2, 10);

    const mp = {
      id, name, constituency, state,
      party: '', type: 'Lok Sabha',
      totalFunds, usedFunds,
      unspentAmount: totalFunds - usedFunds,
      utilizationPercentage: Math.round(usedPct * 100),
      completedWorksCount: completedWorks,
      recommendedWorksCount: inProgressWorks,
      completionRate: Math.round(usedPct * 100 * 0.9),
      paymentGapPercentage: randInt(0, 15),
      lat: coords.lat,
      lng: coords.lng,
      email: `${name.split(' ')[0].toLowerCase()}.${id.toLowerCase()}@mp.gov.in`,
      phone: `+91-98765${randInt(10000, 99999)}`,
    };
    db.seed('mps', id, mp);
    allMpRecords.push({ id, state, constituency, lat: coords.lat, lng: coords.lng, totalFunds });
  });

  // Rajya Sabha
  rsRows.forEach((row, idx) => {
    const name = row["Hon'ble Members of Parliament"] || row["Name"] || '';
    const state = normState(row['State'] || '');
    const allocation = parseFloat(row['Allocated AMOUNT ( ₹ )']) || 25000000;
    if (!name) return;

    const id = `RS-${String(idx + 1).padStart(3, '0')}`;
    const coords = stateCoords(state);
    const usedPct = 0.35 + Math.random() * 0.6;
    const totalFunds = allocation;
    const usedFunds = Math.round(totalFunds * usedPct);
    const completedWorks = randInt(5, 22);
    const inProgressWorks = randInt(2, 8);

    // RS MPs don't have constituencies — use state name
    const constituency = `${state} (Rajya Sabha)`;

    const mp = {
      id, name, constituency, state,
      party: '', type: 'Rajya Sabha',
      totalFunds, usedFunds,
      unspentAmount: totalFunds - usedFunds,
      utilizationPercentage: Math.round(usedPct * 100),
      completedWorksCount: completedWorks,
      recommendedWorksCount: inProgressWorks,
      completionRate: Math.round(usedPct * 100 * 0.9),
      paymentGapPercentage: randInt(0, 15),
      lat: coords.lat,
      lng: coords.lng,
      email: `${name.split(' ')[0].toLowerCase()}.${id.toLowerCase()}@mp.gov.in`,
      phone: `+91-98765${randInt(10000, 99999)}`,
    };
    db.seed('mps', id, mp);
    allMpRecords.push({ id, state, constituency, lat: coords.lat, lng: coords.lng, totalFunds });
  });

  // ─── Generate projects + proposals for EVERY MP ─────────────────────────
  console.log(`🏗️  Generating projects for ${allMpRecords.length} MPs...`);
  allMpRecords.forEach(({ id, state, constituency, lat, lng, totalFunds }) => {
    generateMpData(id, state, constituency, lat, lng, totalFunds);
  });

  // ─── Community Reports ───────────────────────────────────────────────────
  const communityReports = [
    { id: 'cr-001', projectId: 'pr-LS-001-1', reporterId: 'citizen-001', name: 'Ramakant Verma', statusClaim: 'NOT_STARTED', evidenceText: 'No work is visible, no machinery present at site.', lat: 19.75, lng: 75.71, verified: false, createdAt: '2025-01-15T10:00:00.000Z' },
    { id: 'cr-002', projectId: 'pr-LS-002-0', reporterId: 'citizen-002', name: 'Sunita Devi', statusClaim: 'LESS_THAN_25_PCT', evidenceText: 'Some marking done but road work hasn\'t started.', lat: 10.85, lng: 76.27, verified: false, createdAt: '2025-01-18T14:00:00.000Z' },
    { id: 'cr-003', projectId: 'pr-LS-003-2', reporterId: 'citizen-003', name: 'Lakshmi Amma', statusClaim: 'MORE_THAN_75_PCT', evidenceText: 'Health centre is nearly done! Pharmacy is functional.', lat: 8.48, lng: 76.94, verified: true, createdAt: '2025-03-01T08:00:00.000Z' },
  ];
  communityReports.forEach(r => db.seed('communityReports', r.id, r));

  // ─── External Schemes for double-funding detection ───────────────────────
  const externalSchemes = [
    { id: 'ext-001', scheme: 'PMGSY', title: 'Village Road — Dholka to Bavla Connectivity', lat: 22.72, lng: 72.46, budget: 3200000, startDate: '2023-10-01', endDate: '2025-03-31', state: 'Gujarat', contractor: 'Rapid Build Infrastructure' },
    { id: 'ext-002', scheme: 'AMRUT', title: 'Flood Protection Embankment — Dharmatala', lat: 22.56, lng: 88.35, budget: 2000000, startDate: '2024-01-01', endDate: '2025-05-31', state: 'West Bengal', contractor: 'Bengal Municipal Works' },
  ];
  externalSchemes.forEach(e => db.seed('externalSchemes', e.id, e));

  db.markSeeded();
  const mpCount = Object.keys(db.store?.mps || {}).length;
  const projCount = Object.keys(db.store?.projects || {}).length;
  console.log(`✅ Seeded: ${mpCount} MPs · ${projCount} projects · ${agencies.length} agencies`);
}

module.exports = { seedAll, generateMpData };
