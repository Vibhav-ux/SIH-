import { useEffect, useState } from 'react';
import { aiApi, formatCurrency } from '../api';

const gradeColors = { A: '#10b981', B: '#4f46e5', C: '#f59e0b', D: '#f97316', F: '#f43f5e' };
const gradeDesc = { A: 'Excellent', B: 'Good', C: 'Average', D: 'Below Average', F: 'Poor' };

export default function MPScorecard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('accountabilityScore');
  const [sortDir, setSortDir] = useState('desc');
  const [filterGrade, setFilterGrade] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    aiApi.getMPScores().then(d => {
      setData(d);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const scores = data?.scores || [];
  const filtered = scores
    .filter(s => !filterGrade || s.grade === filterGrade)
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.constituency?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q) ||
        s.party?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortBy] ?? (a.metrics?.[sortBy] ?? 0);
      const bv = b[sortBy] ?? (b.metrics?.[sortBy] ?? 0);
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  const SortIcon = ({ col }) => (
    <span style={{ color: sortBy === col ? '#6366f1' : '#475569', marginLeft: 4, fontSize: 10 }}>
      {sortBy === col ? (sortDir === 'desc' ? '▼' : '▲') : '↕'}
    </span>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 12, fontWeight: 600, color: '#6366f1', marginBottom: 16 }}>
            📋 Tier 1 Feature — Public Accountability
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            MP Accountability Scorecards
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, maxWidth: 700, lineHeight: 1.7 }}>
            Transparent, data-driven scorecards — same formula applied equally to every MP. Published on the public citizen portal for election-time accountability. No accusations, just numbers.
          </p>
        </div>

        {/* National Distribution */}
        {data && (
          <div className="glass-card-static" style={{ padding: 28, marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>National Average Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 48, fontWeight: 900, color: '#4f46e5' }}>{data.nationalAverage}</span>
                  <span style={{ fontSize: 20, color: '#64748b' }}>/100</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {Object.entries(data.gradeDistribution || {}).map(([grade, count]) => (
                  <div key={grade} style={{
                    textAlign: 'center', padding: '12px 16px', borderRadius: 12,
                    background: `${gradeColors[grade]}15`,
                    border: `1px solid ${gradeColors[grade]}30`,
                    minWidth: 60,
                  }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: gradeColors[grade] }}>{count}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: gradeColors[grade] }}>Grade {grade}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formula explanation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {[
                { label: 'Completion Ratio', weight: '25%', color: '#10b981' },
                { label: 'Fund Utilization', weight: '25%', color: '#4f46e5' },
                { label: 'Delay Score', weight: '20%', color: '#f59e0b' },
                { label: 'Fraud Flag Rate', weight: '20%', color: '#f43f5e' },
                { label: 'Community Score', weight: '10%', color: '#8b5cf6' },
              ].map(m => (
                <div key={m.label} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 10, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: 'Outfit, sans-serif' }}>{m.weight}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Grade Filter */}
        <div style={{ marginBottom: 20 }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, pointerEvents: 'none', zIndex: 1, color: '#6366f1',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search by MP name, constituency, state or party..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '13px 48px 13px 44px',
                borderRadius: 14,
                border: '2px solid rgba(99,102,241,0.25)',
                borderLeft: '4px solid #6366f1',
                fontSize: 14, color: '#1e1b4b',
                background: 'linear-gradient(135deg, rgba(238,242,255,0.9), rgba(245,243,255,0.9))',
                outline: 'none',
                boxShadow: '0 2px 12px rgba(99,102,241,0.12)',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.25s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 4px 20px rgba(99,102,241,0.25)';
                e.target.style.background = 'linear-gradient(135deg, rgba(224,231,255,0.95), rgba(237,233,254,0.95))';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(99,102,241,0.25)';
                e.target.style.boxShadow = '0 2px 12px rgba(99,102,241,0.12)';
                e.target.style.background = 'linear-gradient(135deg, rgba(238,242,255,0.9), rgba(245,243,255,0.9))';
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(99,102,241,0.1)', border: 'none', cursor: 'pointer',
                  borderRadius: 6, padding: '2px 6px',
                  fontSize: 13, color: '#6366f1', fontWeight: 700,
                }}
              >✕</button>
            )}
          </div>

          {/* Grade Filter Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['', 'A', 'B', 'C', 'D', 'F'].map(g => (
              <button key={g} onClick={() => setFilterGrade(g)} style={{
                padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: filterGrade === g
                  ? (g ? `${gradeColors[g]}30` : 'rgba(99,102,241,0.3)')
                  : 'var(--text-primary)',
                color: filterGrade === g
                  ? (g ? gradeColors[g] : '#6366f1')
                  : '#64748b',
              }}>
                {g || 'All Grades'}
              </button>
            ))}
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
              {filtered.length} MP{filtered.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Scorecards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
          {loading
            ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="glass-card-static" style={{ padding: 24, height: 220 }}>
                <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 48, width: '30%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 6, width: '100%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 6, width: '80%' }} />
              </div>
            ))
            : filtered.map((mp, rank) => (
              <div key={mp.mpId} className="glass-card" onClick={() => setSelected(mp)} style={{ padding: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                {/* Rank badge */}
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  fontSize: 11, color: '#64748b', fontWeight: 700,
                }}>#{rank + 1}</div>

                {/* Grade */}
                <div style={{
                  width: 56, height: 56, borderRadius: 14, marginBottom: 14,
                  background: `${gradeColors[mp.grade]}20`,
                  border: `2px solid ${gradeColors[mp.grade]}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900,
                  color: gradeColors[mp.grade],
                }}>{mp.grade}</div>

                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  {mp.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  {mp.constituency} · {mp.party}
                </div>

                {/* Score bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>Accountability Score</span>
                    <span style={{ fontWeight: 700, color: gradeColors[mp.grade] }}>{mp.accountabilityScore}/100</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${mp.accountabilityScore}%`, background: `linear-gradient(90deg, ${gradeColors[mp.grade]}, ${gradeColors[mp.grade]}aa)` }} />
                  </div>
                </div>

                {/* Mini metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'Done', value: `${mp.metrics.completionRatioPct}%`, color: '#10b981' },
                    { label: 'Funds', value: `${mp.metrics.fundUtilizationPct}%`, color: '#4f46e5' },
                    { label: 'Stalled', value: mp.metrics.stalledProjects, color: mp.metrics.stalledProjects > 0 ? '#f43f5e' : '#10b981' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center', padding: '6px 4px', background: '#f1f5f9', borderRadius: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Bottom accent */}
                <div style={{ position: 'absolute', bottom: 0, left: 24, right: 24, height: 2, background: `linear-gradient(90deg, ${gradeColors[mp.grade]}, transparent)`, borderRadius: 1 }} />
              </div>
            ))
          }
        </div>

        {/* Detail Modal */}
        {selected && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }} onClick={() => setSelected(null)}>
            <div style={{
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: 32, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: `${gradeColors[selected.grade]}20`, border: `2px solid ${gradeColors[selected.grade]}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Outfit, sans-serif', fontSize: 36, fontWeight: 900, color: gradeColors[selected.grade],
                  }}>{selected.grade}</div>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>{selected.name}</h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{selected.constituency} · {selected.state} · {selected.party}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontSize: 16 }}>✕</button>
              </div>

              {/* Score breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Completion', value: selected.breakdown.completionScore, max: 25, color: '#10b981' },
                  { label: 'Utilization', value: selected.breakdown.utilizationScore, max: 25, color: '#4f46e5' },
                  { label: 'Timeliness', value: selected.breakdown.delayScore, max: 20, color: '#f59e0b' },
                  { label: 'Integrity', value: selected.breakdown.fraudScore, max: 20, color: '#f43f5e' },
                  { label: 'Community', value: selected.breakdown.communityScore, max: 10, color: '#8b5cf6' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: '10px 6px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: 'Outfit, sans-serif' }}>{m.value}</div>
                    <div style={{ fontSize: 9, color: '#64748b' }}>/ {m.max}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* All metrics */}
              {Object.entries({
                'Total Projects': selected.metrics.totalProjects,
                'Completed Projects': selected.metrics.completedProjects,
                'Completion Rate': `${selected.metrics.completionRatioPct}%`,
                'Fund Utilization': `${selected.metrics.fundUtilizationPct}%`,
                'Stalled Projects': selected.metrics.stalledProjects,
                'High Risk Projects': selected.metrics.highRiskProjects,
                'Avg Agency Fraud Flags': selected.metrics.avgFraudFlags,
                'Community Score': `${selected.metrics.communityScorePct}%`,
                'Total Funds': formatCurrency(selected.totalFunds),
              }).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

