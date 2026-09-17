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
    window.dispatchEvent(new Event('storage'));
    navigate('/app/mp');
  };

  const statTotal = stats.reduce((s, r) => s + Number(r.total_funds || 0), 0);
  const lok = stats.find(s => s.type === 'Lok Sabha');
  const rajya = stats.find(s => s.type === 'Rajya Sabha');
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 md:p-8 font-inter min-h-screen bg-[#0a0f1e] text-slate-100">

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          🏛️ MP Directory
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.3rem', fontSize: '0.87rem' }}>
          Click any MP to view their full dashboard, projects & fund utilization
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total MPs', value: (Number(lok?.count || 0) + Number(rajya?.count || 0)).toLocaleString(), color: '#6366f1' },
          { label: 'Lok Sabha', value: Number(lok?.count || 0).toLocaleString(), color: '#6366f1' },
          { label: 'Rajya Sabha', value: Number(rajya?.count || 0).toLocaleString(), color: '#f59e0b' },
          { label: 'Total Allocated', value: formatCurrency(statTotal), color: '#10b981' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl p-3 md:p-4" style={{ border: `1px solid ${s.color}25` }}>
            <div className="text-slate-500 text-[10px] md:text-xs font-semibold uppercase tracking-wider">{s.label}</div>
            <div className="font-extrabold mt-1 text-lg md:text-xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-4 items-start md:items-center">
        <input
          value={filters.search}
          onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(0); }}
          placeholder="🔍  Search name or constituency..."
          className="w-full md:flex-2 md:min-w-[200px] p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 text-slate-100 text-sm outline-none"
        />
        <div className="flex gap-2 w-full md:w-auto">
          <select value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(0); }}
            className="flex-1 p-2 md:p-3 rounded-lg bg-slate-800 border border-white/10 text-slate-100 text-sm outline-none">
            <option value="">All Houses</option>
            <option value="Lok Sabha">Lok Sabha</option>
            <option value="Rajya Sabha">Rajya Sabha</option>
          </select>
          <select value={filters.state} onChange={e => { setFilters(f => ({ ...f, state: e.target.value })); setPage(0); }}
            className="flex-1 p-2 md:p-3 rounded-lg bg-slate-800 border border-white/10 text-slate-100 text-sm outline-none">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span className="text-slate-500 text-xs hidden md:block whitespace-nowrap">
          {total.toLocaleString()} MPs
        </span>
      </div>

      {/* List */}
      <div className="bg-slate-800 rounded-xl border border-white/5 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Column Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 1.2fr 1fr 90px 160px 90px',
            padding: '0.6rem 1.25rem',
            background: 'rgba(255,255,255,0.04)',
            fontSize: '0.68rem', color: '#475569',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div>#</div>
            <div>Name</div>
            <div>Constituency</div>
            <div>State</div>
            <div>House</div>
            <div>Allocated</div>
            <div>Utilization</div>
          </div>

        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr 1.2fr 1fr 90px 160px 90px',
              padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {[32, 140, 110, 90, 50, 80, 50].map((w, j) => (
                <div key={j} style={{
                  height: 14, width: w, borderRadius: 4,
                  background: 'rgba(255,255,255,0.07)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          ))
        ) : mps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
            <div style={{ fontWeight: 600, color: '#94a3b8' }}>No MPs found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Try adjusting your search or filters</div>
          </div>
        ) : mps.map((mp, i) => {
          const util = mp.utilizationPercentage ?? (mp.totalFunds > 0 ? ((mp.usedFunds / mp.totalFunds) * 100) : 0);
          const utilColor = util >= 75 ? '#10b981' : util >= 40 ? '#f59e0b' : '#ef4444';
          const isLS = mp.type === 'Lok Sabha' || mp.house === 'Lok Sabha';

          return (
            <div
              key={mp.id}
              onClick={() => handleSelect(mp)}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr 1.2fr 1fr 90px 160px 90px',
                padding: '0.7rem 1.25rem',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Row number */}
              <div style={{ color: '#334155', fontSize: '0.75rem', fontWeight: 600 }}>
                {page * LIMIT + i + 1}
              </div>

              {/* Name */}
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9', paddingRight: '0.5rem' }}>
                {mp.name}
              </div>

              {/* Constituency */}
              <div style={{ color: '#94a3b8', fontSize: '0.83rem', paddingRight: '0.5rem' }}>
                {mp.constituency}
              </div>

              {/* State */}
              <div style={{ color: '#94a3b8', fontSize: '0.83rem', paddingRight: '0.5rem' }}>
                {mp.state}
              </div>

              {/* House badge */}
              <div>
                <span style={{
                  padding: '2px 8px', borderRadius: '5px', fontSize: '0.68rem', fontWeight: 700,
                  background: isLS ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                  color: isLS ? '#a5b4fc' : '#fcd34d',
                }}>
                  {isLS ? 'LS' : 'RS'}
                </span>
              </div>

              {/* Allocated */}
              <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                {formatCurrency(mp.totalFunds)}
              </div>

              {/* Utilization */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: utilColor,
                    width: `${Math.min(util, 100)}%`,
                  }} />
                </div>
                <span style={{ color: utilColor, fontWeight: 700, fontSize: '0.78rem', minWidth: '35px', textAlign: 'right' }}>
                  {util.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ color: '#475569', fontSize: '0.83rem' }}>
          Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total.toLocaleString()} MPs
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(0)}
            style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: page === 0 ? '#334155' : '#f1f5f9', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>«</button>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            style={{ padding: '5px 14px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: page === 0 ? '#334155' : '#f1f5f9', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>← Prev</button>
          <span style={{ padding: '5px 14px', borderRadius: 7, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 700 }}>
            {page + 1} / {totalPages}
          </span>
          <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}
            style={{ padding: '5px 14px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: (page + 1) * LIMIT >= total ? '#334155' : '#f1f5f9', cursor: (page + 1) * LIMIT >= total ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>Next →</button>
          <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(totalPages - 1)}
            style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: (page + 1) * LIMIT >= total ? '#334155' : '#f1f5f9', cursor: (page + 1) * LIMIT >= total ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>»</button>
        </div>
      </div>
    </div>
  );
}
