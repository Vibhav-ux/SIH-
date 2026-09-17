const db = require('../store/db');
const { v4: uuidv4 } = require('uuid');

// ─── Project title templates keyed by category ──────────────────────────────
const TITLE_TEMPLATES = {
  ROADS:          ['Road Widening — {place} Main Road', 'Rural Road Construction — {place} Block', 'Bypass Road — {place} Industrial Zone', 'Pothole Repair & Resurfacing — {place} Highway'],
  WATER:          ['Water ATM Network — {place}', 'Drinking Water Pipeline — {place} Cluster', 'Overhead Tank Construction — {place}', 'RO Purification Plant — {place}'],
  EDUCATION:      ['Renovation of Government School — {place}', 'Construction of Library — {place}', 'Digital Classroom Setup — {place}', 'Anganwadi Centre — {place}'],
  HEALTH:         ['Community Health Centre — {place}', 'Mobile Health Unit — {place}', 'PHC Upgrade — {place}', 'Digital Health Kiosk — {place}'],
  COMMUNITY:      ['Community Hall — {place}', 'Sports Complex — {place}', 'Heritage Street Restoration — {place}', 'Women\'s Resource Centre — {place}'],
  INFRASTRUCTURE: ['Drainage Improvement — {place}', 'Sewerage Network — {place}', 'Footpath Development — {place}', 'Multi-Level Parking — {place}'],
  SANITATION:     ['Community Toilet Complex — {place}', 'Solid Waste Plant — {place}', 'Open Defecation Free Drive — {place}'],
  ENERGY:         ['Solar Street Lighting — {place}', 'Solar Micro-Grid — {place}', 'LED Streetlight Replacement — {place}'],
  ENVIRONMENT:    ['Tree Plantation Drive — {place}', 'Waste Water Treatment — {place}', 'Park Development — {place}'],
  RURAL:          ['Rural Electrification — {place}', 'Village Connectivity Road — {place}', 'Rural Health Sub-Centre — {place}'],
};

const CATEGORIES = Object.keys(TITLE_TEMPLATES);

function pickTitle(cat, place) {
  const t = TITLE_TEMPLATES[cat] || TITLE_TEMPLATES.COMMUNITY;
  return t[Math.floor(Math.random() * t.length)].replace('{place}', place);
}

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndFloat(min, max) { return (Math.random() * (max - min) + min); }

// ─── Generate projects, proposals, and alerts for a single MP ───────────────
function generateMpData(mpId, stateName, constituency, baseLat, baseLng) {
  const agencies = db.getAll('agencies');
  const agencyIds = agencies.map(a => a.id);

  const numProjects = rnd(4, 8);
  const place = constituency || stateName;

  for (let i = 0; i < numProjects; i++) {
    const cat = CATEGORIES[i % CATEGORIES.length];
    const budget = rnd(800000, 5000000);
    const isCompleted = Math.random() > 0.55;
    const isStalled = !isCompleted && Math.random() > 0.8;
    const completionPct = isCompleted ? 100 : (isStalled ? rnd(5, 20) : rnd(20, 88));
    const disbursed = isCompleted ? budget : Math.floor(budget * completionPct / 100);
    const riskScore = isCompleted ? rnd(5, 25) : (isStalled ? rnd(70, 96) : rnd(20, 65));

    db.seed('projects', uuidv4(), {
      mpId,
      agencyId: agencyIds[rnd(0, agencyIds.length - 1)],
      title: pickTitle(cat, place),
      category: cat,
      state: stateName,
      district: constituency,
      lat: baseLat + rndFloat(-0.15, 0.15),
      lng: baseLng + rndFloat(-0.15, 0.15),
      budget,
      disbursed,
      status: isCompleted ? 'COMPLETED' : (isStalled ? 'STALLED' : 'IN_PROGRESS'),
      completionPct,
      startDate: `202${rnd(2, 4)}-0${rnd(1, 9)}-01`,
      endDate: `202${rnd(5, 6)}-0${rnd(1, 9)}-30`,
      description: `${cat} development project for the ${place} constituency area.`,
      riskScore,
      lapseRisk: riskScore > 75 && Math.random() > 0.5,
    });
  }

  // 2 proposals
  const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
  for (let i = 0; i < 2; i++) {
    const cat = CATEGORIES[rnd(0, CATEGORIES.length - 1)];
    const status = statuses[i];
    db.seed('proposals', uuidv4(), {
      mpId,
      title: pickTitle(cat, place),
      category: cat,
      estimatedBudget: rnd(1500000, 5000000),
      description: `Proposed expansion of ${cat.toLowerCase()} infrastructure for ${place}.`,
      lat: baseLat + rndFloat(-0.05, 0.05),
      lng: baseLng + rndFloat(-0.05, 0.05),
      status,
      submittedAt: new Date(Date.now() - rnd(30, 180) * 86400000).toISOString(),
      ministerRemarks: status === 'PENDING' ? null : (status === 'APPROVED' ? 'Approved by oversight committee. Proceed with work order.' : 'Budget ceiling exceeded. Please resubmit with reduced scope.'),
    });
  }
}

