import { useEffect, useState } from 'react';
import { agencyApi } from '../api';

export default function AgencyTrustRegistry() {
  const role = localStorage.getItem('mplad_role') || 'citizen';
  const myAgencyId = (role === 'agency') ? localStorage.getItem('mplad_mp_id') : null;

  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [sortBy, setSortBy] = useState('trustScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    agencyApi.getAllTrust().then(data => {
      setAgencies(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filtered = agencies
    .filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.state?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRisk && a.riskLevel !== filterRisk) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  const scoreColor = (score) => score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';

  const SortIcon = ({ col }) => (
    <span style={{ color: sortBy === col ? '#6366f1' : '#475569', marginLeft: 4, fontSize: 10 }}>
      {sortBy === col ? (sortDir === 'desc' ? '▼' : '▲') : '↕'}
    </span>
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1300px] mx-auto">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, fontWeight: 600, color: '#d97706', marginBottom: 16 }}>
            🌐 National Registry
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Agency Trust Registry
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, maxWidth: 600 }}>
            Cross-constituency reputation scores that follow agencies across MPs, districts, and states. A national accountability layer — flagging bad actors before they're hired again.
          </p>
        </div>

        {/* Risk Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          {[
            { label: 'Low Risk Agencies', count: agencies.filter(a => a.riskLevel === 'LOW_RISK').length, color: '#10b981', icon: '✅' },
            { label: 'Medium Risk Agencies', count: agencies.filter(a => a.riskLevel === 'MEDIUM_RISK').length, color: '#f59e0b', icon: '⚠️' },
            { label: 'High Risk Agencies', count: agencies.filter(a => a.riskLevel === 'HIGH_RISK').length, color: '#f43f5e', icon: '🚨' },
          ].map(c => (
            <div key={c.label} className="glass-card-static p-4 md:p-5 flex items-center gap-4">
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: `${c.color}15`, border: `1px solid ${c.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{c.icon}</div>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: c.color }}>{c.count}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 w-full">
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input className="input-glass" style={{ paddingLeft: 38 }} placeholder="Search agency or state..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-glass" style={{ flex: '0 1 180px' }} value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
            <option value="">All Risk Levels</option>
            <option value="LOW_RISK">Low Risk</option>
            <option value="MEDIUM_RISK">Medium Risk</option>
            <option value="HIGH_RISK">High Risk</option>
          </select>
          <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center' }}>
            {filtered.length} agencies
          </div>
        </div>

        {/* Table */}
        <div className="glass-card-static p-0 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[800px]">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agency</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('trustScore')}>Trust Score <SortIcon col="trustScore" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('completionRate')}>Completion <SortIcon col="completionRate" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('avgDelayDays')}>Avg Delay <SortIcon col="avgDelayDays" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('fraudFlags')}>Fraud Flags <SortIcon col="fraudFlags" /></th>
                  <th>MPs Served</th>
                  <th>Risk Level</th>
                  <th>Shell Alert</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array(6).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(9).fill(0).map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 14, width: '80%' }} /></td>
                      ))}
                    </tr>
                  ))
                  : filtered.map((a, i) => {
                    const isOwn = myAgencyId ? a.id === myAgencyId : true;
                    const canSeeDetails = !myAgencyId || isOwn; // agencies only see own details
                    return (
                    <tr key={a.id} style={{ cursor: 'pointer', background: isOwn && myAgencyId ? 'rgba(99,102,241,0.05)' : undefined }} onClick={() => canSeeDetails && setSelected(a)}>
                      <td style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>#{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                          {a.name} {isOwn && myAgencyId && <span style={{ fontSize: 10, background: '#eef2ff', color: '#4f46e5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>YOU</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{a.state} · {a.category}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-track" style={{ width: 50 }}>
                            <div className="progress-fill" style={{ width: `${a.trustScore}%`, background: scoreColor(a.trustScore) }} />
                          </div>
                          <span style={{ fontWeight: 700, color: scoreColor(a.trustScore), fontSize: 13 }}>{a.trustScore}</span>
                        </div>
                      </td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>{canSeeDetails ? `${a.completionRate}%` : '—'}</td>
                      <td style={{ color: canSeeDetails ? (a.avgDelayDays > 60 ? '#f43f5e' : a.avgDelayDays > 30 ? '#f59e0b' : '#10b981') : '#94a3b8', fontWeight: 600 }}>
                        {canSeeDetails ? `${a.avgDelayDays}d` : '—'}
                      </td>
                      <td>
                        {canSeeDetails ? (
                          <span style={{ fontWeight: 700, fontSize: 14, color: a.fraudFlags >= 3 ? '#f43f5e' : a.fraudFlags >= 1 ? '#f59e0b' : '#10b981' }}>
                            {a.fraudFlags} {a.fraudFlags >= 3 ? '🚨' : a.fraudFlags >= 1 ? '⚠️' : ''}
                          </span>
                        ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>🔒 Restricted</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{canSeeDetails ? a.mpCount : '—'}</td>
                      <td>
                        <span className={`badge badge-${a.riskLevel === 'LOW_RISK' ? 'low' : a.riskLevel === 'MEDIUM_RISK' ? 'medium' : 'high'}`}>
                          {a.riskLevel?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {a.shellAlert ? <span style={{ color: '#f43f5e', fontWeight: 700 }}>🔴 YES</span> : <span style={{ color: '#64748b' }}>—</span>}
                      </td>
                    </tr>
                   ); })}

              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }} onClick={() => setSelected(null)}>
            <div style={{
              background: 'var(--text-primary)', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: 32, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>{selected.name}</h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{selected.category} · {selected.state}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'var(--text-primary)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontSize: 16 }}>✕</button>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Completion', value: `${selected.completionRate}%`, color: '#10b981' },
                  { label: 'Delay', value: `${selected.delayScore}%`, color: '#4f46e5' },
                  { label: 'Fraud', value: `${selected.fraudScore}%`, color: '#f59e0b' },
                  { label: 'Community', value: `${selected.communityScore}%`, color: '#8b5cf6' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--text-primary)', borderRadius: 10 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: m.color, fontFamily: 'Outfit, sans-serif' }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {[
                { label: 'Director', value: selected.director },
                { label: 'Registered Address', value: selected.registeredAddress },
                { label: 'GSTIN', value: selected.gstIn },
                { label: 'Avg Delay', value: `${selected.avgDelayDays} days` },
                { label: 'Total Projects', value: selected.totalProjects },
                { label: 'Completed Projects', value: selected.completedProjects },
                { label: 'Fraud Flags', value: selected.fraudFlags },
              ].map(d => (
                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: d.label === 'Fraud Flags' && d.value > 0 ? '#f43f5e' : 'var(--text-primary)' }}>{d.value}</span>
                </div>
              ))}

              {selected.shellAlert && (
                <div style={{ marginTop: 20, padding: 14, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
                  🔴 <strong>Shell Entity Alert:</strong> This agency shares a registered address or director name with another flagged entity. Possible shell company network for bid-splitting or fraud.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

