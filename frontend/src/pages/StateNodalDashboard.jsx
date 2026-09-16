import { useEffect, useState } from 'react';
import { stateApi, formatCurrency } from '../api';
import StatCard from '../components/StatCard';

const RISK_COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#10b981' };

export default function StateNodalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);
  const [districts, setDistricts] = useState(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    stateApi.getOverview()
      .then(d => { setData(d); setLoading(false); })
      .catch(console.error);
  }, []);

  async function handleStateSelect(state) {
    setSelectedState(state);
    setLoadingDistricts(true);
    try {
      const d = await stateApi.getDistricts(state.state);
      setDistricts(d);
    } catch (e) { console.error(e); }
    setLoadingDistricts(false);
  }

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 60px' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 50%, #ecfdf5 100%)',
        borderBottom: '1px solid #e2e8f0', padding: '40px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20,
              background: '#fffbeb', border: '1px solid #fde68a',
              fontSize: 12, fontWeight: 600, color: '#d97706', marginBottom: 16,
            }}>🏛️ State Nodal Authority Dashboard</div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px',
              background: 'linear-gradient(135deg, #0f172a 0%, #d97706 80%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>State-Level MPLADS Monitor</h1>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, lineHeight: 1.7 }}>
              Aggregate view across all districts and constituencies. Compare performance, identify underperforming areas, and track fund utilization.
            </p>
          </div>

          {/* National Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {[
              { label: 'Total States', value: data?.totalStates || 0, icon: '🗺️', color: '#7c3aed' },
              { label: 'Total Projects', value: data?.totalProjects || 0, icon: '📋', color: '#4f46e5' },
              { label: 'Total Budget', value: data ? Math.round(data.totalBudget / 10000000) : 0, unit: ' Cr', icon: '💰', color: '#d97706' },
              { label: 'Utilization', value: data?.utilizationPct || 0, unit: '%', icon: '📊', color: '#059669' },
            ].map(s => <StatCard key={s.label} {...s} loading={loading} />)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        {/* State Cards Grid */}
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 700, margin: '0 0 20px', color: '#0f172a' }}>
          📍 State Performance Overview
        </h2>

        {!loading && data?.states && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 32 }}>
            {data.states.map((state, i) => (
              <div key={state.state}
                className="glass-card"
                onClick={() => handleStateSelect(state)}
                style={{
                  padding: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  border: selectedState?.state === state.state ? '2px solid #d97706' : undefined,
                }}>
                {/* Risk accent */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${RISK_COLORS[state.riskLevel]}, transparent)`,
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                      {state.state}
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {state.districts} districts · {state.mpCount} MPs
                    </span>
                  </div>
                  <div style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: state.utilizationPct >= 80 ? '#ecfdf5' : state.utilizationPct >= 50 ? '#eef2ff' : '#fef2f2',
                    border: `1px solid ${state.utilizationPct >= 80 ? '#a7f3d0' : state.utilizationPct >= 50 ? '#c7d2fe' : '#fecaca'}`,
                    fontSize: 14, fontWeight: 800, fontFamily: 'Outfit, sans-serif',
                    color: state.utilizationPct >= 80 ? '#059669' : state.utilizationPct >= 50 ? '#4f46e5' : '#dc2626',
                  }}>{state.utilizationPct}%</div>
                </div>

                {/* Progress bar */}
                <div className="progress-track" style={{ marginBottom: 14 }}>
                  <div className="progress-fill" style={{
                    width: `${state.utilizationPct}%`,
                    background: state.utilizationPct >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : state.utilizationPct >= 50 ? 'linear-gradient(90deg, #4f46e5, #818cf8)'
                      : 'linear-gradient(90deg, #f43f5e, #f97316)',
                  }} />
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Projects', value: state.totalProjects, color: '#4f46e5' },
                    { label: 'Completed', value: state.completedProjects, color: '#10b981' },
                    { label: 'Stalled', value: state.stalledProjects, color: '#f43f5e' },
                    { label: 'High Risk', value: state.highRiskProjects, color: '#dc2626' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                  Budget: {formatCurrency(state.totalBudget)} · Disbursed: {formatCurrency(state.totalDisbursed)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* District Breakdown Panel */}
        {selectedState && (
          <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                  📊 {selectedState.state} — District Breakdown
                </h3>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {districts?.totalDistricts || 0} districts · {districts?.totalProjects || 0} projects
                </span>
              </div>
              <button className="btn-secondary" onClick={() => { setSelectedState(null); setDistricts(null); }}>✕ Close</button>
            </div>

            {loadingDistricts ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading districts...</div>
            ) : districts?.districts ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>District</th><th>Projects</th><th>Budget</th><th>Utilization</th><th>Completed</th><th>Stalled</th><th>High Risk</th><th>MPs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districts.districts.map(d => (
                      <tr key={d.district}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{d.district}</td>
                        <td>{d.totalProjects}</td>
                        <td style={{ fontWeight: 600, color: '#4f46e5' }}>{formatCurrency(d.totalBudget)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-track" style={{ width: 60 }}>
                              <div className="progress-fill" style={{
                                width: `${d.utilizationPct}%`,
                                background: d.utilizationPct >= 80 ? '#10b981' : d.utilizationPct >= 50 ? '#4f46e5' : '#f43f5e',
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{d.utilizationPct}%</span>
                          </div>
                        </td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{d.completedProjects}</td>
                        <td style={{ color: d.stalledProjects > 0 ? '#dc2626' : 'var(--text-secondary)', fontWeight: 600 }}>{d.stalledProjects}</td>
                        <td style={{ color: d.highRiskProjects > 0 ? '#dc2626' : 'var(--text-secondary)', fontWeight: 600 }}>{d.highRiskProjects}</td>
                        <td style={{ fontSize: 12 }}>{d.mpNames.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

