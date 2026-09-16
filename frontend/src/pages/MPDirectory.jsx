import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mpApi, formatCurrency } from '../api';

export default function MPDirectory() {
  const navigate = useNavigate();
  const [mps, setMps] = useState([]);
  const [stats, setStats] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', state: '', type: '' });
  const [page, setPage] = useState(0);
  const LIMIT = 50;

  const fetchMps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mpApi.getAll({
        search: filters.search || undefined,
        state: filters.state || undefined,
        type: filters.type || undefined,
        limit: LIMIT,
        offset: page * LIMIT,
      });
      setMps(data.mps || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchMps(); }, [fetchMps]);

  useEffect(() => {
    mpApi.getStats().then(setStats).catch(() => {});
    mpApi.getStates().then(setStates).catch(() => {});
  }, []);

  const handleSelect = (mp) => {
    localStorage.setItem('mplad_role', 'mp');
    localStorage.setItem('mplad_mp_id', mp.id);
    localStorage.setItem('mplad_mp_name', mp.name);
    localStorage.setItem('mplad_mp_state', mp.state);
    navigate('/app/mp');
  };

  const statTotal = stats.reduce((s, r) => s + Number(r.total_funds || 0), 0);
  const lok = stats.find(s => s.type === 'Lok Sabha');
  const rajya = stats.find(s => s.type === 'Rajya Sabha');

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
          🏛️ MP Directory
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.4rem' }}>Browse all Members of Parliament — real allocation data from MPLAD portal</p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total MPs', value: (Number(lok?.count || 0) + Number(rajya?.count || 0)).toLocaleString(), icon: '👥' },
          { label: 'Lok Sabha', value: lok?.count || 0, icon: '🏛️' },
          { label: 'Rajya Sabha', value: rajya?.count || 0, icon: '🏢' },
          { label: 'Total Allocated', value: formatCurrency(statTotal), icon: '💰' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem 1.25rem',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.3rem' }}>{s.icon} {s.label}</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={filters.search}
          onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(0); }}
          placeholder="🔍 Search name or constituency..."
          style={{
            flex: '2', minWidth: '220px', padding: '0.7rem 1rem', borderRadius: '10px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
          }}
        />
        <select
          value={filters.type}
          onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(0); }}
          style={{
            flex: '1', minWidth: '160px', padding: '0.7rem 1rem', borderRadius: '10px',
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
          }}
        >
          <option value="">All Houses</option>
          <option value="Lok Sabha">Lok Sabha</option>
          <option value="Rajya Sabha">Rajya Sabha</option>
        </select>
        <select
          value={filters.state}
          onChange={e => { setFilters(f => ({ ...f, state: e.target.value })); setPage(0); }}
          style={{
            flex: '1', minWidth: '180px', padding: '0.7rem 1rem', borderRadius: '10px',
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
          }}
        >
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 100px 130px 120px',
          padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.05)',
          fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <div>Name</div><div>Constituency</div><div>State</div><div>House</div><div>Allocated</div><div>Action</div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading MPs...</div>
        ) : mps.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No MPs found for selected filters</div>
        ) : mps.map((mp, i) => (
          <div
            key={mp.id}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 100px 130px 120px',
              padding: '0.85rem 1.25rem', alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
          >
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{mp.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>{mp.id}</div>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{mp.constituency}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{mp.state}</div>
            <div>
              <span style={{
                padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                background: mp.type === 'Lok Sabha' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)',
                color: mp.type === 'Lok Sabha' ? '#a5b4fc' : '#fcd34d',
              }}>{mp.type === 'Lok Sabha' ? 'LS' : 'RS'}</span>
            </div>
            <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.88rem' }}>
              {formatCurrency(mp.totalFunds)}
            </div>
            <div>
              <button
                onClick={() => handleSelect(mp)}
                style={{
                  padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                  background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
                  color: '#a5b4fc', cursor: 'pointer',
                }}
              >
                View →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total} MPs
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)', cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.4 : 1,
            }}
          >← Prev</button>
          <button
            disabled={(page + 1) * LIMIT >= total}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)',
              cursor: (page + 1) * LIMIT >= total ? 'not-allowed' : 'pointer',
              opacity: (page + 1) * LIMIT >= total ? 0.4 : 1,
            }}
          >Next →</button>
        </div>
      </div>
    </div>
  );
}

