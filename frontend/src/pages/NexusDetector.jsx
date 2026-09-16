import { useEffect, useState } from 'react';
import { aiApi, formatCurrency } from '../api';
import NexusGraph from '../components/NexusGraph';

export default function NexusDetector() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    aiApi.getNexus().then(d => {
      setData(d);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const patterns = data?.suspiciousPatterns || [];
  const filtered = activeFilter === 'ALL' ? patterns : patterns.filter(p => p.type === activeFilter);

  const severityColor = (s) => s === 'HIGH' ? '#f43f5e' : '#f59e0b';

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 16 }}>
            🕸️ Tier 1 Feature — Corruption Network Analysis
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Nexus Detector
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, maxWidth: 700, lineHeight: 1.7 }}>
            Maps relationships between MPs, agencies, and locations. Surfaces exclusive dealing, shell entity clusters, and geographic lock-in patterns — turning "one bad apple" detection into "mapping the whole orchard."
          </p>
        </div>

        {/* Summary Stats */}
        {data?.summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Network Nodes', value: data.summary.totalNodes, color: '#4f46e5', icon: '⬡' },
              { label: 'Relationships', value: data.summary.totalEdges, color: '#8b5cf6', icon: '🔗' },
              { label: 'Suspicious Links', value: data.summary.suspiciousEdges, color: '#f59e0b', icon: '⚠️' },
              { label: 'High-Severity Patterns', value: data.summary.highSeverityPatterns, color: '#f43f5e', icon: '🚨' },
            ].map(s => (
              <div key={s.label} className="glass-card-static" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Graph */}
        <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
          {loading ? (
            <div style={{ height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 48 }}>🕸️</div>
              <div style={{ color: '#64748b', fontSize: 14 }}>Building network graph...</div>
            </div>
          ) : (
            <NexusGraph data={data} height={600} onNodeClick={setSelectedNode} />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'flex-start' }}>

          {/* Suspicious Patterns */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                🚨 Suspicious Patterns ({patterns.length})
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {['ALL', 'EXCLUSIVE_DEALING', 'SHELL_ENTITY_CLUSTER', 'GEOGRAPHIC_TRIANGLE'].map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} style={{
                    padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600,
                    background: activeFilter === f ? 'rgba(99,102,241,0.3)' : 'var(--text-primary)',
                    color: activeFilter === f ? '#6366f1' : '#64748b',
                  }}>
                    {f === 'ALL' ? 'All' : f === 'EXCLUSIVE_DEALING' ? 'Exclusive' : f === 'SHELL_ENTITY_CLUSTER' ? 'Shell' : 'Triangle'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((p, i) => (
                <div key={i} style={{
                  padding: 20, borderRadius: 12,
                  background: p.severity === 'HIGH' ? 'rgba(244,63,94,0.06)' : 'rgba(245,158,11,0.06)',
                  border: `1px solid ${severityColor(p.severity)}30`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>
                        {p.type === 'SHELL_ENTITY_CLUSTER' ? '🔴' : p.type === 'EXCLUSIVE_DEALING' ? '🤝' : '📍'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {p.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: `${severityColor(p.severity)}15`,
                      border: `1px solid ${severityColor(p.severity)}30`,
                      color: severityColor(p.severity),
                    }}>{p.severity}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.6 }}>{p.description}</p>
                  {p.reason && <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', fontStyle: 'italic' }}>{p.reason}</p>}
                  {p.totalAmount > 0 && (
                    <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                      💰 Total funds involved: {formatCurrency(p.totalAmount)}
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No patterns in this category</div>
              )}
            </div>
          </div>

          {/* Selected Node Panel */}
          <div style={{ position: 'sticky', top: 90 }}>
            {selectedNode ? (
              <div className="glass-card-static" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      {selectedNode.type} node
                    </div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>{selectedNode.label}</h3>
                  </div>
                  <button onClick={() => setSelectedNode(null)} style={{ background: 'var(--text-primary)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, padding: '4px 8px' }}>✕</button>
                </div>

                {selectedNode.subLabel && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{selectedNode.subLabel}</div>}

                {selectedNode.type === 'AGENCY' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Trust Score</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: selectedNode.trustScore >= 70 ? '#10b981' : selectedNode.trustScore >= 50 ? '#f59e0b' : '#f43f5e' }}>{selectedNode.trustScore}/100</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Fraud Flags</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: selectedNode.fraudFlags > 0 ? '#f43f5e' : '#10b981' }}>{selectedNode.fraudFlags}</span>
                    </div>
                    {selectedNode.shellAlert && (
                      <div style={{ padding: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, fontSize: 12, color: '#dc2626', marginTop: 8 }}>
                        🔴 Shell Entity Alert detected
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.type === 'MP' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Party</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{selectedNode.party}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>State</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedNode.state}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card-static" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Click any node</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>to see entity details</div>
              </div>
            )}

            {/* Legend box */}
            <div className="glass-card-static" style={{ padding: 20, marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pattern Legend</div>
              {[
                { icon: '🤝', color: '#f59e0b', label: 'Exclusive Dealing', desc: '>70% contracts to one agency' },
                { icon: '🔴', color: '#f43f5e', label: 'Shell Cluster', desc: 'Shared address or director' },
                { icon: '📍', color: '#8b5cf6', label: 'Geographic Triangle', desc: 'MP+Agency+Location repeat' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{l.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: l.color }}>{l.label}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

