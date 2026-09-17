// seed.js — loads pre-generated data instantly from seeded-data.json
// To regenerate: node backend/src/scripts/prebuild-seed.js
const db = require('../store/db');
const { seedRaw } = db;
const path = require('path');

// ─── Runtime fallback generator (for MPs not in seeded-data.json) ────────────
const CATEGORIES = ['ROADS', 'WATER', 'EDUCATION', 'HEALTH', 'ENVIRONMENT', 'COMMUNITY', 'RURAL', 'INFRASTRUCTURE'];
const STATUSES   = ['COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'IN_PROGRESS', 'STALLED'];
const TEMPLATES  = {
  ROADS:['Road Widening','Village Road Connectivity','CC Road Construction'],
  WATER:['Drinking Water Supply','Overhead Tank Construction','Water ATM Network'],
  EDUCATION:['School Building Construction','Classroom Renovation','Digital Library Setup'],
  HEALTH:['PHC Upgrade','Community Health Centre','Telemedicine Kiosk'],
  ENVIRONMENT:['Park Development','Plantation Drive','Solid Waste Management Plant'],
  COMMUNITY:['Community Hall','Sports Ground Development','Skill Development Centre'],
  RURAL:['Gram Panchayat Building','Rural Electrification','Irrigation Canal'],
  INFRASTRUCTURE:['Street Light Installation','Bus Stand Construction','Public Toilet Block'],
};
const AGENCY_IDS = ['ag-001','ag-002','ag-003','ag-004','ag-005','ag-006','ag-007','ag-008','ag-009','ag-010','ag-011','ag-012','ag-013','ag-014','ag-015'];
let _agIdx = 0;
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; }

function generateMpData(mpId, state, constituency, lat, lng) {
  const numProjects = rnd(3, 6);
  for (let i = 0; i < numProjects; i++) {
    const cat = pick(CATEGORIES);
    const status = pick(STATUSES);
    const budget = rnd(1000000, 4000000);
    const disbursed = status === 'COMPLETED' ? budget : status === 'STALLED' ? Math.round(budget * 0.12) : Math.round(budget * (0.3 + Math.random() * 0.5));
    const completionPct = status === 'COMPLETED' ? 100 : status === 'STALLED' ? rnd(5, 25) : rnd(25, 80);
    const startDate = `202${rnd(2,4)}-${String(rnd(1,9)).padStart(2,'0')}-01`;
    const riskScore = status === 'STALLED' ? rnd(60,92) : status === 'COMPLETED' ? rnd(3,22) : rnd(15,60);
    seedRaw('projects', `pr-${mpId}-${i}`, {
      mpId, agencyId: AGENCY_IDS[_agIdx++ % AGENCY_IDS.length],
      title: `${pick(TEMPLATES[cat])} - ${constituency}`, category: cat,
      state, district: constituency,
      lat: parseFloat((lat + (Math.random()-0.5)*0.3).toFixed(4)),
      lng: parseFloat((lng + (Math.random()-0.5)*0.3).toFixed(4)),
      budget, disbursed, completionPct, status,
      startDate, endDate: addDays(startDate, rnd(180,550)),
      riskScore, lapseRisk: status === 'STALLED' && riskScore > 65,
      duplicateFlag: false, description: `${cat} project for ${constituency}.`,
    });
  }
  for (let i = 0; i < 2; i++) {
    const cat = pick(CATEGORIES);
    seedRaw('proposals', `prop-${mpId}-dyn-${i}`, {
      mpId, title: `${pick(TEMPLATES[cat])} - Proposed`, category: cat,
      estimatedBudget: rnd(1500000, 4500000),
      description: `Proposed ${cat.toLowerCase()} for ${constituency}.`,
      lat, lng, status: i === 0 ? 'PENDING' : 'APPROVED',
      submittedAt: new Date(Date.now() - rnd(30,150)*86400000).toISOString(),
      ministerRemarks: i === 0 ? null : 'Approved by oversight committee.',
    });
  }
}

