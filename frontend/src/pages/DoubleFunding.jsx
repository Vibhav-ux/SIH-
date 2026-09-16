import { useEffect, useState } from 'react';
import { aiApi, formatCurrency } from '../api';

export default function DoubleFunding() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    aiApi.getDoubleFunding().then(d => {
      setData(d);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const flags = (data?.flags || []).filter(f => !filterSeverity || f.severity === filterSeverity);
  const severityColor = s => s === 'HIGH' ? '#f43f5e' : s === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, fontWeight: 600, color: '#d97706', marginBottom: 16 }}>
            💰 Tier 1 Feature — Cross-Scheme Analysis
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Cross-Scheme Double Funding Detector
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, maxWidth: 700, lineHeight: 1.7 }}>
            One of the most damaging MPLAD fraud patterns: the same physical project billed simultaneously to MPLAD and another central/state scheme. This checks GPS proximity + description similarity + date overlap — looking outside MPLAD's own data silo.
          </p>
        </div>

        {/* Summary */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Suspicious Pairs', value: data.total, color: '#f59e0b', icon: '🔍' },
              { label: 'High Confidence Flags', value: data.highConfidence, color: '#f43f5e', icon: '🚨' },
              { label: 'Combined Funding at Risk', value: formatCurrency(data.combinedAtRisk || 0), color: '#ef4444', icon: '💰', isText: true },
            ].map(s => (
              <div key={s.label} className="glass-card-static" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}15`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: s.isText ? 20 : 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { icon: '📍', title: 'GPS Proximity', desc: 'Matches MPLAD projects to external scheme projects within 500 metres — same physical location' },
            { icon: '📄', title: 'Description Similarity', desc: 'Levenshtein similarity on title + description to catch renamed but identical projects' },
            { icon: '📅', title: 'Date Overlap', desc: 'Checks if project timeframes overlap — simultaneous billing from two scheme pots' },
          ].map(c => (
            <div key={c.icon} className="glass-card-static" style={{ padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
            <button key={s} onClick={() => setFilterSeverity(s)} style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filterSeverity === s
                ? (s ? `${severityColor(s)}25` : 'rgba(99,102,241,0.3)')
                : 'var(--text-primary)',
              color: filterSeverity === s
                ? (s ? severityColor(s) : '#6366f1')
                : '#64748b',
            }}>{s || 'All Severities'}</button>
          ))}
        </div>

        {/* Flagged Pairs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading
            ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass-card-static" style={{ padding: 24, height: 200 }}>
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 20 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="skeleton" style={{ height: 80 }} />
                  <div className="skeleton" style={{ height: 80 }} />
                </div>
              </div>
            ))
            : flags.map((f, i) => (
              <div key={i} className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header bar */}
                <div style={{
                  padding: '14px 24px',
                  background: f.severity === 'HIGH' ? 'rgba(244,63,94,0.08)' : 'rgba(245,158,11,0.08)',
                  borderBottom: `1px solid ${severityColor(f.severity)}25`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>💰</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Potential Double Funding</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{f.mpladjProject.state}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Combined Risk</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#f43f5e', fontFamily: 'Outfit' }}>{formatCurrency(f.combinedPublicFunding)}</div>
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: `${severityColor(f.severity)}15`, border: `1px solid ${severityColor(f.severity)}30`,
                      color: severityColor(f.severity),
                    }}>{f.overlap.confidenceScore}% confidence · {f.severity}</span>
                  </div>
                </div>

                {/* Side-by-side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {[
                    { label: 'MPLAD Fund', project: f.mpladjProject, color: '#4f46e5', scheme: 'MPLAD' },
                    { label: f.externalScheme.scheme + ' Scheme', project: { ...f.externalScheme, mpName: f.externalScheme.contractor, status: 'EXTERNAL', completionPct: 0 }, color: '#f59e0b', scheme: f.externalScheme.scheme },
                  ].map((side, j) => (
                    <div key={j} style={{ padding: 20, borderRight: j === 0 ? '1px solid #e2e8f0' : 'none' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: side.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                        {side.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>{side.project.title}</div>
                      {side.project.mpName && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>👤 {side.project.mpName}</div>}
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                        📅 {side.project.startDate} → {side.project.endDate}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                        📍 {side.project.lat?.toFixed(4)}, {side.project.lng?.toFixed(4)}
                      </div>
                      <div style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 800, color: side.color }}>
                        {formatCurrency(side.project.budget)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overlap metrics */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'GPS Distance', value: `${f.overlap.distanceMeters}m`, color: f.overlap.distanceMeters < 200 ? '#f43f5e' : '#f59e0b' },
                    { label: 'Title Similarity', value: `${f.overlap.titleSimilarity}%`, color: f.overlap.titleSimilarity >= 70 ? '#f43f5e' : '#f59e0b' },
                    { label: 'Desc Similarity', value: `${f.overlap.descriptionSimilarity}%`, color: f.overlap.descriptionSimilarity >= 60 ? '#f43f5e' : '#f59e0b' },
                    { label: 'Date Overlap', value: f.overlap.datesOverlap ? 'YES' : 'NO', color: f.overlap.datesOverlap ? '#f43f5e' : '#10b981' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
          {!loading && flags.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No double-funding pairs found in selected filter</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

