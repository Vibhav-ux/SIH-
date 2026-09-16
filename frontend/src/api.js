// API Client
const BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL + '/api'
  : '/api';

// ── Simple In-Memory Cache (TTL: 60s for lists, 30s for single records) ──────
const _cache = new Map();
function cached(key, fetcher, ttlMs = 60_000) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data);
  return fetcher().then(data => {
    _cache.set(key, { data, ts: Date.now() });
    return data;
  });
}
export function clearCache() { _cache.clear(); }

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Citizen API
export const citizenApi = {
  getStats: () => req('/citizen/stats'),
  getProjects: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return req(`/citizen/projects${params ? '?' + params : ''}`);
  },
  getProject: (id) => req(`/citizen/projects/${id}`),
  getMPs: () => req('/citizen/mps'),
  submitReport: (data) => req('/citizen/report', { method: 'POST', body: data }),
  submitComplaint: (data) => req('/citizen/complaint', { method: 'POST', body: data }),
};

// MP API — includes both real-MP (Neon) and project-data endpoints
export const mpApi = {
  // Real MP data from Neon (778 MPs from CSVs)
  getAll: ({ state, type, search, limit = 100, offset = 0 } = {}) => {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    params.set('limit', limit);
    params.set('offset', offset);
    return req(`/mp/all?${params.toString()}`);
  },
  getStats: () => cached('mp/stats', () => req('/mp/stats'), 120_000),
  getStates: () => cached('mp/states', () => req('/mp/states'), 300_000),
  getNeonMp: (mpId) => cached(`mp/neon/${mpId}`, () => req(`/mp/neon/${mpId}`), 120_000),

  // Project data (in-memory store, persisted to Neon)
  getOverview: (mpId) => req(`/mp/${mpId}/overview`),
  getProjects: (mpId) => req(`/mp/${mpId}/projects`),
  getProposals: (mpId) => req(`/mp/${mpId}/proposals`),
  createProposal: (mpId, data) => req(`/mp/${mpId}/proposals`, { method: 'POST', body: data }),
  getAlerts: (mpId) => req(`/mp/${mpId}/alerts`),
};

// Ministry API
export const ministryApi = {
  getOverview: () => req('/ministry/overview'),
  getProposals: (status) => req(`/ministry/proposals${status ? '?status=' + status : ''}`),
  getProjects: () => req('/ministry/projects'),
  approveProposal: (id, remarks) => req(`/ministry/proposals/${id}/approve`, { method: 'POST', body: { remarks } }),
  rejectProposal: (id, remarks) => req(`/ministry/proposals/${id}/reject`, { method: 'POST', body: { remarks } }),
};

// Agency API
export const agencyApi = {
  getAllTrust: () => req('/agency/trust'),
  getAgency: (id) => req(`/agency/${id}`),
  getProjects: (id) => req(`/agency/${id}/projects`),
  submitProgress: (agencyId, projectId, data) => req(`/agency/${agencyId}/progress/${projectId}`, { method: 'POST', body: data }),
};

// AI API
export const aiApi = {
  getAllRisk: () => cached('ai/risk', () => req('/ai/risk'), 60_000),
  getProjectRisk: (id) => req(`/ai/risk/${id}`),
  getDuplicates: () => cached('ai/duplicates', () => req('/ai/duplicates'), 60_000),
  getForecast: () => cached('ai/forecast', () => req('/ai/forecast'), 60_000),
  getCommunity: () => cached('ai/community', () => req('/ai/community'), 60_000),
  getProjectCommunity: (id) => req(`/ai/community/${id}`),
  getNexus: () => cached('ai/nexus', () => req('/ai/nexus'), 90_000),
  getDoubleFunding: () => cached('ai/double-funding', () => req('/ai/double-funding'), 60_000),
  getMPScores: () => cached('ai/mp-scores', () => req('/ai/mp-scores'), 90_000),
  getTrends: () => cached('ai/trends', () => req('/ai/trends'), 90_000),
  getAlerts: () => cached('ai/alerts', () => req('/ai/alerts'), 30_000),
};

// Audit API
export const auditApi = {
  getLedger: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/audit/ledger${qs ? '?' + qs : ''}`);
  },
  verify: () => req('/audit/verify'),
  getByTable: (table) => req(`/audit/ledger/${table}`),
};

// State API
export const stateApi = {
  getOverview: () => req('/state/overview'),
  getDistricts: (state) => req(`/state/${encodeURIComponent(state)}/districts`),
  getDistrictDetail: (state, district) => req(`/state/district/${encodeURIComponent(state)}/${encodeURIComponent(district)}`),
};

// Helpers
export function formatCurrency(amount) {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function riskColor(level) {
  if (level === 'HIGH' || level === 'HIGH_RISK') return '#f43f5e';
  if (level === 'MEDIUM' || level === 'MEDIUM_RISK') return '#f59e0b';
  return '#10b981';
}

export function statusColor(status) {
  const map = {
    COMPLETED: '#10b981', IN_PROGRESS: '#6366f1',
    STALLED: '#f43f5e', PENDING: '#f59e0b',
    APPROVED: '#10b981', REJECTED: '#f43f5e',
  };
  return map[status] || '#94a3b8';
}

export function gradeColor(grade) {
  const map = { A: '#10b981', B: '#6366f1', C: '#f59e0b', D: '#f97316', F: '#f43f5e' };
  return map[grade] || '#94a3b8';
}
