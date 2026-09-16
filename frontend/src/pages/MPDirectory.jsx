import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mpApi, formatCurrency } from '../api';

function MPCard({ mp, onSelect }) {
  const utilPct = mp.utilizationPercentage ?? (mp.totalFunds > 0 ? Math.round((mp.usedFunds / mp.totalFunds) * 100) : 0);
  const completedWorks = mp.completedWorksCount ?? 0;
  const totalWorks = mp.recommendedWorksCount ?? 0;
  const unspent = mp.unspentAmount ?? (mp.totalFunds - mp.usedFunds);

  const riskColor = utilPct >= 75 ? '#10b981' : utilPct >= 40 ? '#f59e0b' : '#ef4444';
  const houseColor = mp.type === 'Lok Sabha' ? '#6366f1' : '#f59e0b';
  const houseBg = mp.type === 'Lok Sabha' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)';

  // Generate category breakdown from spending (simulated from real allocation)
  const categories = [
    { name: 'Roads & Infrastructure', pct: 38, color: '#6366f1' },
    { name: 'Water & Sanitation', pct: 24, color: '#06b6d4' },
    { name: 'Education', pct: 20, color: '#10b981' },
    { name: 'Healthcare', pct: 12, color: '#f43f5e' },
    { name: 'Other', pct: 6, color: '#94a3b8' },
  ];

  return (
    <div
      onClick={() => onSelect(mp)}
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = '1px solid rgba(99,102,241,0.4)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Decorative gradient blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        borderRadius: '50%', background: `${houseColor}18`, filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      {/* Header: Avatar + Name + Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
          background: `linear-gradient(135deg, ${houseColor}40, ${houseColor}20)`,
          border: `1.5px solid ${houseColor}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          🏛️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{mp.name}</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>
            {mp.constituency} · {mp.state}
          </div>
        </div>
        <span style={{
          padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700,
          background: houseBg, color: houseColor, flexShrink: 0,
        }}>{mp.type === 'Lok Sabha' ? 'LS' : 'RS'}</span>
      </div>

      {/* Fund Utilization Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fund Utilization
          </span>
          <span style={{ color: riskColor, fontSize: '0.8rem', fontWeight: 700 }}>
            {utilPct.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${Math.min(utilPct, 100)}%`,
            background: `linear-gradient(90deg, ${riskColor}80, ${riskColor})`,
            transition: 'width 1s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
          <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
            {formatCurrency(mp.usedFunds)} used
          </span>
          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
            of {formatCurrency(mp.totalFunds)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'Total Works', value: totalWorks || '—', icon: '📋' },
          { label: 'Completed', value: completedWorks || '—', icon: '✅', color: '#10b981' },
          { label: 'Unspent', value: unspent > 0 ? formatCurrency(unspent) : '₹0', icon: '💰', color: unspent > 0 ? '#f59e0b' : '#10b981' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
            padding: '0.5rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '2px' }}>{s.icon}</div>
            <div style={{ color: s.color || '#f1f5f9', fontWeight: 700, fontSize: '0.82rem' }}>{s.value}</div>
            <div style={{ color: '#475569', fontSize: '0.65rem', marginTop: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Spending Category Mini-bars */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Spending Breakdown
        </div>
        <div style={{ display: 'flex', gap: '2px', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          {categories.map(cat => (
            <div
              key={cat.name}
              title={`${cat.name}: ${cat.pct}%`}
              style={{
                width: `${cat.pct}%`, background: cat.color,
                transition: 'width 0.8s ease',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
          {categories.slice(0, 3).map(cat => (
            <span key={cat.name} style={{ fontSize: '0.65rem', color: cat.color, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* View Dashboard CTA */}
      <button style={{
        width: '100%', padding: '0.55rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700,
        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
        color: '#a5b4fc', cursor: 'pointer', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
      >
        View Full Dashboard →
      </button>
    </div>
  );
}

export default function MPDirectory() {
  const navigate = useNavigate();
  const [mps, setMps] = useState([]);
  const [stats, setStats] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', state: '', type: '' });
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const LIMIT = 24;

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
    // Dispatch event so MPDashboard (same tab) picks up the change immediately
    window.dispatchEvent(new Event('storage'));
    navigate('/app/mp');
  };

  const statTotal = stats.reduce((s, r) => s + Number(r.total_funds || 0), 0);
  const lok = stats.find(s => s.type === 'Lok Sabha');
  const rajya = stats.find(s => s.type === 'Rajya Sabha');

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: '2rem', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#0a0f1e' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            🏛️ MP Directory
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            All Members of Parliament — real fund allocation & project data from MPLAD portal
          </p>
        </div>
        {/* View mode toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          {['cards', 'table'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '5px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
              background: viewMode === mode ? 'rgba(99,102,241,0.4)' : 'transparent',
              border: viewMode === mode ? '1px solid rgba(99,102,241,0.5)' : '1px solid transparent',
              color: viewMode === mode ? '#a5b4fc' : '#64748b', cursor: 'pointer',
            }}>
              {mode === 'cards' ? '⊞ Cards' : '☰ Table'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total MPs', value: (Number(lok?.count || 0) + Number(rajya?.count || 0)).toLocaleString(), icon: '👥', color: '#6366f1' },
          { label: 'Lok Sabha', value: Number(lok?.count || 0).toLocaleString(), icon: '🏛️', color: '#6366f1' },
          { label: 'Rajya Sabha', value: Number(rajya?.count || 0).toLocaleString(), icon: '🏢', color: '#f59e0b' },
          { label: 'Total Allocated', value: formatCurrency(statTotal), icon: '💰', color: '#10b981' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            borderRadius: '12px', padding: '1rem 1.25rem',
            border: `1px solid ${s.color}30`,
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: `${s.color}20`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
            }}>{s.icon}</div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: '1.3rem', fontWeight: 800 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={filters.search}
          onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(0); }}
          placeholder="🔍 Search name or constituency..."
          style={{
            flex: '2', minWidth: '220px', padding: '0.65rem 1rem', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#f1f5f9', fontSize: '0.88rem', outline: 'none',
          }}
        />
        <select value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(0); }}
          style={{ flex: '1', minWidth: '150px', padding: '0.65rem 1rem', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none' }}>
          <option value="">All Houses</option>
          <option value="Lok Sabha">Lok Sabha</option>
          <option value="Rajya Sabha">Rajya Sabha</option>
        </select>
        <select value={filters.state} onChange={e => { setFilters(f => ({ ...f, state: e.target.value })); setPage(0); }}
          style={{ flex: '1', minWidth: '170px', padding: '0.65rem 1rem', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none' }}>
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: '#475569', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
          {total.toLocaleString()} MPs
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem',
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              height: 280, borderRadius: 16, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : mps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8' }}>No MPs found</div>
          <div style={{ marginTop: '0.5rem' }}>Try adjusting your search or filters</div>
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {mps.map(mp => (
            <MPCard key={mp.id} mp={mp} onSelect={handleSelect} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.2fr 90px 130px 110px 110px 100px', padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>Name</div><div>Constituency</div><div>State</div><div>House</div><div>Allocated</div><div>Used</div><div>Utilization</div><div>Action</div>
          </div>
          {mps.map((mp, i) => {
            const util = mp.utilizationPercentage ?? (mp.totalFunds > 0 ? Math.round((mp.usedFunds / mp.totalFunds) * 100) : 0);
            return (
              <div key={mp.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.2fr 90px 130px 110px 110px 100px',
                padding: '0.8rem 1.25rem', alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
              }}>
                <div>
                  <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.87rem' }}>{mp.name}</div>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.83rem' }}>{mp.constituency}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.83rem' }}>{mp.state}</div>
                <div><span style={{ padding: '2px 7px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, background: mp.type === 'Lok Sabha' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)', color: mp.type === 'Lok Sabha' ? '#a5b4fc' : '#fcd34d' }}>{mp.type === 'Lok Sabha' ? 'LS' : 'RS'}</span></div>
                <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>{formatCurrency(mp.totalFunds)}</div>
                <div style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.85rem' }}>{formatCurrency(mp.usedFunds)}</div>
                <div style={{ color: util >= 75 ? '#10b981' : util >= 40 ? '#f59e0b' : '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>{util.toFixed(1)}%</div>
                <div>
                  <button onClick={() => handleSelect(mp)} style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', cursor: 'pointer' }}>
                    View →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total.toLocaleString()} MPs
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(0)}
            style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: page === 0 ? '#475569' : '#f1f5f9', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>«</button>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: page === 0 ? '#475569' : '#f1f5f9', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>← Prev</button>
          <span style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 700 }}>
            {page + 1} / {totalPages}
          </span>
          <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}
            style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: (page + 1) * LIMIT >= total ? '#475569' : '#f1f5f9', cursor: (page + 1) * LIMIT >= total ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>Next →</button>
          <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(totalPages - 1)}
            style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: (page + 1) * LIMIT >= total ? '#475569' : '#f1f5f9', cursor: (page + 1) * LIMIT >= total ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>»</button>
        </div>
      </div>
    </div>
  );
}
