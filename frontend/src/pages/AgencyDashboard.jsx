import { useEffect, useState } from 'react';
import { agencyApi, formatCurrency, formatDate } from '../api';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';

export default function AgencyDashboard({ agencyId = 'ag-001' }) {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [progressModal, setProgressModal] = useState(null);
  const [progressForm, setProgressForm] = useState({ completionPct: '', disbursedAmount: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    agencyApi.getAgency(agencyId).then(data => {
      setAgency(data);
      setLoading(false);
    }).catch(console.error);
  }, [agencyId]);

  async function handleProgress(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await agencyApi.submitProgress(agencyId, progressModal.id, {
        completionPct: Number(progressForm.completionPct),
        disbursedAmount: progressForm.disbursedAmount ? Number(progressForm.disbursedAmount) : undefined,
        remarks: progressForm.remarks,
      });
      setSubmitSuccess(true);
      const updated = await agencyApi.getAgency(agencyId);
      setAgency(updated);
      setTimeout(() => { setSubmitSuccess(false); setProgressModal(null); setProgressForm({ completionPct: '', disbursedAmount: '', remarks: '' }); }, 1500);
    } catch (err) { alert(err.message); }
    setSubmitting(false);
  }

  const trustColor = agency?.trustScore >= 70 ? '#10b981' : agency?.trustScore >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `${trustColor}20`, border: `2px solid ${trustColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>🔧</div>
            <div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {loading ? '—' : agency?.name}
              </h1>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                {agency?.category} · {agency?.state}
              </div>
            </div>
            {agency?.shellAlert && (
              <div style={{
                padding: '6px 14px', borderRadius: 10,
                background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.5)',
                fontSize: 13, fontWeight: 700, color: '#dc2626',
                animation: 'pulse-critical 2s infinite',
              }}>
                🔴 Shell Entity Alert
              </div>
            )}
          </div>
        </div>

        {/* Trust Score Hero */}
        {agency && (
          <div className="glass-card-static" style={{ padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle, ${trustColor}15 0%, transparent 70%)`, borderRadius: '0 16px 0 200px' }} />
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Score Ring */}
              <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={trustColor} strokeWidth="10"
                    strokeDasharray={`${2.51 * agency.trustScore} 251`} strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${trustColor}60)` }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: trustColor }}>{agency.trustScore}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>/ 100</div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>National Trust Score</div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: `${trustColor}20`, border: `1px solid ${trustColor}40`, color: trustColor,
                  }}>{agency.riskLevel?.replace(/_/g, ' ')}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Completion', value: `${agency.completionRate}%`, color: '#10b981', weight: '40%' },
                    { label: 'Delay Score', value: `${agency.delayScore}%`, color: '#4f46e5', weight: '30%' },
                    { label: 'Fraud Score', value: `${agency.fraudScore}%`, color: '#f59e0b', weight: '20%' },
                    { label: 'Community', value: `${agency.communityScore}%`, color: '#8b5cf6', weight: '10%' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: 'Outfit, sans-serif' }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{m.label}</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>wt: {m.weight}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8, flexShrink: 0, minWidth: 160 }}>
                {[
                  { label: 'Projects', value: agency.totalProjects || 0 },
                  { label: 'MPs Served', value: agency.mpCount || 0 },
                  { label: 'States', value: agency.stateCount || 0 },
                  { label: 'Fraud Flags', value: agency.fraudFlags || 0 },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--text-primary)', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{m.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.label === 'Fraud Flags' && m.value > 0 ? '#f43f5e' : 'var(--text-primary)' }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Agency Details */}
        {agency && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Registered Address', value: agency.registeredAddress },
              { label: 'Director', value: agency.director },
              { label: 'GSTIN', value: agency.gstIn },
              { label: 'Category', value: agency.category },
            ].map(d => (
              <div key={d.label} style={{ padding: '10px 14px', background: 'var(--text-primary)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontSize: 13, color: '#0f172a' }}>{d.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            📋 Assigned Projects
          </h2>
          <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr><th>Project</th><th>MP</th><th>Progress</th><th>Budget</th><th>Status</th><th>Risk</th><th>Update</th></tr>
              </thead>
              <tbody>
                {(agency?.projects || []).map(p => (
                  <tr key={p.id}>
                    <td style={{ color: '#0f172a', fontWeight: 500, maxWidth: 200 }}>{p.title}</td>
                    <td style={{ fontSize: 12, color: '#6366f1' }}>{p.mpName}</td>
                    <td style={{ width: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-track" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{
                            width: `${p.completionPct}%`,
                            background: p.status === 'STALLED' ? '#f43f5e' : p.status === 'COMPLETED' ? '#10b981' : '#4f46e5',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', minWidth: 32 }}>{p.completionPct}%</span>
                      </div>
                    </td>
                    <td style={{ color: '#f59e0b', fontWeight: 600 }}>{formatCurrency(p.budget)}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        color: p.status === 'COMPLETED' ? '#059669' : p.status === 'STALLED' ? '#dc2626' : '#6366f1',
                        background: p.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : p.status === 'STALLED' ? 'rgba(244,63,94,0.12)' : 'rgba(99,102,241,0.12)',
                      }}>{p.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td><RiskBadge score={p.riskScore} size="sm" /></td>
                    <td>
                      {p.status !== 'COMPLETED' && (
                        <button onClick={() => { setProgressModal(p); setProgressForm({ completionPct: String(p.completionPct), disbursedAmount: String(p.disbursed), remarks: '' }); }}
                          style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Progress Update Modal */}
        {progressModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }} onClick={() => setProgressModal(null)}>
            <div style={{
              background: 'var(--text-primary)', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: 32, maxWidth: 480, width: '100%',
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>📝 Update Progress</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>{progressModal.title}</p>

              {submitSuccess ? (
                <div style={{ textAlign: 'center', color: '#059669', fontSize: 18, fontWeight: 700, padding: 32 }}>✅ Progress updated!</div>
              ) : (
                <form onSubmit={handleProgress} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Completion Percentage *</label>
                    <input className="input-glass" type="number" min="0" max="100" required
                      value={progressForm.completionPct} onChange={e => setProgressForm({ ...progressForm, completionPct: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Total Disbursed (₹)</label>
                    <input className="input-glass" type="number"
                      value={progressForm.disbursedAmount} onChange={e => setProgressForm({ ...progressForm, disbursedAmount: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Progress Remarks</label>
                    <textarea className="input-glass" rows={3} style={{ resize: 'vertical' }}
                      placeholder="Describe work done, milestones reached..."
                      value={progressForm.remarks} onChange={e => setProgressForm({ ...progressForm, remarks: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
                      {submitting ? 'Submitting...' : '✓ Submit Update'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setProgressModal(null)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