function seedAll() {
  if (db.isSeeded()) return;

  // ─── Agencies (always seed with Supabase persist) ──────────────────────────
  const agencies = [
    { id:'ag-001', name:'Shree Ram Constructions Pvt Ltd',        registeredAddress:'45 Industrial Estate, Kanpur, UP', director:'Ramesh Gupta',        gstIn:'09AAAAA0000A1Z5', category:'CONSTRUCTION',   trustScore:38, completedProjects:12, totalProjects:18, fraudFlags:3, avgDelayDays:45,  state:'Uttar Pradesh',    completionRate:67, delayScore:45, fraudScore:30,  communityScore:50, mpCount:4,  riskLevel:'HIGH_RISK'   },
    { id:'ag-002', name:'Kerala Infrastructure Development Corp',  registeredAddress:'12 Technopark, Thiruvananthapuram', director:'Anilkumar V',        gstIn:'32BBBBB1111B2Z6', category:'INFRASTRUCTURE', trustScore:84, completedProjects:28, totalProjects:31, fraudFlags:0, avgDelayDays:8,   state:'Kerala',            completionRate:90, delayScore:88, fraudScore:98,  communityScore:82, mpCount:7,  riskLevel:'LOW_RISK'    },
    { id:'ag-003', name:'Vishal Projects Limited',                 registeredAddress:'45 Industrial Estate, Kanpur, UP', director:'Vikas Gupta',        gstIn:'09CCCCC2222C3Z7', category:'CONSTRUCTION',   trustScore:31, completedProjects:5,  totalProjects:14, fraudFlags:4, avgDelayDays:92,  state:'Uttar Pradesh',    completionRate:36, delayScore:20, fraudScore:15,  communityScore:30, mpCount:3,  riskLevel:'HIGH_RISK', shellAlert:true },
    { id:'ag-004', name:'Sunrise Road Works',                      registeredAddress:'78 MG Road, Chennai, TN',          director:'Selvam K',           gstIn:'33DDDDD3333D4Z8', category:'ROADS',          trustScore:72, completedProjects:19, totalProjects:22, fraudFlags:1, avgDelayDays:18,  state:'Tamil Nadu',        completionRate:86, delayScore:75, fraudScore:80,  communityScore:72, mpCount:5,  riskLevel:'LOW_RISK'    },
    { id:'ag-005', name:'Gujarat Civil Engineers Consortium',      registeredAddress:'90 GIDC, Ahmedabad, GJ',           director:'Bharat Shah',        gstIn:'24EEEEE4444E5Z9', category:'INFRASTRUCTURE', trustScore:67, completedProjects:15, totalProjects:20, fraudFlags:1, avgDelayDays:28,  state:'Gujarat',           completionRate:75, delayScore:65, fraudScore:70,  communityScore:62, mpCount:4,  riskLevel:'MEDIUM_RISK' },
    { id:'ag-006', name:'Deccan Builders & Associates',            registeredAddress:'23 Banjara Hills, Hyderabad, TS',  director:'Mohammed Salim',     gstIn:'36FFFFF5555F6Z0', category:'CONSTRUCTION',   trustScore:55, completedProjects:10, totalProjects:16, fraudFlags:2, avgDelayDays:35,  state:'Telangana',         completionRate:63, delayScore:52, fraudScore:55,  communityScore:48, mpCount:3,  riskLevel:'MEDIUM_RISK' },
    { id:'ag-007', name:'Bengal Public Works Solutions',           registeredAddress:'11 Park Street, Kolkata, WB',      director:'Amit Ghosh',         gstIn:'19GGGGG6666G7Z1', category:'INFRASTRUCTURE', trustScore:62, completedProjects:14, totalProjects:19, fraudFlags:1, avgDelayDays:22,  state:'West Bengal',       completionRate:74, delayScore:68, fraudScore:72,  communityScore:58, mpCount:4,  riskLevel:'MEDIUM_RISK' },
    { id:'ag-008', name:'Andhra Rural Development Trust',          registeredAddress:'5 Governorpet, Vijayawada, AP',    director:'Srinivas Rao',       gstIn:'37HHHHH7777H8Z2', category:'RURAL',          trustScore:43, completedProjects:4,  totalProjects:11, fraudFlags:3, avgDelayDays:78,  state:'Andhra Pradesh',    completionRate:36, delayScore:30, fraudScore:32,  communityScore:42, mpCount:2,  riskLevel:'HIGH_RISK'   },
    { id:'ag-009', name:'Punjab Water & Sanitation Board',         registeredAddress:'22 Lawrence Road, Amritsar, PB',   director:'Gurjeet Kaur',       gstIn:'03IIIII8888I9Z3', category:'WATER',          trustScore:79, completedProjects:22, totalProjects:26, fraudFlags:0, avgDelayDays:12,  state:'Punjab',            completionRate:85, delayScore:80, fraudScore:95,  communityScore:76, mpCount:6,  riskLevel:'LOW_RISK'    },
    { id:'ag-010', name:'MP State Road Development Corp',          registeredAddress:'67 Hoshangabad Road, Bhopal, MP',  director:'Kamal Pandey',       gstIn:'23JJJJJ9999J0Z4', category:'ROADS',          trustScore:58, completedProjects:9,  totalProjects:15, fraudFlags:2, avgDelayDays:42,  state:'Madhya Pradesh',    completionRate:60, delayScore:50, fraudScore:55,  communityScore:52, mpCount:3,  riskLevel:'MEDIUM_RISK' },
    { id:'ag-011', name:'National Smart Infra Ltd',                registeredAddress:'45 Industrial Estate, Kanpur, UP', director:'Ramesh Kumar Gupta', gstIn:'09KKKKK0001K1Z5', category:'CONSTRUCTION',   trustScore:29, completedProjects:3,  totalProjects:10, fraudFlags:5, avgDelayDays:110, state:'Uttar Pradesh',    completionRate:30, delayScore:15, fraudScore:10,  communityScore:25, mpCount:2,  riskLevel:'HIGH_RISK', shellAlert:true },
    { id:'ag-012', name:'South India Civil Works',                 registeredAddress:'78 MG Road, Chennai, TN',          director:'Selvakumar P',       gstIn:'33LLLLL1112L2Z6', category:'CONSTRUCTION',   trustScore:69, completedProjects:16, totalProjects:20, fraudFlags:1, avgDelayDays:20,  state:'Tamil Nadu',        completionRate:80, delayScore:72, fraudScore:75,  communityScore:65, mpCount:5,  riskLevel:'LOW_RISK'    },
    { id:'ag-013', name:'Rapid Build Infrastructure',              registeredAddress:'90 GIDC, Ahmedabad, GJ',           director:'Nilesh Patel',       gstIn:'24MMMMM2223M3Z7', category:'ROADS',          trustScore:75, completedProjects:18, totalProjects:22, fraudFlags:0, avgDelayDays:15,  state:'Gujarat',           completionRate:82, delayScore:80, fraudScore:92,  communityScore:70, mpCount:4,  riskLevel:'LOW_RISK'    },
    { id:'ag-014', name:'GreenPath Environmental Works',           registeredAddress:'33 Koramangala, Bengaluru, KA',    director:'Suresh Babu',        gstIn:'29NNNNN3334N4Z8', category:'ENVIRONMENT',    trustScore:88, completedProjects:25, totalProjects:27, fraudFlags:0, avgDelayDays:5,   state:'Karnataka',         completionRate:93, delayScore:92, fraudScore:98,  communityScore:88, mpCount:8,  riskLevel:'LOW_RISK'    },
    { id:'ag-015', name:'Hill Region Development Agency',          registeredAddress:'8 Mall Road, Shimla, HP',          director:'Vikram Thakur',      gstIn:'02OOOOO4445O5Z9', category:'RURAL',          trustScore:71, completedProjects:13, totalProjects:17, fraudFlags:1, avgDelayDays:25,  state:'Himachal Pradesh',  completionRate:76, delayScore:72, fraudScore:80,  communityScore:68, mpCount:3,  riskLevel:'LOW_RISK'    },
  ];
  agencies.forEach(a => db.seed('agencies', a.id, a));

  // ─── Load pre-generated JSON (instant) ────────────────────────────────────
  const jsonPath = path.join(__dirname, 'seeded-data.json');
  let seededData = null;
  try {
    seededData = require(jsonPath);
    console.log('[Seed] Loading from pre-generated seeded-data.json...');
  } catch (e) {
    console.warn('[Seed] seeded-data.json not found — run: node backend/src/scripts/prebuild-seed.js');
  }

  if (seededData) {
    // Bulk-load MPs
    Object.values(seededData.mps).forEach(mp => seedRaw('mps', mp.id, mp));
    // Bulk-load projects
    Object.values(seededData.projects).forEach(p => seedRaw('projects', p.id, p));
    // Bulk-load proposals
    Object.values(seededData.proposals).forEach(p => seedRaw('proposals', p.id, p));
  }

  // ─── Static data ──────────────────────────────────────────────────────────
  const communityReports = [
    { id:'cr-001', projectId:'pr-LS-001-1', reporterId:'citizen-001', name:'Ramakant Verma', statusClaim:'NOT_STARTED', evidenceText:'No work is visible at site.', lat:19.75, lng:75.71, verified:false, createdAt:'2025-01-15T10:00:00.000Z' },
    { id:'cr-002', projectId:'pr-LS-002-0', reporterId:'citizen-002', name:'Sunita Devi',   statusClaim:'LESS_THAN_25_PCT', evidenceText:'Some marking done but work has not started.', lat:10.85, lng:76.27, verified:false, createdAt:'2025-01-18T14:00:00.000Z' },
  ];
  communityReports.forEach(r => seedRaw('communityReports', r.id, r));

  const externalSchemes = [
    { id:'ext-001', scheme:'PMGSY', title:'Village Road — Dholka to Bavla Connectivity', lat:22.72, lng:72.46, budget:3200000, startDate:'2023-10-01', endDate:'2025-03-31', state:'Gujarat',      contractor:'Rapid Build Infrastructure' },
    { id:'ext-002', scheme:'AMRUT', title:'Flood Protection Embankment — Dharmatala',     lat:22.56, lng:88.35, budget:2000000, startDate:'2024-01-01', endDate:'2025-05-31', state:'West Bengal', contractor:'Bengal Municipal Works' },
  ];
  externalSchemes.forEach(e => seedRaw('externalSchemes', e.id, e));
  // Populate Audit Ledger with recent mock entries
  const auditLedger = require('../services/auditLedger');
  const mockProjects = Array.from(projects).slice(0, 5);
  for (const p of mockProjects) {
    auditLedger.append({
      table: 'projects', id: p.id, action: 'CREATE', actor: 'ministry_nodal_officer',
      payload: { status: 'PENDING', amount: p.budget }
    });
    auditLedger.append({
      table: 'projects', id: p.id, action: 'UPDATE', actor: 'district_magistrate',
      payload: { status: 'APPROVED' }
    });
  }

  db.markSeeded();
  const mpCount   = Object.keys(db.store?.mps      || {}).length;
  const projCount = Object.keys(db.store?.projects  || {}).length;
  console.log(`✅ Seeded: ${mpCount} MPs · ${projCount} projects · ${agencies.length} agencies · 10 audit entries`);
}

module.exports = { seedAll, generateMpData };