function seedAll() {
  if (db.isSeeded()) return;

  // ─── Agencies ─────────────────────────────────────────────────────────────
  const agencies = [
    { id: 'ag-001', name: 'Shree Ram Constructions Pvt Ltd', registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Ramesh Gupta', gstIn: '09AAAAA0000A1Z5', category: 'CONSTRUCTION', trustScore: 38, completedProjects: 12, totalProjects: 18, fraudFlags: 3, avgDelayDays: 45, state: 'Uttar Pradesh', completionRate: 67, delayScore: 45, fraudScore: 30, communityScore: 50, mpCount: 4 },
    { id: 'ag-002', name: 'Kerala Infrastructure Development Corp', registeredAddress: '12 Technopark, Thiruvananthapuram, KL', director: 'Anilkumar V', gstIn: '32BBBBB1111B2Z6', category: 'INFRASTRUCTURE', trustScore: 84, completedProjects: 28, totalProjects: 31, fraudFlags: 0, avgDelayDays: 8, state: 'Kerala', completionRate: 90, delayScore: 88, fraudScore: 98, communityScore: 82, mpCount: 7, riskLevel: 'LOW_RISK' },
    { id: 'ag-003', name: 'Vishal Projects Limited', registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Vikas Gupta', gstIn: '09CCCCC2222C3Z7', category: 'CONSTRUCTION', trustScore: 31, completedProjects: 5, totalProjects: 14, fraudFlags: 4, avgDelayDays: 92, state: 'Uttar Pradesh', shellAlert: true, completionRate: 36, delayScore: 20, fraudScore: 15, communityScore: 30, mpCount: 3, riskLevel: 'HIGH_RISK' },
    { id: 'ag-004', name: 'Sunrise Road Works', registeredAddress: '78 MG Road, Chennai, TN', director: 'Selvam K', gstIn: '33DDDDD3333D4Z8', category: 'ROADS', trustScore: 72, completedProjects: 19, totalProjects: 22, fraudFlags: 1, avgDelayDays: 18, state: 'Tamil Nadu', completionRate: 86, delayScore: 75, fraudScore: 80, communityScore: 72, mpCount: 5, riskLevel: 'LOW_RISK' },
    { id: 'ag-005', name: 'Gujarat Civil Engineers Consortium', registeredAddress: '90 GIDC, Ahmedabad, GJ', director: 'Bharat Shah', gstIn: '24EEEEE4444E5Z9', category: 'INFRASTRUCTURE', trustScore: 67, completedProjects: 15, totalProjects: 20, fraudFlags: 1, avgDelayDays: 28, state: 'Gujarat', completionRate: 75, delayScore: 65, fraudScore: 70, communityScore: 62, mpCount: 4, riskLevel: 'MEDIUM_RISK' },
    { id: 'ag-006', name: 'Deccan Builders & Associates', registeredAddress: '23 Banjara Hills, Hyderabad, TS', director: 'Mohammed Salim', gstIn: '36FFFFF5555F6Z0', category: 'CONSTRUCTION', trustScore: 55, completedProjects: 10, totalProjects: 16, fraudFlags: 2, avgDelayDays: 35, state: 'Telangana', completionRate: 63, delayScore: 52, fraudScore: 55, communityScore: 48, mpCount: 3, riskLevel: 'MEDIUM_RISK' },
    { id: 'ag-007', name: 'Bengal Public Works Solutions', registeredAddress: '11 Park Street, Kolkata, WB', director: 'Amit Ghosh', gstIn: '19GGGGG6666G7Z1', category: 'INFRASTRUCTURE', trustScore: 62, completedProjects: 14, totalProjects: 19, fraudFlags: 1, avgDelayDays: 22, state: 'West Bengal', completionRate: 74, delayScore: 68, fraudScore: 72, communityScore: 58, mpCount: 4, riskLevel: 'MEDIUM_RISK' },
    { id: 'ag-008', name: 'Andhra Rural Development Trust', registeredAddress: '5 Governorpet, Vijayawada, AP', director: 'Srinivas Rao', gstIn: '37HHHHH7777H8Z2', category: 'RURAL', trustScore: 43, completedProjects: 4, totalProjects: 11, fraudFlags: 3, avgDelayDays: 78, state: 'Andhra Pradesh', completionRate: 36, delayScore: 30, fraudScore: 32, communityScore: 42, mpCount: 2, riskLevel: 'HIGH_RISK' },
    { id: 'ag-009', name: 'Punjab Water & Sanitation Board', registeredAddress: '22 Lawrence Road, Amritsar, PB', director: 'Gurjeet Kaur', gstIn: '03IIIII8888I9Z3', category: 'WATER', trustScore: 79, completedProjects: 22, totalProjects: 26, fraudFlags: 0, avgDelayDays: 12, state: 'Punjab', completionRate: 85, delayScore: 80, fraudScore: 95, communityScore: 76, mpCount: 6, riskLevel: 'LOW_RISK' },
    { id: 'ag-010', name: 'MP State Road Development Corp', registeredAddress: '67 Hoshangabad Road, Bhopal, MP', director: 'Kamal Pandey', gstIn: '23JJJJJ9999J0Z4', category: 'ROADS', trustScore: 58, completedProjects: 9, totalProjects: 15, fraudFlags: 2, avgDelayDays: 42, state: 'Madhya Pradesh', completionRate: 60, delayScore: 50, fraudScore: 55, communityScore: 52, mpCount: 3, riskLevel: 'MEDIUM_RISK' },
    { id: 'ag-011', name: 'National Smart Infra Ltd', registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Ramesh Kumar Gupta', gstIn: '09KKKKK0001K1Z5', category: 'CONSTRUCTION', trustScore: 29, completedProjects: 3, totalProjects: 10, fraudFlags: 5, avgDelayDays: 110, state: 'Uttar Pradesh', shellAlert: true, completionRate: 30, delayScore: 15, fraudScore: 10, communityScore: 25, mpCount: 2, riskLevel: 'HIGH_RISK' },
    { id: 'ag-012', name: 'South India Civil Works', registeredAddress: '78 MG Road, Chennai, TN', director: 'Selvakumar P', gstIn: '33LLLLL1112L2Z6', category: 'CONSTRUCTION', trustScore: 69, completedProjects: 16, totalProjects: 20, fraudFlags: 1, avgDelayDays: 20, state: 'Tamil Nadu', completionRate: 80, delayScore: 72, fraudScore: 75, communityScore: 65, mpCount: 5, riskLevel: 'LOW_RISK' },
    { id: 'ag-013', name: 'Rapid Build Infrastructure', registeredAddress: '90 GIDC, Ahmedabad, GJ', director: 'Nilesh Patel', gstIn: '24MMMMM2223M3Z7', category: 'ROADS', trustScore: 75, completedProjects: 18, totalProjects: 22, fraudFlags: 0, avgDelayDays: 15, state: 'Gujarat', completionRate: 82, delayScore: 80, fraudScore: 92, communityScore: 70, mpCount: 4, riskLevel: 'LOW_RISK' },
    { id: 'ag-014', name: 'GreenPath Environmental Works', registeredAddress: '33 Koramangala, Bengaluru, KA', director: 'Suresh Babu', gstIn: '29NNNNN3334N4Z8', category: 'ENVIRONMENT', trustScore: 88, completedProjects: 25, totalProjects: 27, fraudFlags: 0, avgDelayDays: 5, state: 'Karnataka', completionRate: 93, delayScore: 92, fraudScore: 98, communityScore: 88, mpCount: 8, riskLevel: 'LOW_RISK' },
    { id: 'ag-015', name: 'Hill Region Development Agency', registeredAddress: '8 Mall Road, Shimla, HP', director: 'Vikram Thakur', gstIn: '02OOOOO4445O5Z9', category: 'RURAL', trustScore: 71, completedProjects: 13, totalProjects: 17, fraudFlags: 1, avgDelayDays: 25, state: 'Himachal Pradesh', completionRate: 76, delayScore: 72, fraudScore: 80, communityScore: 68, mpCount: 3, riskLevel: 'LOW_RISK' },
  ];
  agencies.forEach(a => db.seed('agencies', a.id, a));

  // ─── MPs with detailed data ────────────────────────────────────────────────
  // We store a rich set of 50 MPs covering all major states with full data.
  // Format: { id, name, constituency, state, party, type, totalFunds, usedFunds,
  //           completedWorksCount, recommendedWorksCount, utilizationPercentage,
  //           completionRate, paymentGapPercentage, lat, lng }
  const richMps = [
    { id: 'mp-001', name: 'Rajesh Kumar Sharma', constituency: 'Varanasi', state: 'Uttar Pradesh', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 18500000, completedWorksCount: 18, recommendedWorksCount: 12, utilizationPercentage: 74, completionRate: 60, paymentGapPercentage: 5, lat: 25.3176, lng: 82.9739 },
    { id: 'mp-002', name: 'Priya Nair', constituency: 'Thiruvananthapuram', state: 'Kerala', party: 'INC', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 22000000, completedWorksCount: 24, recommendedWorksCount: 6, utilizationPercentage: 88, completionRate: 80, paymentGapPercentage: 2, lat: 8.5241, lng: 76.9366 },
    { id: 'mp-003', name: 'Arvind Singh Chauhan', constituency: 'Lucknow', state: 'Uttar Pradesh', party: 'SP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 8000000, completedWorksCount: 6, recommendedWorksCount: 14, utilizationPercentage: 32, completionRate: 30, paymentGapPercentage: 18, lat: 26.8467, lng: 80.9462 },
    { id: 'mp-004', name: 'Meenakshi Devi', constituency: 'Chennai North', state: 'Tamil Nadu', party: 'DMK', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 24500000, completedWorksCount: 28, recommendedWorksCount: 3, utilizationPercentage: 98, completionRate: 90, paymentGapPercentage: 1, lat: 13.1165, lng: 80.2338 },
    { id: 'mp-005', name: 'Suresh Patel', constituency: 'Ahmedabad East', state: 'Gujarat', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 15000000, completedWorksCount: 16, recommendedWorksCount: 9, utilizationPercentage: 60, completionRate: 64, paymentGapPercentage: 8, lat: 23.0225, lng: 72.5714 },
    { id: 'mp-006', name: 'Fatima Begum', constituency: 'Hyderabad', state: 'Telangana', party: 'AIMIM', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 20000000, completedWorksCount: 22, recommendedWorksCount: 8, utilizationPercentage: 80, completionRate: 73, paymentGapPercentage: 4, lat: 17.3850, lng: 78.4867 },
    { id: 'mp-007', name: 'Ranjit Bose', constituency: 'Kolkata South', state: 'West Bengal', party: 'TMC', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 17500000, completedWorksCount: 20, recommendedWorksCount: 10, utilizationPercentage: 70, completionRate: 67, paymentGapPercentage: 6, lat: 22.5726, lng: 88.3639 },
    { id: 'mp-008', name: 'Kamala Reddy', constituency: 'Vijayawada', state: 'Andhra Pradesh', party: 'YSR', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 5000000, completedWorksCount: 4, recommendedWorksCount: 16, utilizationPercentage: 20, completionRate: 20, paymentGapPercentage: 22, lat: 16.5062, lng: 80.6480 },
    { id: 'mp-009', name: 'Harpreet Singh', constituency: 'Amritsar', state: 'Punjab', party: 'AAP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 23000000, completedWorksCount: 26, recommendedWorksCount: 4, utilizationPercentage: 92, completionRate: 87, paymentGapPercentage: 2, lat: 31.6340, lng: 74.8723 },
    { id: 'mp-010', name: 'Deepak Joshi', constituency: 'Bhopal', state: 'Madhya Pradesh', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 12000000, completedWorksCount: 12, recommendedWorksCount: 12, utilizationPercentage: 48, completionRate: 50, paymentGapPercentage: 10, lat: 23.2599, lng: 77.4126 },
    // Rajasthan
    { id: 'mp-011', name: 'Sunita Chouhan', constituency: 'Jaipur', state: 'Rajasthan', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 19000000, completedWorksCount: 21, recommendedWorksCount: 8, utilizationPercentage: 76, completionRate: 72, paymentGapPercentage: 5, lat: 26.9124, lng: 75.7873 },
    { id: 'mp-012', name: 'Ramdev Singh Rathore', constituency: 'Jodhpur', state: 'Rajasthan', party: 'INC', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 13000000, completedWorksCount: 14, recommendedWorksCount: 11, utilizationPercentage: 52, completionRate: 56, paymentGapPercentage: 12, lat: 26.2389, lng: 73.0243 },
    // Maharashtra
    { id: 'mp-013', name: 'Vijay Shinde', constituency: 'Mumbai South', state: 'Maharashtra', party: 'SS', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 21000000, completedWorksCount: 25, recommendedWorksCount: 7, utilizationPercentage: 84, completionRate: 78, paymentGapPercentage: 3, lat: 18.9388, lng: 72.8354 },
    { id: 'mp-014', name: 'Nandini Kulkarni', constituency: 'Pune', state: 'Maharashtra', party: 'NCP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 17000000, completedWorksCount: 18, recommendedWorksCount: 10, utilizationPercentage: 68, completionRate: 64, paymentGapPercentage: 7, lat: 18.5204, lng: 73.8567 },
    // Karnataka
    { id: 'mp-015', name: 'Kiran Gowda', constituency: 'Bengaluru South', state: 'Karnataka', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 20000000, completedWorksCount: 22, recommendedWorksCount: 8, utilizationPercentage: 80, completionRate: 73, paymentGapPercentage: 4, lat: 12.9716, lng: 77.5946 },
    { id: 'mp-016', name: 'Anita Nagesh', constituency: 'Mysuru', state: 'Karnataka', party: 'INC', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 16000000, completedWorksCount: 16, recommendedWorksCount: 12, utilizationPercentage: 64, completionRate: 57, paymentGapPercentage: 9, lat: 12.2958, lng: 76.6394 },
    // Bihar
    { id: 'mp-017', name: 'Abhay Kumar Yadav', constituency: 'Patna Sahib', state: 'Bihar', party: 'JDU', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 10000000, completedWorksCount: 8, recommendedWorksCount: 14, utilizationPercentage: 40, completionRate: 36, paymentGapPercentage: 16, lat: 25.5941, lng: 85.1376 },
    { id: 'mp-018', name: 'Geeta Devi', constituency: 'Gaya', state: 'Bihar', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 14000000, completedWorksCount: 15, recommendedWorksCount: 10, utilizationPercentage: 56, completionRate: 60, paymentGapPercentage: 9, lat: 24.7914, lng: 84.9994 },
    // Odisha
    { id: 'mp-019', name: 'Prasanna Mohapatra', constituency: 'Bhubaneswar', state: 'Odisha', party: 'BJD', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 18000000, completedWorksCount: 19, recommendedWorksCount: 9, utilizationPercentage: 72, completionRate: 68, paymentGapPercentage: 6, lat: 20.2961, lng: 85.8245 },
    // Assam
    { id: 'mp-020', name: 'Bikash Sarma', constituency: 'Guwahati', state: 'Assam', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 15500000, completedWorksCount: 17, recommendedWorksCount: 10, utilizationPercentage: 62, completionRate: 63, paymentGapPercentage: 8, lat: 26.1445, lng: 91.7362 },
    // Delhi
    { id: 'mp-021', name: 'Ramesh Verma', constituency: 'New Delhi', state: 'Delhi', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 21000000, completedWorksCount: 24, recommendedWorksCount: 6, utilizationPercentage: 84, completionRate: 80, paymentGapPercentage: 3, lat: 28.6139, lng: 77.2090 },
    { id: 'mp-022', name: 'Ananya Khanna', constituency: 'East Delhi', state: 'Delhi', party: 'AAP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 19000000, completedWorksCount: 20, recommendedWorksCount: 8, utilizationPercentage: 76, completionRate: 71, paymentGapPercentage: 4, lat: 28.6431, lng: 77.3196 },
    // Haryana
    { id: 'mp-023', name: 'Mohan Lal Bhatt', constituency: 'Gurugram', state: 'Haryana', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 16000000, completedWorksCount: 17, recommendedWorksCount: 11, utilizationPercentage: 64, completionRate: 61, paymentGapPercentage: 8, lat: 28.4595, lng: 77.0266 },
    // Jharkhand
    { id: 'mp-024', name: 'Sunil Hembrom', constituency: 'Ranchi', state: 'Jharkhand', party: 'JMM', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 11000000, completedWorksCount: 10, recommendedWorksCount: 13, utilizationPercentage: 44, completionRate: 43, paymentGapPercentage: 14, lat: 23.3441, lng: 85.3096 },
    // Uttarakhand
    { id: 'mp-025', name: 'Kalyani Rawat', constituency: 'Dehradun', state: 'Uttarakhand', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 17000000, completedWorksCount: 18, recommendedWorksCount: 9, utilizationPercentage: 68, completionRate: 67, paymentGapPercentage: 6, lat: 30.3165, lng: 78.0322 },
    // Himachal Pradesh
    { id: 'mp-026', name: 'Vijay Thakur', constituency: 'Shimla', state: 'Himachal Pradesh', party: 'INC', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 14000000, completedWorksCount: 15, recommendedWorksCount: 10, utilizationPercentage: 56, completionRate: 60, paymentGapPercentage: 10, lat: 31.1048, lng: 77.1734 },
    // Chhattisgarh
    { id: 'mp-027', name: 'Santosh Baghel', constituency: 'Raipur', state: 'Chhattisgarh', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 13000000, completedWorksCount: 13, recommendedWorksCount: 12, utilizationPercentage: 52, completionRate: 52, paymentGapPercentage: 11, lat: 21.2514, lng: 81.6296 },
    // Telangana — additional
    { id: 'mp-028', name: 'Praveen Reddy', constituency: 'Secunderabad', state: 'Telangana', party: 'TRS', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 19000000, completedWorksCount: 20, recommendedWorksCount: 8, utilizationPercentage: 76, completionRate: 71, paymentGapPercentage: 5, lat: 17.4399, lng: 78.4983 },
    // Goa
    { id: 'mp-029', name: 'Felicia Fernandes', constituency: 'North Goa', state: 'Goa', party: 'BJP', type: 'Lok Sabha', totalFunds: 25000000, usedFunds: 20000000, completedWorksCount: 22, recommendedWorksCount: 7, utilizationPercentage: 80, completionRate: 76, paymentGapPercentage: 4, lat: 15.4909, lng: 73.8278 },
    // Rajya Sabha MPs
    { id: 'rs-001', name: 'Dr. Anand Prakash Mishra', constituency: 'Rajya Sabha — Uttar Pradesh', state: 'Uttar Pradesh', party: 'BJP', type: 'Rajya Sabha', totalFunds: 25000000, usedFunds: 17000000, completedWorksCount: 18, recommendedWorksCount: 10, utilizationPercentage: 68, completionRate: 64, paymentGapPercentage: 6, lat: 26.8467, lng: 80.9462 },
    { id: 'rs-002', name: 'Kavya Pillai', constituency: 'Rajya Sabha — Kerala', state: 'Kerala', party: 'CPM', type: 'Rajya Sabha', totalFunds: 25000000, usedFunds: 21000000, completedWorksCount: 24, recommendedWorksCount: 6, utilizationPercentage: 84, completionRate: 80, paymentGapPercentage: 2, lat: 10.5276, lng: 76.2144 },
    { id: 'rs-003', name: 'Mohammed Iqbal', constituency: 'Rajya Sabha — Maharashtra', state: 'Maharashtra', party: 'INC', type: 'Rajya Sabha', totalFunds: 25000000, usedFunds: 16000000, completedWorksCount: 16, recommendedWorksCount: 11, utilizationPercentage: 64, completionRate: 59, paymentGapPercentage: 8, lat: 19.0760, lng: 72.8777 },
    { id: 'rs-004', name: 'Savitri Prasad', constituency: 'Rajya Sabha — Bihar', state: 'Bihar', party: 'JDU', type: 'Rajya Sabha', totalFunds: 25000000, usedFunds: 12000000, completedWorksCount: 12, recommendedWorksCount: 13, utilizationPercentage: 48, completionRate: 48, paymentGapPercentage: 13, lat: 25.5941, lng: 85.1376 },
    { id: 'rs-005', name: 'T. Krishnamurthy', constituency: 'Rajya Sabha — Tamil Nadu', state: 'Tamil Nadu', party: 'AIADMK', type: 'Rajya Sabha', totalFunds: 25000000, usedFunds: 20000000, completedWorksCount: 22, recommendedWorksCount: 7, utilizationPercentage: 80, completionRate: 76, paymentGapPercentage: 4, lat: 13.0827, lng: 80.2707 },
  ];

  richMps.forEach(m => {
    db.seed('mps', m.id, {
      ...m,
      unspentAmount: m.totalFunds - m.usedFunds,
      email: `${m.name.split(' ')[0].toLowerCase()}.${m.id}@mp.gov.in`,
      phone: `+91-98765${Math.floor(Math.random() * 90000 + 10000)}`,
      photo: null,
    });
  });

  // ─── Generate projects + proposals for all the above MPs ──────────────────
  richMps.forEach(m => {
    generateMpData(m.id, m.state, m.constituency, m.lat, m.lng);
  });

  // ─── Override with hand-crafted Varanasi projects for demo fidelity ────────
  const varanasi = [
    { id: 'pr-001', mpId: 'mp-001', agencyId: 'ag-001', title: 'Construction of Community Hall in Sarnath', category: 'COMMUNITY', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3714, lng: 83.0243, budget: 2500000, disbursed: 2000000, status: 'IN_PROGRESS', completionPct: 65, startDate: '2024-01-15', endDate: '2025-03-31', description: 'Multi-purpose community hall with 300 seating capacity', riskScore: 72, lapseRisk: false },
    { id: 'pr-002', mpId: 'mp-001', agencyId: 'ag-003', title: 'Road Widening — Varanasi-Mirzapur Highway', category: 'ROADS', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3176, lng: 82.9739, budget: 4500000, disbursed: 1200000, status: 'IN_PROGRESS', completionPct: 22, startDate: '2024-06-01', endDate: '2025-01-31', description: 'Widening of 8km highway stretch with footpaths', riskScore: 88, lapseRisk: true },
    { id: 'pr-003', mpId: 'mp-001', agencyId: 'ag-001', title: 'Drinking Water Supply — Ramnagar Cluster', category: 'WATER', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.2677, lng: 83.0381, budget: 1800000, disbursed: 1800000, status: 'COMPLETED', completionPct: 100, startDate: '2023-04-01', endDate: '2024-03-31', description: 'Overhead tank + pipeline for 5 villages', riskScore: 15, lapseRisk: false },
    { id: 'pr-028', mpId: 'mp-001', agencyId: 'ag-011', title: 'Construction of Multi-Purpose Hall — Sarnath Township', category: 'COMMUNITY', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3742, lng: 80.9263, budget: 2400000, disbursed: 500000, status: 'IN_PROGRESS', completionPct: 12, startDate: '2024-02-01', endDate: '2025-04-30', description: 'Community hall with 280 seating in Sarnath vicinity', riskScore: 81, lapseRisk: false, duplicateFlag: true },
  ];

  // ─── Proposals ────────────────────────────────────────────────────────────
  const proposals = [
    { id: 'prop-001', mpId: 'mp-001', title: 'Construction of Indoor Sports Stadium — Varanasi', category: 'COMMUNITY', estimatedBudget: 5000000, description: 'Covered indoor sports facility with 1000 seating', lat: 25.3500, lng: 83.0100, status: 'PENDING', submittedAt: '2025-03-01T10:00:00.000Z', ministerRemarks: null },
    { id: 'prop-002', mpId: 'mp-002', title: 'Coastal Protection — Kovalam Beach', category: 'ENVIRONMENT', estimatedBudget: 6000000, description: 'Geo-textile tube barrier + natural mangrove restoration for 2km coastline', lat: 8.3988, lng: 76.9987, status: 'APPROVED', submittedAt: '2025-01-15T09:00:00.000Z', ministerRemarks: 'Strong environmental justification. Approved.' },
    { id: 'prop-003', mpId: 'mp-003', title: 'Expressway Connectivity Link — Lucknow Ring Road', category: 'ROADS', estimatedBudget: 8000000, description: 'Connecting road link from inner ring road to expressway', lat: 26.9000, lng: 81.0200, status: 'REJECTED', submittedAt: '2024-12-01T10:00:00.000Z', ministerRemarks: 'Budget exceeds MPLAD ceiling. Please resubmit with reduced scope.' },
    { id: 'prop-004', mpId: 'mp-005', title: 'Solar Micro-Grid — Rural Dholka Cluster', category: 'ENERGY', estimatedBudget: 3500000, description: '100kW solar micro-grid serving 8 villages off-grid', lat: 22.7200, lng: 72.4600, status: 'PENDING', submittedAt: '2025-03-10T10:00:00.000Z', ministerRemarks: null },
    { id: 'prop-005', mpId: 'mp-006', title: 'Digital Library and Learning Hub — Old City', category: 'EDUCATION', estimatedBudget: 2000000, description: 'Digital literacy centre with 50 computers and free internet', lat: 17.3600, lng: 78.4800, status: 'APPROVED', submittedAt: '2025-02-01T10:00:00.000Z', ministerRemarks: 'Excellent initiative. Approved.' },
  ];

  // Seed hand-crafted items
  varanasi.forEach(p => db.seed('projects', p.id, p));
  proposals.forEach(p => db.seed('proposals', p.id, p));

  // ─── Community Reports ─────────────────────────────────────────────────────
  const communityReports = [
    { id: 'cr-001', projectId: 'pr-002', reporterId: 'citizen-001', name: 'Ramakant Verma', statusClaim: 'NOT_STARTED', evidenceText: 'No work is visible, no machinery, just a board that says work in progress.', lat: 25.3180, lng: 82.9740, verified: false, createdAt: '2025-01-15T10:00:00.000Z' },
    { id: 'cr-002', projectId: 'pr-002', reporterId: 'citizen-002', name: 'Sunita Devi', statusClaim: 'LESS_THAN_25_PCT', evidenceText: 'Some marking has been done but road work hasn\'t started.', lat: 25.3178, lng: 82.9741, verified: false, createdAt: '2025-01-18T14:00:00.000Z' },
    { id: 'cr-003', projectId: 'pr-028', reporterId: 'citizen-008', name: 'Vijay Kumar', statusClaim: 'NOT_STARTED', evidenceText: 'I heard about a community hall here but there is nothing on the ground. Exactly like pr-001 which is being built 300m away.', lat: 25.3745, lng: 80.9265, verified: false, createdAt: '2025-02-05T10:00:00.000Z' },
  ];
  communityReports.forEach(r => db.seed('communityReports', r.id, r));

  // ─── Complaints ───────────────────────────────────────────────────────────
  const complaints = [
    { id: 'comp-001', projectId: 'pr-002', complainantName: 'Mohammad Irfan', complainantPhone: '9988776655', category: 'QUALITY', description: 'Poor quality materials being used. Concrete not mixed properly.', status: 'OPEN', createdAt: '2024-11-10T10:00:00.000Z' },
    { id: 'comp-002', projectId: 'pr-028', complainantName: 'Prashant Mishra', complainantPhone: '9955443322', category: 'DUPLICATE', description: 'There is already a community hall being built 300m away under pr-001. This seems like the same project.', status: 'OPEN', createdAt: '2025-02-06T09:00:00.000Z' },
  ];
  complaints.forEach(c => db.seed('complaints', c.id, c));

  // ─── External Schemes ─────────────────────────────────────────────────────
  const externalSchemes = [
    { id: 'ext-001', scheme: 'PMGSY', title: 'Village Road — Dholka to Bavla Connectivity', lat: 22.7230, lng: 72.4651, budget: 3200000, startDate: '2023-10-01', endDate: '2025-03-31', description: 'All-weather road connecting Dholka cluster villages', state: 'Gujarat', contractor: 'Rapid Build Infrastructure' },
    { id: 'ext-002', scheme: 'AMRUT', title: 'Flood Protection Embankment — Dharmatala', lat: 22.5618, lng: 88.3522, budget: 2000000, startDate: '2024-01-01', endDate: '2025-05-31', description: 'Canal embankment for Dharmatala ward flood management', state: 'West Bengal', contractor: 'Bengal Municipal Works' },
  ];
  externalSchemes.forEach(e => db.seed('externalSchemes', e.id, e));

  db.markSeeded();
  console.log(`✅ Seed: ${richMps.length} MPs, ${db.getAll('projects').length} projects, ${db.getAll('proposals').length} proposals, ${db.getAll('agencies').length} agencies`);
}

module.exports = { seedAll, generateMpData };
