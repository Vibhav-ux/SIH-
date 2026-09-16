const db = require('../store/db');

function seedAll() {
  if (db.isSeeded()) return;

  // ─── MPs ──────────────────────────────────────────────────────────────────
  const mps = [
    { id: 'mp-001', name: 'Rajesh Kumar Sharma', constituency: 'Varanasi', state: 'Uttar Pradesh', party: 'BJP', totalFunds: 25000000, usedFunds: 18500000, email: 'rajesh.sharma@mp.gov.in', phone: '+91-9876543210', photo: null },
    { id: 'mp-002', name: 'Priya Nair', constituency: 'Thiruvananthapuram', state: 'Kerala', party: 'INC', totalFunds: 25000000, usedFunds: 22000000, email: 'priya.nair@mp.gov.in', phone: '+91-9876543211', photo: null },
    { id: 'mp-003', name: 'Arvind Singh Chauhan', constituency: 'Lucknow', state: 'Uttar Pradesh', party: 'SP', totalFunds: 25000000, usedFunds: 8000000, email: 'arvind.chauhan@mp.gov.in', phone: '+91-9876543212', photo: null },
    { id: 'mp-004', name: 'Meenakshi Devi', constituency: 'Chennai North', state: 'Tamil Nadu', party: 'DMK', totalFunds: 25000000, usedFunds: 24500000, email: 'meenakshi.devi@mp.gov.in', phone: '+91-9876543213', photo: null },
    { id: 'mp-005', name: 'Suresh Patel', constituency: 'Ahmedabad East', state: 'Gujarat', party: 'BJP', totalFunds: 25000000, usedFunds: 15000000, email: 'suresh.patel@mp.gov.in', phone: '+91-9876543214', photo: null },
    { id: 'mp-006', name: 'Fatima Begum', constituency: 'Hyderabad', state: 'Telangana', party: 'AIMIM', totalFunds: 25000000, usedFunds: 20000000, email: 'fatima.begum@mp.gov.in', phone: '+91-9876543215', photo: null },
    { id: 'mp-007', name: 'Ranjit Bose', constituency: 'Kolkata South', state: 'West Bengal', party: 'TMC', totalFunds: 25000000, usedFunds: 17500000, email: 'ranjit.bose@mp.gov.in', phone: '+91-9876543216', photo: null },
    { id: 'mp-008', name: 'Kamala Reddy', constituency: 'Vijayawada', state: 'Andhra Pradesh', party: 'YSR', totalFunds: 25000000, usedFunds: 5000000, email: 'kamala.reddy@mp.gov.in', phone: '+91-9876543217', photo: null },
    { id: 'mp-009', name: 'Harpreet Singh', constituency: 'Amritsar', state: 'Punjab', party: 'AAP', totalFunds: 25000000, usedFunds: 23000000, email: 'harpreet.singh@mp.gov.in', phone: '+91-9876543218', photo: null },
    { id: 'mp-010', name: 'Deepak Joshi', constituency: 'Bhopal', state: 'Madhya Pradesh', party: 'BJP', totalFunds: 25000000, usedFunds: 12000000, email: 'deepak.joshi@mp.gov.in', phone: '+91-9876543219', photo: null },
  ];
  mps.forEach(m => db.seed('mps', m.id, m));

  // ─── Agencies ─────────────────────────────────────────────────────────────
  const agencies = [
    { id: 'ag-001', name: 'Shree Ram Constructions Pvt Ltd', registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Ramesh Gupta', gstIn: '09AAAAA0000A1Z5', category: 'CONSTRUCTION', trustScore: 38, completedProjects: 12, totalProjects: 18, fraudFlags: 3, avgDelayDays: 45, state: 'Uttar Pradesh' },
    { id: 'ag-002', name: 'Kerala Infrastructure Development Corp', registeredAddress: '12 Technopark, Thiruvananthapuram, KL', director: 'Anilkumar V', gstIn: '32BBBBB1111B2Z6', category: 'INFRASTRUCTURE', trustScore: 84, completedProjects: 28, totalProjects: 31, fraudFlags: 0, avgDelayDays: 8, state: 'Kerala' },
    { id: 'ag-003', name: 'Vishal Projects Limited', registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Vikas Gupta', gstIn: '09CCCCC2222C3Z7', category: 'CONSTRUCTION', trustScore: 31, completedProjects: 5, totalProjects: 14, fraudFlags: 4, avgDelayDays: 92, state: 'Uttar Pradesh', shellAlert: true },
    { id: 'ag-004', name: 'Sunrise Road Works', registeredAddress: '78 MG Road, Chennai, TN', director: 'Selvam K', gstIn: '33DDDDD3333D4Z8', category: 'ROADS', trustScore: 72, completedProjects: 19, totalProjects: 22, fraudFlags: 1, avgDelayDays: 18, state: 'Tamil Nadu' },
    { id: 'ag-005', name: 'Gujarat Civil Engineers Consortium', registeredAddress: '90 GIDC, Ahmedabad, GJ', director: 'Bharat Shah', gstIn: '24EEEEE4444E5Z9', category: 'INFRASTRUCTURE', trustScore: 67, completedProjects: 15, totalProjects: 20, fraudFlags: 1, avgDelayDays: 28, state: 'Gujarat' },
    { id: 'ag-006', name: 'Deccan Builders & Associates', registeredAddress: '23 Banjara Hills, Hyderabad, TS', director: 'Mohammed Salim', gstIn: '36FFFFF5555F6Z0', category: 'CONSTRUCTION', trustScore: 55, completedProjects: 10, totalProjects: 16, fraudFlags: 2, avgDelayDays: 35, state: 'Telangana' },
    { id: 'ag-007', name: 'Bengal Public Works Solutions', registeredAddress: '11 Park Street, Kolkata, WB', director: 'Amit Ghosh', gstIn: '19GGGGG6666G7Z1', category: 'INFRASTRUCTURE', trustScore: 62, completedProjects: 14, totalProjects: 19, fraudFlags: 1, avgDelayDays: 22, state: 'West Bengal' },
    { id: 'ag-008', name: 'Andhra Rural Development Trust', registeredAddress: '5 Governorpet, Vijayawada, AP', director: 'Srinivas Rao', gstIn: '37HHHHH7777H8Z2', category: 'RURAL', trustScore: 43, completedProjects: 4, totalProjects: 11, fraudFlags: 3, avgDelayDays: 78, state: 'Andhra Pradesh' },
    { id: 'ag-009', name: 'Punjab Water & Sanitation Board', registeredAddress: '22 Lawrence Road, Amritsar, PB', director: 'Gurjeet Kaur', gstIn: '03IIIII8888I9Z3', category: 'WATER', trustScore: 79, completedProjects: 22, totalProjects: 26, fraudFlags: 0, avgDelayDays: 12, state: 'Punjab' },
    { id: 'ag-010', name: 'MP State Road Development Corp', registeredAddress: '67 Hoshangabad Road, Bhopal, MP', director: 'Kamal Pandey', gstIn: '23JJJJJ9999J0Z4', category: 'ROADS', trustScore: 58, completedProjects: 9, totalProjects: 15, fraudFlags: 2, avgDelayDays: 42, state: 'Madhya Pradesh' },
    { id: 'ag-011', name: 'National Smart Infra Ltd', registeredAddress: '45 Industrial Estate, Kanpur, UP', director: 'Ramesh Kumar Gupta', gstIn: '09KKKKK0001K1Z5', category: 'CONSTRUCTION', trustScore: 29, completedProjects: 3, totalProjects: 10, fraudFlags: 5, avgDelayDays: 110, state: 'Uttar Pradesh', shellAlert: true },
    { id: 'ag-012', name: 'South India Civil Works', registeredAddress: '78 MG Road, Chennai, TN', director: 'Selvakumar P', gstIn: '33LLLLL1112L2Z6', category: 'CONSTRUCTION', trustScore: 69, completedProjects: 16, totalProjects: 20, fraudFlags: 1, avgDelayDays: 20, state: 'Tamil Nadu' },
    { id: 'ag-013', name: 'Rapid Build Infrastructure', registeredAddress: '90 GIDC, Ahmedabad, GJ', director: 'Nilesh Patel', gstIn: '24MMMMM2223M3Z7', category: 'ROADS', trustScore: 75, completedProjects: 18, totalProjects: 22, fraudFlags: 0, avgDelayDays: 15, state: 'Gujarat' },
    { id: 'ag-014', name: 'GreenPath Environmental Works', registeredAddress: '33 Koramangala, Bengaluru, KA', director: 'Suresh Babu', gstIn: '29NNNNN3334N4Z8', category: 'ENVIRONMENT', trustScore: 88, completedProjects: 25, totalProjects: 27, fraudFlags: 0, avgDelayDays: 5, state: 'Karnataka' },
    { id: 'ag-015', name: 'Hill Region Development Agency', registeredAddress: '8 Mall Road, Shimla, HP', director: 'Vikram Thakur', gstIn: '02OOOOO4445O5Z9', category: 'RURAL', trustScore: 71, completedProjects: 13, totalProjects: 17, fraudFlags: 1, avgDelayDays: 25, state: 'Himachal Pradesh' },
  ];
  agencies.forEach(a => db.seed('agencies', a.id, a));

  // ─── Projects ─────────────────────────────────────────────────────────────
  const now = new Date();
  const projects = [
    // MP-001 (Varanasi) projects
    { id: 'pr-001', mpId: 'mp-001', agencyId: 'ag-001', title: 'Construction of Community Hall in Sarnath', category: 'COMMUNITY', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3714, lng: 83.0243, budget: 2500000, disbursed: 2000000, status: 'IN_PROGRESS', completionPct: 65, startDate: '2024-01-15', endDate: '2025-03-31', description: 'Multi-purpose community hall with 300 seating capacity', riskScore: 72, lapseRisk: false },
    { id: 'pr-002', mpId: 'mp-001', agencyId: 'ag-003', title: 'Road Widening — Varanasi-Mirzapur Highway Stretch', category: 'ROADS', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3176, lng: 82.9739, budget: 4500000, disbursed: 1200000, status: 'IN_PROGRESS', completionPct: 22, startDate: '2024-06-01', endDate: '2025-01-31', description: 'Widening of 8km highway stretch with footpaths', riskScore: 88, lapseRisk: true },
    { id: 'pr-003', mpId: 'mp-001', agencyId: 'ag-001', title: 'Drinking Water Supply — Ramnagar Cluster', category: 'WATER', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.2677, lng: 83.0381, budget: 1800000, disbursed: 1800000, status: 'COMPLETED', completionPct: 100, startDate: '2023-04-01', endDate: '2024-03-31', description: 'Overhead tank + pipeline for 5 villages', riskScore: 15, lapseRisk: false },
    { id: 'pr-004', mpId: 'mp-001', agencyId: 'ag-011', title: 'Renovation of Primary School — Chowk Area', category: 'EDUCATION', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3343, lng: 83.0001, budget: 1200000, disbursed: 400000, status: 'IN_PROGRESS', completionPct: 18, startDate: '2024-09-01', endDate: '2025-09-30', description: 'Classroom renovation, new toilets, boundary wall', riskScore: 61, lapseRisk: false },

    // MP-002 (Thiruvananthapuram) projects
    { id: 'pr-005', mpId: 'mp-002', agencyId: 'ag-002', title: 'Urban Drainage Improvement — Kazhakuttam', category: 'INFRASTRUCTURE', state: 'Kerala', district: 'Thiruvananthapuram', lat: 8.5644, lng: 76.8701, budget: 3000000, disbursed: 2900000, status: 'COMPLETED', completionPct: 100, startDate: '2023-03-01', endDate: '2024-02-28', description: 'Storm drain upgradation for flood-prone wards', riskScore: 10, lapseRisk: false },
    { id: 'pr-006', mpId: 'mp-002', agencyId: 'ag-002', title: 'Solar Street Lighting — Varkala Coastal Road', category: 'ENERGY', state: 'Kerala', district: 'Thiruvananthapuram', lat: 8.7379, lng: 76.7153, budget: 2000000, disbursed: 1800000, status: 'COMPLETED', completionPct: 100, startDate: '2023-06-01', endDate: '2024-05-31', description: '120 solar LED street lights on 6km coastal road', riskScore: 12, lapseRisk: false },
    { id: 'pr-007', mpId: 'mp-002', agencyId: 'ag-002', title: 'Community Health Centre Upgrade — Nemom', category: 'HEALTH', state: 'Kerala', district: 'Thiruvananthapuram', lat: 8.4855, lng: 76.9492, budget: 4000000, disbursed: 3800000, status: 'IN_PROGRESS', completionPct: 90, startDate: '2024-01-01', endDate: '2025-06-30', description: 'PHC upgrade with lab, pharmacy, 10-bed ward', riskScore: 18, lapseRisk: false },

    // MP-003 (Lucknow) — high lapse risk
    { id: 'pr-008', mpId: 'mp-003', agencyId: 'ag-003', title: 'Multi-Level Car Parking — Hazratganj', category: 'INFRASTRUCTURE', state: 'Uttar Pradesh', district: 'Lucknow', lat: 26.8467, lng: 80.9462, budget: 5000000, disbursed: 800000, status: 'STALLED', completionPct: 8, startDate: '2023-10-01', endDate: '2025-03-31', description: '200-capacity parking structure in commercial zone', riskScore: 95, lapseRisk: true },
    { id: 'pr-009', mpId: 'mp-003', agencyId: 'ag-001', title: 'Drainage and Road Repair — Alambagh Sector 3', category: 'INFRASTRUCTURE', state: 'Uttar Pradesh', district: 'Lucknow', lat: 26.7969, lng: 80.8832, budget: 2200000, disbursed: 600000, status: 'IN_PROGRESS', completionPct: 20, startDate: '2024-04-01', endDate: '2025-03-31', description: 'Stormwater drain + road patch for 3km stretch', riskScore: 78, lapseRisk: true },

    // MP-004 (Chennai) projects
    { id: 'pr-010', mpId: 'mp-004', agencyId: 'ag-004', title: 'Road Widening — Perambur Main Road', category: 'ROADS', state: 'Tamil Nadu', district: 'Chennai', lat: 13.1165, lng: 80.2338, budget: 3500000, disbursed: 3400000, status: 'COMPLETED', completionPct: 100, startDate: '2023-02-01', endDate: '2024-01-31', description: '5km 2-lane to 4-lane expansion', riskScore: 8, lapseRisk: false },
    { id: 'pr-011', mpId: 'mp-004', agencyId: 'ag-012', title: 'Construction of Anganwadi Centre — Kolathur', category: 'EDUCATION', state: 'Tamil Nadu', district: 'Chennai', lat: 13.1237, lng: 80.2098, budget: 900000, disbursed: 880000, status: 'COMPLETED', completionPct: 100, startDate: '2023-07-01', endDate: '2024-06-30', description: 'New Anganwadi centre with kitchen and playground', riskScore: 9, lapseRisk: false },
    { id: 'pr-012', mpId: 'mp-004', agencyId: 'ag-004', title: 'Sewerage Network — Tondiarpet North', category: 'INFRASTRUCTURE', state: 'Tamil Nadu', district: 'Chennai', lat: 13.1388, lng: 80.2887, budget: 4800000, disbursed: 4600000, status: 'IN_PROGRESS', completionPct: 92, startDate: '2024-01-01', endDate: '2025-03-31', description: 'Underground sewerage for 12,000 households', riskScore: 14, lapseRisk: false },

    // MP-005 (Ahmedabad) projects
    { id: 'pr-013', mpId: 'mp-005', agencyId: 'ag-005', title: 'Footpath Development — Naroda Industrial Zone', category: 'INFRASTRUCTURE', state: 'Gujarat', district: 'Ahmedabad', lat: 23.0870, lng: 72.6369, budget: 1500000, disbursed: 1200000, status: 'IN_PROGRESS', completionPct: 72, startDate: '2024-03-01', endDate: '2025-02-28', description: 'Paved footpaths with ramps for 4km stretch', riskScore: 28, lapseRisk: false },
    { id: 'pr-014', mpId: 'mp-005', agencyId: 'ag-013', title: 'Community Toilet Complex — Saijpur Bogha', category: 'SANITATION', state: 'Gujarat', district: 'Ahmedabad', lat: 23.0716, lng: 72.6548, budget: 1100000, disbursed: 1050000, status: 'COMPLETED', completionPct: 100, startDate: '2023-09-01', endDate: 'now', description: '15-seat community toilet with biogas unit', riskScore: 11, lapseRisk: false },
    { id: 'pr-015', mpId: 'mp-005', agencyId: 'ag-005', title: 'Construction of Community Library — CTM', category: 'EDUCATION', state: 'Gujarat', district: 'Ahmedabad', lat: 23.0415, lng: 72.6288, budget: 2000000, disbursed: 1800000, status: 'IN_PROGRESS', completionPct: 82, startDate: '2024-01-01', endDate: '2025-06-30', description: 'Digital library with 5000 book capacity', riskScore: 22, lapseRisk: false },

    // MP-006 (Hyderabad) projects
    { id: 'pr-016', mpId: 'mp-006', agencyId: 'ag-006', title: 'Skill Development Centre — Charminar Area', category: 'EDUCATION', state: 'Telangana', district: 'Hyderabad', lat: 17.3616, lng: 78.4747, budget: 3000000, disbursed: 2800000, status: 'IN_PROGRESS', completionPct: 88, startDate: '2024-02-01', endDate: '2025-01-31', description: 'Vocational training centre for 500 youth annually', riskScore: 19, lapseRisk: false },
    { id: 'pr-017', mpId: 'mp-006', agencyId: 'ag-006', title: 'Underground Drainage — Falaknuma', category: 'INFRASTRUCTURE', state: 'Telangana', district: 'Hyderabad', lat: 17.3342, lng: 78.4677, budget: 4000000, disbursed: 3600000, status: 'IN_PROGRESS', completionPct: 80, startDate: '2023-11-01', endDate: '2025-04-30', description: 'Storm drain replacement for old city waterlogging', riskScore: 32, lapseRisk: false },
    { id: 'pr-018', mpId: 'mp-006', agencyId: 'ag-006', title: 'Women\'s Resource Centre — Chandrayangutta', category: 'COMMUNITY', state: 'Telangana', district: 'Hyderabad', lat: 17.3278, lng: 78.5009, budget: 2000000, disbursed: 1800000, status: 'COMPLETED', completionPct: 100, startDate: '2023-05-01', endDate: '2024-04-30', description: 'Resource and counselling centre for women', riskScore: 8, lapseRisk: false },

    // MP-007 (Kolkata) projects
    { id: 'pr-019', mpId: 'mp-007', agencyId: 'ag-007', title: 'Heritage Street Restoration — Dharmatala', category: 'COMMUNITY', state: 'West Bengal', district: 'Kolkata', lat: 22.5616, lng: 88.3515, budget: 2800000, disbursed: 2500000, status: 'IN_PROGRESS', completionPct: 78, startDate: '2024-01-01', endDate: '2025-06-30', description: 'Paving, lighting, and tree plantation on heritage route', riskScore: 35, lapseRisk: false },
    { id: 'pr-020', mpId: 'mp-007', agencyId: 'ag-007', title: 'School Building Construction — Kalighat', category: 'EDUCATION', state: 'West Bengal', district: 'Kolkata', lat: 22.5191, lng: 88.3441, budget: 3500000, disbursed: 3000000, status: 'IN_PROGRESS', completionPct: 82, startDate: '2023-08-01', endDate: '2025-02-28', description: '2-storey 12-room primary school building', riskScore: 28, lapseRisk: false },

    // MP-008 (Vijayawada) — very low utilization, high lapse risk
    { id: 'pr-021', mpId: 'mp-008', agencyId: 'ag-008', title: 'Krishna River Embankment Beautification', category: 'ENVIRONMENT', state: 'Andhra Pradesh', district: 'Krishna', lat: 16.5062, lng: 80.6480, budget: 3000000, disbursed: 900000, status: 'STALLED', completionPct: 12, startDate: '2023-07-01', endDate: '2025-03-31', description: 'Walkway, park, and embankment on 3km Krishna riverfront', riskScore: 91, lapseRisk: true },
    { id: 'pr-022', mpId: 'mp-008', agencyId: 'ag-008', title: 'Flood Protection Wall — Benz Circle Area', category: 'INFRASTRUCTURE', state: 'Andhra Pradesh', district: 'Krishna', lat: 16.5004, lng: 80.6372, budget: 2000000, disbursed: 400000, status: 'STALLED', completionPct: 10, startDate: '2024-01-01', endDate: '2025-06-30', description: 'Concrete flood wall for low-lying residential areas', riskScore: 87, lapseRisk: true },

    // MP-009 (Amritsar) — good performer
    { id: 'pr-023', mpId: 'mp-009', agencyId: 'ag-009', title: 'Water ATM Network — Walled City Amritsar', category: 'WATER', state: 'Punjab', district: 'Amritsar', lat: 31.6340, lng: 74.8723, budget: 1500000, disbursed: 1450000, status: 'COMPLETED', completionPct: 100, startDate: '2023-05-01', endDate: '2024-04-30', description: '24 water ATM kiosks with RO purification', riskScore: 7, lapseRisk: false },
    { id: 'pr-024', mpId: 'mp-009', agencyId: 'ag-009', title: 'Solid Waste Management Plant — Chheharta', category: 'ENVIRONMENT', state: 'Punjab', district: 'Amritsar', lat: 31.6528, lng: 74.8312, budget: 4000000, disbursed: 3800000, status: 'IN_PROGRESS', completionPct: 91, startDate: '2024-02-01', endDate: '2025-07-31', description: 'Composting and sorting facility for 50 TPD waste', riskScore: 16, lapseRisk: false },
    { id: 'pr-025', mpId: 'mp-009', agencyId: 'ag-009', title: 'Digital Health Kiosk — Golden Temple Area', category: 'HEALTH', state: 'Punjab', district: 'Amritsar', lat: 31.6200, lng: 74.8765, budget: 2000000, disbursed: 1900000, status: 'COMPLETED', completionPct: 100, startDate: '2023-09-01', endDate: '2024-08-31', description: 'Telemedicine kiosk with diagnostics for pilgrims', riskScore: 9, lapseRisk: false },

    // MP-010 (Bhopal) projects
    { id: 'pr-026', mpId: 'mp-010', agencyId: 'ag-010', title: 'Road Construction — Govindpura Industrial Area', category: 'ROADS', state: 'Madhya Pradesh', district: 'Bhopal', lat: 23.2691, lng: 77.4728, budget: 3500000, disbursed: 3000000, status: 'IN_PROGRESS', completionPct: 75, startDate: '2024-03-01', endDate: '2025-08-31', description: 'Internal roads + drains for industrial zone', riskScore: 31, lapseRisk: false },
    { id: 'pr-027', mpId: 'mp-010', agencyId: 'ag-010', title: 'Sports Complex — Bhopal North', category: 'COMMUNITY', state: 'Madhya Pradesh', district: 'Bhopal', lat: 23.2929, lng: 77.3849, budget: 2500000, disbursed: 1500000, status: 'IN_PROGRESS', completionPct: 45, startDate: '2024-06-01', endDate: '2026-05-31', description: 'Multi-sport indoor complex with 500 seating', riskScore: 44, lapseRisk: false },

    // GHOST/DUPLICATE pair — very similar projects, close GPS
    { id: 'pr-028', mpId: 'mp-001', agencyId: 'ag-001', title: 'Construction of Multi-Purpose Hall — Sarnath Township', category: 'COMMUNITY', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3742, lng: 80.9263, budget: 2400000, disbursed: 500000, status: 'IN_PROGRESS', completionPct: 12, startDate: '2024-02-01', endDate: '2025-04-30', description: 'Community hall with 280 seating in Sarnath vicinity', riskScore: 81, lapseRisk: false, duplicateFlag: true },

    // Another duplicate pair in Lucknow
    { id: 'pr-029', mpId: 'mp-003', agencyId: 'ag-003', title: 'Drainage Improvement and Road Repair — Alambagh Sector', category: 'INFRASTRUCTURE', state: 'Uttar Pradesh', district: 'Lucknow', lat: 26.7971, lng: 80.8835, budget: 2100000, disbursed: 100000, status: 'IN_PROGRESS', completionPct: 3, startDate: '2024-05-01', endDate: '2025-04-30', description: 'Stormwater drainage network for Alambagh urban block', riskScore: 89, lapseRisk: false, duplicateFlag: true },

    // Cross-scheme double funding projects
    { id: 'pr-030', mpId: 'mp-005', agencyId: 'ag-005', title: 'Rural Road Construction — Dholka Block', category: 'ROADS', state: 'Gujarat', district: 'Ahmedabad', lat: 22.7222, lng: 72.4647, budget: 3500000, disbursed: 2000000, status: 'IN_PROGRESS', completionPct: 55, startDate: '2024-01-01', endDate: '2025-06-30', description: 'Village connectivity road 8km Dholka to Bavla', riskScore: 55, lapseRisk: false },
    { id: 'pr-031', mpId: 'mp-007', agencyId: 'ag-007', title: 'Flood Embankment — Dharmatala Ward', category: 'INFRASTRUCTURE', state: 'West Bengal', district: 'Kolkata', lat: 22.5619, lng: 88.3519, budget: 1800000, disbursed: 1200000, status: 'IN_PROGRESS', completionPct: 58, startDate: '2024-02-01', endDate: '2025-06-30', description: 'Embankment wall along canal to prevent flooding', riskScore: 38, lapseRisk: false },
  ];
  projects.forEach(p => db.seed('projects', p.id, p));

  // ─── External Scheme Dataset (for double-funding detection) ───────────────
  const externalSchemes = [
    { id: 'ext-001', scheme: 'PMGSY', title: 'Village Road — Dholka to Bavla Connectivity', lat: 22.7230, lng: 72.4651, budget: 3200000, startDate: '2023-10-01', endDate: '2025-03-31', description: 'All-weather road connecting Dholka cluster villages', state: 'Gujarat', contractor: 'Rapid Build Infrastructure' },
    { id: 'ext-002', scheme: 'AMRUT', title: 'Flood Protection Embankment — Dharmatala', lat: 22.5618, lng: 88.3522, budget: 2000000, startDate: '2024-01-01', endDate: '2025-05-31', description: 'Canal embankment for Dharmatala ward flood management', state: 'West Bengal', contractor: 'Bengal Municipal Works' },
    { id: 'ext-003', scheme: 'SBM', title: 'Community Toilet Block — Saijpur Bogha', lat: 23.0719, lng: 72.6551, budget: 900000, startDate: '2023-07-01', endDate: '2024-06-30', description: 'Community toilet and biogas unit for 50 households', state: 'Gujarat', contractor: 'Gujarat Sanitation Board' },
    { id: 'ext-004', scheme: 'JNNURM', title: 'Storm Water Drain — Alambagh Urban Block', lat: 26.7968, lng: 80.8834, budget: 2500000, startDate: '2024-03-01', endDate: '2025-09-30', description: 'Stormwater management for Alambagh residential sector', state: 'Uttar Pradesh', contractor: 'UP PWD' },
  ];
  externalSchemes.forEach(e => db.seed('externalSchemes', e.id, e));

  // ─── Community Reports ────────────────────────────────────────────────────
  const communityReports = [
    { id: 'cr-001', projectId: 'pr-002', reporterId: 'citizen-001', name: 'Ramakant Verma', statusClaim: 'NOT_STARTED', evidenceText: 'I live 500m from the site. No work is visible, no machinery, just a board that says work in progress.', lat: 25.3180, lng: 82.9740, verified: false, createdAt: '2025-01-15T10:00:00.000Z' },
    { id: 'cr-002', projectId: 'pr-002', reporterId: 'citizen-002', name: 'Sunita Devi', statusClaim: 'LESS_THAN_25_PCT', evidenceText: 'Some marking has been done but road work hasn\'t started. Officials reported 22% but I see maybe 5% ground level.', lat: 25.3178, lng: 82.9741, verified: false, createdAt: '2025-01-18T14:00:00.000Z' },
    { id: 'cr-003', projectId: 'pr-008', reporterId: 'citizen-003', name: 'Ashok Gupta', statusClaim: 'NOT_STARTED', evidenceText: 'The parking project in Hazratganj — only a hoarding has been put up. No construction. Land still in dispute.', lat: 26.8470, lng: 80.9463, verified: false, createdAt: '2024-12-20T11:00:00.000Z' },
    { id: 'cr-004', projectId: 'pr-021', reporterId: 'citizen-004', name: 'K Venkataramana', statusClaim: 'NOT_STARTED', evidenceText: 'The Krishna riverfront project — some foundation stones were laid with great fanfare but since then nothing. The site is unused.', lat: 16.5065, lng: 80.6482, verified: false, createdAt: '2025-02-10T09:00:00.000Z' },
    { id: 'cr-005', projectId: 'pr-007', reporterId: 'citizen-005', name: 'Lakshmi Amma', statusClaim: 'MORE_THAN_75_PCT', evidenceText: 'Health centre is nearly done! Pharmacy is functional, lab is being set up. Doctors have started visiting.', lat: 8.4857, lng: 76.9490, verified: true, createdAt: '2025-03-01T08:00:00.000Z' },
    { id: 'cr-006', projectId: 'pr-019', reporterId: 'citizen-006', name: 'Subhasish Chakraborty', statusClaim: 'ABOUT_50_PCT', evidenceText: 'Some sections of the heritage street are beautifully done, but at least half the route is still old and unmaintained.', lat: 22.5618, lng: 88.3516, verified: true, createdAt: '2025-02-20T16:00:00.000Z' },
    { id: 'cr-007', projectId: 'pr-022', reporterId: 'citizen-007', name: 'Nirmala Devi', statusClaim: 'NOT_STARTED', evidenceText: 'Flood wall project — not even surveying has started. Last rains badly flooded our colony.', lat: 16.5005, lng: 80.6374, verified: false, createdAt: '2025-01-25T12:00:00.000Z' },
    { id: 'cr-008', projectId: 'pr-028', reporterId: 'citizen-008', name: 'Vijay Kumar', statusClaim: 'NOT_STARTED', evidenceText: 'I heard about a community hall here but there is nothing on the ground. Exactly like pr-001 which is being built 300m away.', lat: 25.3745, lng: 80.9265, verified: false, createdAt: '2025-02-05T10:00:00.000Z' },
  ];
  communityReports.forEach(r => db.seed('communityReports', r.id, r));

  // ─── Proposals ────────────────────────────────────────────────────────────
  const proposals = [
    { id: 'prop-001', mpId: 'mp-001', title: 'Construction of Indoor Sports Stadium — Varanasi', category: 'COMMUNITY', estimatedBudget: 5000000, description: 'Covered indoor sports facility with 1000 seating and multi-sport courts', lat: 25.3500, lng: 83.0100, status: 'PENDING', submittedAt: '2025-03-01T10:00:00.000Z', ministerRemarks: null },
    { id: 'prop-002', mpId: 'mp-002', title: 'Coastal Protection — Kovalam Beach', category: 'ENVIRONMENT', estimatedBudget: 6000000, description: 'Geo-textile tube barrier + natural mangrove restoration for 2km coastline', lat: 8.3988, lng: 76.9987, status: 'APPROVED', submittedAt: '2025-01-15T09:00:00.000Z', ministerRemarks: 'Strong environmental justification. Approved with quarterly progress requirement.', approvedAt: '2025-02-01T12:00:00.000Z' },
    { id: 'prop-003', mpId: 'mp-003', title: 'Expressway Connectivity Link — Lucknow Ring Road', category: 'ROADS', estimatedBudget: 8000000, description: 'Connecting road link from inner ring road to expressway', lat: 26.9000, lng: 81.0200, status: 'REJECTED', submittedAt: '2024-12-01T10:00:00.000Z', ministerRemarks: 'Budget exceeds MPLAD ceiling. Overlap with state NHAI project. Please resubmit with reduced scope.', rejectedAt: '2025-01-10T14:00:00.000Z' },
    { id: 'prop-004', mpId: 'mp-005', title: 'Solar Micro-Grid — Rural Dholka Cluster', category: 'ENERGY', estimatedBudget: 3500000, description: '100kW solar micro-grid serving 8 villages off-grid', lat: 22.7200, lng: 72.4600, status: 'PENDING', submittedAt: '2025-03-10T10:00:00.000Z', ministerRemarks: null },
    { id: 'prop-005', mpId: 'mp-006', title: 'Digital Library and Learning Hub — Old City', category: 'EDUCATION', estimatedBudget: 2000000, description: 'Digital literacy centre with 50 computers and free internet', lat: 17.3600, lng: 78.4800, status: 'APPROVED', submittedAt: '2025-02-01T10:00:00.000Z', ministerRemarks: 'Excellent initiative for underserved communities. Approved.', approvedAt: '2025-02-20T12:00:00.000Z' },
  ];
  proposals.forEach(p => db.seed('proposals', p.id, p));

  // ─── Complaints ───────────────────────────────────────────────────────────
  const complaints = [
    { id: 'comp-001', projectId: 'pr-002', complainantName: 'Mohammad Irfan', complainantPhone: '9988776655', category: 'QUALITY', description: 'Poor quality materials being used. Concrete not mixed properly.', status: 'OPEN', createdAt: '2024-11-10T10:00:00.000Z' },
    { id: 'comp-002', projectId: 'pr-008', complainantName: 'Ananya Shukla', complainantPhone: '9977665544', category: 'DELAY', description: 'Project not started even 15 months after sanction. No visible activity.', status: 'ESCALATED', createdAt: '2025-01-05T11:00:00.000Z' },
    { id: 'comp-003', projectId: 'pr-021', complainantName: 'Raghu Srinivas', complainantPhone: '9966554433', category: 'FRAUD', description: 'Contractor showing progress photos from another site. The Krishna riverfront is untouched.', status: 'UNDER_INVESTIGATION', createdAt: '2025-02-15T14:00:00.000Z' },
    { id: 'comp-004', projectId: 'pr-028', complainantName: 'Prashant Mishra', complainantPhone: '9955443322', category: 'DUPLICATE', description: 'There is already a community hall being built 300m away under pr-001. This seems like the same project.', status: 'OPEN', createdAt: '2025-02-06T09:00:00.000Z' },
  ];
  complaints.forEach(c => db.seed('complaints', c.id, c));

  db.markSeeded();
  console.log('✅ Seed data loaded: MPs, Agencies, Projects, Reports, Proposals, Complaints, External Schemes');
}

module.exports = { seedAll };
