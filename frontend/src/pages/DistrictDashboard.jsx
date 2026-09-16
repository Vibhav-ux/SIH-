import { useEffect, useState } from 'react';
import { stateApi, formatCurrency } from '../api';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';

export default function DistrictDashboard() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districts, setDistricts] = useState([]);
  const [districtData, setDistrictData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    stateApi.getOverview()
      .then(d => {
        setStates(d.states || []);
        if (d.states?.length > 0) setSelectedState(d.states[0].state);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedState) return;
    stateApi.getDistricts(selectedState)
      .then(d => {
        setDistricts(d.districts || []);
        if (d.districts?.length > 0) {
          setSelectedDistrict(d.districts[0].district);
        }
      })
      .catch(console.error);
  }, [selectedState]);

  useEffect(() => {
    if (!selectedState || !selectedDistrict) return;
    setLoadingDetail(true);
    stateApi.getDistrictDetail(selectedState, selectedDistrict)
      .then(d => { setDistrictData(d); setLoadingDetail(false); })
      .catch(e => { console.error(e); setLoadingDetail(false); });
  }, [selectedState, selectedDistrict]);

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 60px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #ecfeff 100%)',
        borderBottom: '1px solid #e2e8f0', padding: '40px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20,
              background: '#ecfdf5', border: '1px solid #a7f3d0',
              fontSize: 12, fontWeight: 600, color: '#059669', marginBottom: 16,
            }}>🏢 District Authority Dashboard</div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px',
              background: 'linear-gradient(135deg, #0f172a 0%, #059669 80%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>District-Level Monitoring</h1>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, lineHeight: 1.7 }}>
              Track all MPLADS projects in your district. Monitor MP performance, agency work quality, and community feedback.
            </p>
          </div>

          {/* State + District Selector */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select className="input-glass" style={{ maxWidth: 300 }}
              value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedDistrict(''); setDistrictData(null); }}>
              <option value="">Select State</option>
              {states.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
            </select>
            <select className="input-glass" style={{ maxWidth: 300 }}
              value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}>
              <option value="">Select District</option>
              {districts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        {loadingDetail ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {Array(4).fill(0).map((_, i) => <StatCard key={i} label="" value={0} loading />)}
          </div>
        ) : districtData ? (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Total Projects', value: districtData.totalProjects, icon: '📋', color: '#4f46e5' },
                { label: 'Completed', value: districtData.completedProjects, icon: '✅', color: '#10b981' },
                { label: 'Stalled', value: districtData.stalledProjects, icon: '⚠️', color: '#f43f5e' },
                { label: 'Utilization', value: districtData.utilizationPct, unit: '%', icon: '📊', color: '#059669' },
                { label: 'Budget', value: Math.round(districtData.totalBudget / 100000), unit: ' L', icon: '💰', color: '#d97706' },
                { label: 'High Risk', value: districtData.highRiskProjects, icon: '🚨', color: '#dc2626' },
              ].map(s => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Two-column: MP Breakdown + Agency Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* MP Breakdown */}
              <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    🏛️ MP-wise Breakdown
                  </h3>
                </div>
                <div style={{ padding: 16 }}>
                  {districtData.mpBreakdown.map(mp => (
                    <div key={mp.mpId} style={{
                      padding: 12, borderRadius: 10, marginBottom: 8,
                      background: '#f8fafc', border: '1px solid #f1f5f9',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{mp.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{mp.constituency}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>{mp.projects} projects</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
                        <span>Budget: {formatCurrency(mp.budget)}</span>
                        <span>Disbursed: {formatCurrency(mp.disbursed)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agency Breakdown */}
              <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    🔧 Agency Performance
                  </h3>
                </div>
                <div style={{ padding: 16 }}>
                  {districtData.agencyBreakdown.map(ag => (
                    <div key={ag.agencyId} style={{
                      padding: 12, borderRadius: 10, marginBottom: 8,
                      background: '#f8fafc', border: '1px solid #f1f5f9',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ag.name}
                        </div>
                        <div style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: ag.trustScore >= 70 ? '#ecfdf5' : ag.trustScore >= 50 ? '#fffbeb' : '#fef2f2',
                          color: ag.trustScore >= 70 ? '#059669' : ag.trustScore >= 50 ? '#d97706' : '#dc2626',
                          border: `1px solid ${ag.trustScore >= 70 ? '#a7f3d0' : ag.trustScore >= 50 ? '#fde68a' : '#fecaca'}`,
                          flexShrink: 0,
                        }}>Trust: {ag.trustScore}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {ag.projects} projects · Budget: {formatCurrency(ag.budget)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
              📋 All Projects in {districtData.district}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {districtData.projects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Select a district to view details</div>
            <div>Choose a state and district from the dropdowns above</div>
          </div>
        )}
      </div>
    </div>
  );
}

