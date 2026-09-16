import { useEffect, useState } from 'react';
import { ministryApi, aiApi, formatCurrency, formatDate } from '../api';
import StatCard from '../components/StatCard';

export default function MinistryDashboard() {
  const [overview, setOverview] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals');
  const [filterStatus, setFilterStatus] = useState('');
  const [actionModal, setActionModal] = useState(null); // {type:'approve'|'reject', proposal}
  const [remarks, setRemarks] = useState('');
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    Promise.all([
      ministryApi.getOverview(),
      ministryApi.getProposals(),
      aiApi.getForecast(),
    ]).then(([ov, pr, fc]) => {
      setOverview(ov);
      setProposals(pr);
      setForecasts(fc.forecasts || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filteredProposals = filterStatus ? proposals.filter(p => p.status === filterStatus) : proposals;

  async function handleAction() {
    if (!actionModal) return;
    setActioning(true);
    try {
      if (actionModal.type === 'approve') {
        await ministryApi.approveProposal(actionModal.proposal.id, remarks || 'Approved.');
      } else {
        if (!remarks.trim()) { alert('Rejection remarks required'); setActioning(false); return; }
        await ministryApi.rejectProposal(actionModal.proposal.id, remarks);
      }
      const updated = await ministryApi.getProposals();
      setProposals(updated);
      setActionModal(null); setRemarks('');
    } catch (err) { alert(err.message); }
    setActioning(false);
  }

  const lapseRisk = forecasts.filter(f => f.willLapse);

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            ⚖️ Ministry Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
            National overview · Proposal management · Fund oversight
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Pending Proposals', value: overview?.proposals?.pending || 0, icon: '⏳', color: '#f59e0b' },
            { label: 'Approved', value: overview?.proposals?.approved || 0, icon: '✅', color: '#10b981' },
            { label: 'Rejected', value: overview?.proposals?.rejected || 0, icon: '❌', color: '#f43f5e' },
            { label: 'High Risk Projects', value: overview?.projects?.highRisk || 0, icon: '🚨', color: '#f43f5e' },
            { label: 'Lapse Risk', value: overview?.projects?.lapseRisk || 0, icon: '⚡', color: '#f97316' },
            { label: 'Stalled Projects', value: overview?.projects?.stalled || 0, icon: '🛑', color: '#ef4444' },
          ].map(s => <StatCard key={s.label} {...s} loading={loading} />)}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--text-primary)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
          {['proposals', 'lapse-forecast', 'state-breakdown'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? 'rgba(99,102,241,0.3)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : '#64748b',
              fontSize: 13, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}>
              {tab === 'lapse-forecast' ? '⚡ Lapse Forecast' : tab === 'state-breakdown' ? '🗺️ State Breakdown' : '📋 Proposals'}
            </button>
          ))}
        </div>

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: filterStatus === s ? 'rgba(99,102,241,0.3)' : 'var(--text-primary)',
                  color: filterStatus === s ? '#6366f1' : '#64748b',
                }}>
                  {s || 'All'} {s && `(${proposals.filter(p => p.status === s).length})`}
                </button>
              ))}
            </div>

            <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Proposal</th><th>MP</th><th>State</th><th>Category</th><th>Budget</th><th>Status</th><th>Submitted</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredProposals.map(p => (
                      <tr key={p.id}>
                        <td style={{ color: '#0f172a', fontWeight: 500, maxWidth: 200 }}>{p.title}</td>
                        <td style={{ color: '#6366f1' }}>{p.mpName}</td>
                        <td>{p.mpState}</td>
                        <td>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--text-primary)', padding: '2px 8px', borderRadius: 6 }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#f59e0b' }}>{formatCurrency(p.estimatedBudget)}</td>
                        <td>
                          <span className={`badge badge-${p.status === 'APPROVED' ? 'low' : p.status === 'REJECTED' ? 'high' : 'medium'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>{formatDate(p.submittedAt)}</td>
                        <td>
                          {p.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => { setActionModal({ type: 'approve', proposal: p }); setRemarks(''); }}
                                style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,0.2)', color: '#059669' }}>
                                ✓ Approve
                              </button>
                              <button onClick={() => { setActionModal({ type: 'reject', proposal: p }); setRemarks(''); }}
                                style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(244,63,94,0.2)', color: '#dc2626' }}>
                                ✕ Reject
                              </button>
                            </div>
                          )}
                          {p.status !== 'PENDING' && p.ministerRemarks && (
                            <div style={{ fontSize: 11, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.ministerRemarks}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Lapse Forecast Tab */}
        {activeTab === 'lapse-forecast' && (
          <div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', marginBottom: 20, fontSize: 13, color: '#fb923c' }}>
              ⚡ <strong>{lapseRisk.length} projects</strong> are at risk of fund lapse before their deadline. Act now to avoid treasury returns.
            </div>
            <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Project</th><th>MP</th><th>Current Utilization</th><th>Projected Utilization</th><th>Days Left</th><th>Shortfall</th><th>Risk</th></tr>
                </thead>
                <tbody>
                  {forecasts.map(f => (
                    <tr key={f.projectId}>
                      <td style={{ color: '#0f172a', fontWeight: 500, maxWidth: 200 }}>{f.projectTitle}</td>
                      <td style={{ color: '#6366f1', fontSize: 12 }}>{f.mpId}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-track" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${f.currentUtilizationPct}%`, background: f.willLapse ? '#f43f5e' : '#10b981' }} />
                          </div>
                          <span style={{ fontSize: 12 }}>{f.currentUtilizationPct}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: f.willLapse ? '#f43f5e' : '#10b981', fontWeight: 600, fontSize: 13 }}>
                          {f.projectedUtilizationPct}%
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: f.remainingDays < 90 ? '#f43f5e' : 'var(--text-secondary)' }}>{f.remainingDays}d</td>
                      <td style={{ color: '#f59e0b' }}>{f.willLapse ? formatCurrency(f.shortfallAmount) : '—'}</td>
                      <td>
                        <span className={`badge badge-${f.lapseRiskLevel === 'CRITICAL' ? 'critical' : f.lapseRiskLevel === 'HIGH' ? 'high' : 'low'}`}>
                          {f.lapseRiskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* State Breakdown Tab */}
        {activeTab === 'state-breakdown' && overview?.byState && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {overview.byState.sort((a, b) => b.highRisk - a.highRisk).map(s => (
              <div key={s.state} className="glass-card-static" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.state}</div>
                  {s.highRisk > 0 && (
                    <span style={{ fontSize: 11, color: '#dc2626', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', padding: '2px 8px', borderRadius: 20 }}>
                      🚨 {s.highRisk} high risk
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Projects', value: s.total, color: '#4f46e5' },
                    { label: 'Completed', value: s.completed, color: '#10b981' },
                    { label: 'Budget', value: formatCurrency(s.budget), color: '#f59e0b' },
                    { label: 'Completion', value: `${Math.round((s.completed / s.total) * 100)}%`, color: s.completed / s.total >= 0.7 ? '#10b981' : '#f59e0b' },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '8px 12px', background: 'var(--text-primary)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {actionModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }} onClick={() => setActionModal(null)}>
            <div style={{
              background: 'var(--text-primary)', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: 32, maxWidth: 480, width: '100%',
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
                {actionModal.type === 'approve' ? '✅ Approve Proposal' : '❌ Reject Proposal'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>{actionModal.proposal.title}</p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
                  Remarks {actionModal.type === 'reject' ? '(required)' : '(optional)'}
                </label>
                <textarea className="input-glass" rows={4} style={{ resize: 'vertical' }}
                  placeholder={actionModal.type === 'approve' ? 'Approval comments...' : 'Reason for rejection...'}
                  value={remarks} onChange={e => setRemarks(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleAction} disabled={actioning}
                  className={actionModal.type === 'approve' ? 'btn-primary' : 'btn-danger'} style={{ flex: 1 }}>
                  {actioning ? 'Processing...' : actionModal.type === 'approve' ? '✓ Confirm Approval' : '✕ Confirm Rejection'}
                </button>
                <button className="btn-secondary" onClick={() => setActionModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

