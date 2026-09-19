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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1300px] mx-auto">

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="font-outfit text-2xl md:text-3xl font-extrabold text-slate-900 m-0">
            ⚖️ Ministry Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-2">
            National overview · Proposal management · Fund oversight
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-7">
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
        <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-xl w-full md:w-fit overflow-x-auto">
          {['proposals', 'lapse-forecast', 'state-breakdown'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 md:px-5 py-2 rounded-lg border-none cursor-pointer text-xs md:text-sm font-semibold capitalize transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === tab ? 'bg-indigo-500/30 text-white' : 'bg-transparent text-slate-400'}`}>
              {tab === 'lapse-forecast' ? '⚡ Lapse Forecast' : tab === 'state-breakdown' ? '🗺️ State Breakdown' : '📋 Proposals'}
            </button>
          ))}
        </div>

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg border-none cursor-pointer text-xs font-semibold whitespace-nowrap ${filterStatus === s ? 'bg-indigo-500/30 text-indigo-500' : 'bg-slate-900 text-slate-400'}`}>
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
                          <span style={{ fontSize: 11, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
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
            <div className="glass-card-static p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table min-w-[800px]">
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
          </div>
        )}


        {/* State Breakdown Tab */}
        {activeTab === 'state-breakdown' && overview?.byState && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {overview.byState.sort((a, b) => b.highRisk - a.highRisk).map(s => (
              <div key={s.state} className="glass-card-static p-4 md:p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-slate-900 text-sm md:text-base">{s.state}</div>
                  {s.highRisk > 0 && (
                    <span className="text-[10px] md:text-xs text-red-600 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                      🚨 {s.highRisk} high risk
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Projects', value: s.total, color: '#4f46e5' },
                    { label: 'Completed', value: s.completed, color: '#10b981' },
                    { label: 'Budget', value: formatCurrency(s.budget), color: '#f59e0b' },
                    { label: 'Completion', value: `${Math.round((s.completed / s.total) * 100)}%`, color: s.completed / s.total >= 0.7 ? '#10b981' : '#f59e0b' },
                  ].map(item => (
                    <div key={item.label} className="p-2 md:p-3 bg-slate-900 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 mb-1">{item.label}</div>
                      <div className="text-xs md:text-sm font-bold" style={{ color: item.color }}>{item.value}</div>
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

