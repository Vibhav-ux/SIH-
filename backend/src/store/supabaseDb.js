// Supabase Data Store for Backend Routes
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Supabase] Missing SUPABASE_URL or SUPABASE_KEY in .env.local');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeRow(row) {
  return {
    id: row.id,
    name: row.mp_name,
    constituency: row.constituency,
    state: row.state,
    house: row.house,
    totalFunds: Number(row.allocated_amount) || 0,
    usedFunds: Number(row.total_expenditure) || 0,
    utilizationPercentage: Number(row.utilization_percentage) || 0,
    completedWorksCount: Number(row.completed_works_count) || 0,
    recommendedWorksCount: Number(row.recommended_works_count) || 0,
    completionRate: Number(row.completion_rate) || 0,
    unspentAmount: Number(row.unspent_amount) || 0,
    paymentGapPercentage: Number(row.payment_gap_percentage) || 0,
    riskScore: Number(row.risk_score) || 0,
    type: row.house === 'Lok Sabha' ? 'Lok Sabha' : 'Rajya Sabha'
  };
}

async function getAllMps({ state, type, search, limit = 100, offset = 0 } = {}) {
  let query = supabase.from('mps').select('*');
  if (state) query = query.ilike('state', state);
  if (type) query = query.ilike('house', type);
  if (search) query = query.or(`mp_name.ilike.%${search}%,constituency.ilike.%${search}%`);

  query = query.range(offset, offset + limit - 1).order('mp_name', { ascending: true });
  const { data, error } = await query;
  if (error) {
    console.error('Supabase query error:', error);
    return [];
  }
  return data.map(normalizeRow);
}

async function getMpById(id) {
  const { data, error } = await supabase.from('mps').select('*').eq('id', id).single();
  if (error || !data) {
    console.error('Supabase getMpById error:', error);
    return null;
  }
  return normalizeRow(data);
}

async function getMpStats() {
  const { data, error } = await supabase.from('mps').select('house, allocated_amount, total_expenditure');
  if (error) return [];
  const stats = data.reduce((acc, row) => {
    const type = row.house || 'Unknown';
    if (!acc[type]) acc[type] = { type, count: 0, total_funds: 0, used_funds: 0 };
    acc[type].count += 1;
    acc[type].total_funds += Number(row.allocated_amount) || 0;
    acc[type].used_funds += Number(row.total_expenditure) || 0;
    return acc;
  }, {});
  return Object.values(stats).map(s => ({ ...s, avg_funds: s.count > 0 ? (s.total_funds / s.count) : 0 }));
}

async function getStates() {
  const { data, error } = await supabase.from('mps').select('state');
  if (error) return [];
  const states = [...new Set(data.map(r => r.state).filter(Boolean))];
  return states.sort();
}

module.exports = { getAllMps, getMpById, getMpStats, getStates, supabase };
