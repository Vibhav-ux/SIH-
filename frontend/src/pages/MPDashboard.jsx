import { useEffect, useState } from 'react';
import { mpApi, formatCurrency, formatDate } from '../api';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';

export default function MPDashboard() {
  // Always read directly from localStorage so navigating from MPDirectory always shows the right MP
  const [mpId, setMpId] = useState(() => localStorage.getItem('mplad_mp_id') || 'mp-001');
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [propForm, setPropForm] = useState({ title: '', category: 'ROADS', estimatedBudget: '', description: '', lat: '', lng: '' });
  const [submitting, setSubmitting] = useState(false);
  const [propSuccess, setPropSuccess] = useState(false);

  // Listen for localStorage changes (when MPDirectory sets a new MP and navigates here)
  useEffect(() => {
    const onStorage = () => {
      const id = localStorage.getItem('mplad_mp_id');
      if (id && id !== mpId) {
        setMpId(id);
        setActiveTab('overview');
      }
    };
    window.addEventListener('storage', onStorage);
    // Also check immediately on mount in case navigation happened in the same tab
    const id = localStorage.getItem('mplad_mp_id');
    if (id && id !== mpId) setMpId(id);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      mpApi.getOverview(mpId),
      mpApi.getProjects(mpId),
      mpApi.getProposals(mpId),
      mpApi.getAlerts(mpId),
    ]).then(([ov, pr, prop, al]) => {
      setOverview(ov);
      setProjects(pr);
      setProposals(prop);
      setAlerts(al);
    }).catch(console.error).finally(() => setLoading(false));
  }, [mpId]);

  async function handleProposal(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await mpApi.createProposal(mpId, {
        ...propForm,
        estimatedBudget: Number(propForm.estimatedBudget),
        lat: propForm.lat ? Number(propForm.lat) : null,
        lng: propForm.lng ? Number(propForm.lng) : null,
      });
      setPropSuccess(true);
      const updated = await mpApi.getProposals(mpId);
      setProposals(updated);
      setTimeout(() => { setPropSuccess(false); setShowNewProposal(false); setPropForm({ title: '', category: 'ROADS', estimatedBudget: '', description: '', lat: '', lng: '' }); }, 1500);
    } catch (err) {
      alert(err.message);
    }
    setSubmitting(false);
  }

  const mp = overview?.mp;
  const stats = overview?.stats;
  const fundUsedPct = stats ? Math.round((stats.totalDisbursed / stats.totalBudget) * 100) : 0;

  const TABS = ['overview', 'projects', 'proposals', 'alerts'];

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 32, flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
              }}>🏛️</div>
              <div>
                <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {mp?.name || 'MP Dashboard'}
                </h1>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {mp?.constituency}, {mp?.state} · {mp?.party}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {alerts.length > 0 && (
              <div style={{
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
                fontSize: 13, fontWeight: 600, color: '#dc2626',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                🚨 {alerts.length} Active Alerts
              </div>
            )}
            <button className="btn-primary" onClick={() => setShowNewProposal(true)}>
              + New Proposal
            </button>
          </div>
        </div>

        {/* Fund Utilization Hero */}
        {stats && (
          <div className="glass-card-static" style={{ padding: 28, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Fund Utilization</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                  {formatCurrency(stats.totalDisbursed)} <span style={{ fontSize: 16, color: '#64748b', fontWeight: 400 }}>of {formatCurrency(stats.totalBudget)}</span>
                </div>
              </div>
              <div style={{
                padding: '12px 20px', borderRadius: 12,
                background: fundUsedPct >= 80 ? 'rgba(16,185,129,0.15)' : fundUsedPct >= 50 ? 'rgba(99,102,241,0.15)' : 'rgba(244,63,94,0.15)',
                border: `1px solid ${fundUsedPct >= 80 ? 'rgba(16,185,129,0.3)' : fundUsedPct >= 50 ? 'rgba(99,102,241,0.3)' : 'rgba(244,63,94,0.3)'}`,
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 900, color: fundUsedPct >= 80 ? '#10b981' : fundUsedPct >= 50 ? '#4f46e5' : '#f43f5e' }}>{fundUsedPct}%</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Utilized</div>
              </div>
            </div>
            <div className="progress-track" style={{ height: 10 }}>
              <div className="progress-fill" style={{
                width: `${fundUsedPct}%`,
                background: fundUsedPct >= 80 ? 'linear-gradient(90deg, #10b981, #059669)'
                  : fundUsedPct >= 50 ? 'linear-gradient(90deg, #4f46e5, #6366f1)'
                  : 'linear-gradient(90deg, #f43f5e, #f97316)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#64748b' }}>
              <span>Remaining: {formatCurrency(stats.remainingFunds || 0)}</span>
              <span>{stats.completedProjects}/{stats.totalProjects} projects completed</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Projects', value: stats?.totalProjects || 0, icon: '📋', color: '#4f46e5' },
            { label: 'Completed', value: stats?.completedProjects || 0, icon: '✅', color: '#10b981' },
            { label: 'Completion Rate', value: stats?.completionRate || 0, unit: '%', icon: '📈', color: '#0ea5e9' },
            { label: 'Payment Gap', value: stats?.paymentGapPercentage || 0, unit: '%', icon: '💸', color: '#f59e0b' },
          ].map(s => <StatCard key={s.label} {...s} loading={loading} />)}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--text-primary)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? 'rgba(79,70,229,0.15)' : 'transparent',
              color: activeTab === tab ? '#4f46e5' : '#64748b',
              fontSize: 13, fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.2s',
            }}>
              {tab === 'alerts' && alerts.length > 0 ? `Alerts (${alerts.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {projects.slice(0, 6).map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}

        {activeTab === 'projects' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Proposal</th><th>Category</th><th>Budget</th><th>Status</th><th>Submitted</th><th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map(p => (
                    <tr key={p.id}>
                      <td style={{ color: '#0f172a', fontWeight: 500 }}>{p.title}</td>
                      <td>{p.category}</td>
                      <td style={{ fontWeight: 600, color: '#4f46e5' }}>{formatCurrency(p.estimatedBudget)}</td>
                      <td>
                        <span className={`badge badge-${p.status === 'APPROVED' ? 'low' : p.status === 'REJECTED' ? 'high' : 'medium'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{formatDate(p.submittedAt)}</td>
                      <td style={{ maxWidth: 200, fontSize: 12 }}>{p.ministerRemarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>No active alerts</div>
              </div>
            ) : alerts.map((a, i) => (
              <div key={i} style={{
                padding: 16, borderRadius: 12,
                background: a.severity === 'CRITICAL' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${a.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20 }}>{a.severity === 'CRITICAL' ? '🚨' : '⚠️'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.message}</div>
                </div>
                <span className={`badge badge-${a.severity === 'CRITICAL' ? 'critical' : 'medium'}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* New Proposal Modal */}
        {showNewProposal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }} onClick={() => setShowNewProposal(false)}>
            <div style={{
              background: 'var(--text-primary)', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: 32, maxWidth: 520, width: '100%',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, margin: 0, color: '#0f172a' }}>📝 New Proposal</h2>
                <button onClick={() => setShowNewProposal(false)} style={{ background: 'var(--text-primary)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontSize: 16 }}>✕</button>
              </div>

              {propSuccess ? (
                <div style={{ textAlign: 'center', color: '#059669', fontSize: 18, fontWeight: 700, padding: 40 }}>
                  ✅ Proposal submitted successfully!
                </div>
              ) : (
                <form onSubmit={handleProposal} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Project Title *</label>
                    <input className="input-glass" required placeholder="e.g. Construction of Community Hall..." value={propForm.title} onChange={e => setPropForm({ ...propForm, title: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Category *</label>
                      <select className="input-glass" value={propForm.category} onChange={e => setPropForm({ ...propForm, category: e.target.value })}>
                        {['ROADS', 'INFRASTRUCTURE', 'EDUCATION', 'HEALTH', 'WATER', 'ENERGY', 'COMMUNITY', 'SANITATION', 'ENVIRONMENT', 'RURAL'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Estimated Budget (₹) *</label>
                      <input className="input-glass" type="number" required placeholder="e.g. 2500000" value={propForm.estimatedBudget} onChange={e => setPropForm({ ...propForm, estimatedBudget: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Description</label>
                    <textarea className="input-glass" rows={3} style={{ resize: 'vertical' }} placeholder="Describe the project scope and beneficiaries..." value={propForm.description} onChange={e => setPropForm({ ...propForm, description: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Latitude (optional)</label>
                      <input className="input-glass" type="number" step="any" placeholder="e.g. 25.317" value={propForm.lat} onChange={e => setPropForm({ ...propForm, lat: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Longitude (optional)</label>
                      <input className="input-glass" type="number" step="any" placeholder="e.g. 82.974" value={propForm.lng} onChange={e => setPropForm({ ...propForm, lng: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Proposal'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowNewProposal(false)}>Cancel</button>
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

