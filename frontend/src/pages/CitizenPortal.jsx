import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { citizenApi, aiApi, formatCurrency } from '../api';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import ProjectMap from '../components/ProjectMap';

const CATEGORIES = ['ROADS', 'INFRASTRUCTURE', 'EDUCATION', 'HEALTH', 'WATER', 'ENERGY', 'COMMUNITY', 'SANITATION', 'ENVIRONMENT', 'RURAL'];
const STATUSES = ['IN_PROGRESS', 'COMPLETED', 'STALLED'];

export default function CitizenPortal() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ statusClaim: '', evidenceText: '', name: '' });
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' | 'map'
  const [mpScores, setMpScores] = useState([]);

  useEffect(() => {
    Promise.all([citizenApi.getStats(), citizenApi.getProjects(), aiApi.getMPScores()])
      .then(([s, p, ms]) => {
        setStats(s);
        setProjects(p);
        setFiltered(p);
        setMpScores(ms.scores?.slice(0, 5) || []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let result = [...projects];
    if (search) result = result.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.state?.toLowerCase().includes(search.toLowerCase()) ||
      p.district?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterCategory) result = result.filter(p => p.category === filterCategory);
    if (filterStatus) result = result.filter(p => p.status === filterStatus);
    if (filterRisk) result = result.filter(p => p.riskLevel === filterRisk);
    setFiltered(result);
  }, [search, filterCategory, filterStatus, filterRisk, projects]);

  async function handleReport(e) {
    e.preventDefault();
    if (!reportForm.statusClaim) return;
    await citizenApi.submitReport({ projectId: selectedProject.id, ...reportForm });
    setReportSubmitted(true);
    setTimeout(() => { setShowReport(false); setReportSubmitted(false); setReportForm({ statusClaim: '', evidenceText: '', name: '' }); }, 2000);
  }

  const gradeColor = (g) => ({ A: '#059669', B: '#4f46e5', C: '#d97706', D: '#ea580c', F: '#dc2626' }[g] || 'var(--text-secondary)');

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 60px' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0f4ff 50%, #ecfeff 100%)',
        borderBottom: '1px solid #e2e8f0',
        padding: '48px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20,
              background: '#eef2ff', border: '1px solid #c7d2fe',
              fontSize: 12, fontWeight: 600, color: '#4f46e5', marginBottom: 20,
            }}>
              🇮🇳 Public Transparency Portal • No Login Required
            </div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px',
              background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 50%, #0891b2 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Where does your<br />MP's money go?
            </h1>
            <p style={{ fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
              Track every rupee of MPLAD funds in real time. Spot fraud. Report progress. Hold representatives accountable.
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { label: 'Total Projects', value: stats?.totalProjects || 0, icon: '📋', color: '#4f46e5' },
              { label: 'Total Funds', value: stats ? Math.round(stats.totalBudget / 10000000) : 0, unit: ' Cr', icon: '💰', color: '#d97706' },
              { label: 'Utilization', value: stats?.utilizationRate || 0, unit: '%', icon: '📊', color: '#059669' },
              { label: 'High Risk', value: stats?.highRiskProjects || 0, icon: '🚨', color: '#dc2626' },
              { label: 'States Covered', value: stats?.states || 0, icon: '🗺️', color: '#7c3aed' },
              { label: 'Fraud Alerts', value: stats?.fraudAlerts || 0, icon: '⚠️', color: '#e11d48' },
            ].map(s => (
              <StatCard key={s.label} {...s} loading={loading} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>

        {/* MP Accountability Preview */}
        {mpScores.length > 0 && (
          <div className="glass-card-static" style={{ marginBottom: 32, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  📋 MP Accountability Scores
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Top performers — transparent, data-driven, same formula for all</p>
              </div>
              <Link to="/app/mp-scores" style={{
                padding: '8px 16px', borderRadius: 8,
                background: '#eef2ff', border: '1px solid #c7d2fe',
                color: '#4f46e5', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>View All →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {mpScores.map(mp => (
                <div key={mp.mpId} style={{
                  padding: 16, borderRadius: 12,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  display: 'flex', gap: 12, alignItems: 'center',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: `${gradeColor(mp.grade)}15`,
                    border: `2px solid ${gradeColor(mp.grade)}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800,
                    color: gradeColor(mp.grade),
                  }}>{mp.grade}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mp.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{mp.constituency}</div>
                    <div style={{ fontSize: 12, color: gradeColor(mp.grade), fontWeight: 600 }}>{mp.accountabilityScore}/100</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters + View Toggle */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input
              className="input-glass"
              style={{ paddingLeft: 38 }}
              placeholder="Search projects, state, district..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {[
            { value: filterCategory, set: setFilterCategory, options: CATEGORIES, placeholder: 'All Categories' },
            { value: filterStatus, set: setFilterStatus, options: STATUSES, placeholder: 'All Status' },
            { value: filterRisk, set: setFilterRisk, options: ['HIGH', 'MEDIUM', 'LOW'], placeholder: 'All Risk Levels' },
          ].map((f, i) => (
            <select key={i} className="input-glass" style={{ flex: '0 1 160px' }}
              value={f.value} onChange={e => f.set(e.target.value)}>
              <option value="">{f.placeholder}</option>
              {f.options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          ))}

          <div style={{ display: 'flex', gap: 4, background: 'var(--text-primary)', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            {[['grid', '⊞'], ['map', '🗺️']].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
                background: view === v ? '#4f46e5' : 'transparent',
                color: view === v ? 'var(--text-primary)' : '#64748b', transition: 'all 0.2s',
              }}>{icon}</button>
            ))}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>
            {filtered.length} projects
          </div>
        </div>

        {/* Map View */}
        {view === 'map' && (
          <div style={{ marginBottom: 32 }}>
            <ProjectMap projects={filtered} height={500} onMarkerClick={p => setSelectedProject(p)} />
          </div>
        )}

        {/* Grid View */}
        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {loading
              ? Array(6).fill(0).map((_, i) => (
                  <div key={i} className="glass-card-static" style={{ padding: 20, height: 220 }}>
                    <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 18, width: '90%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 20 }} />
                    <div className="skeleton" style={{ height: 6, width: '100%', marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 14, width: '70%' }} />
                  </div>
                ))
              : filtered.map(p => (
                  <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                ))
            }
            {!loading && filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#475569' }}>No projects found</div>
                <div>Try adjusting your filters</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }} onClick={() => { setSelectedProject(null); setShowReport(false); }}>
          <div style={{
            background: 'var(--text-primary)', border: '1px solid #e2e8f0',
            borderRadius: 20, padding: 32, maxWidth: 600, width: '100%',
            maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  {selectedProject.category}
                </div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {selectedProject.title}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                  📍 {selectedProject.district}, {selectedProject.state}
                </p>
              </div>
              <button onClick={() => { setSelectedProject(null); setShowReport(false); }}
                style={{ background: 'var(--text-primary)', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontSize: 16 }}>✕</button>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Completion Progress</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{selectedProject.completionPct}%</span>
              </div>
              <div className="progress-track" style={{ height: 8 }}>
                <div className="progress-fill" style={{
                  width: `${selectedProject.completionPct}%`,
                  background: selectedProject.status === 'STALLED' ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                    : selectedProject.status === 'COMPLETED' ? 'linear-gradient(90deg, #059669, #34d399)'
                    : 'linear-gradient(90deg, #4f46e5, #818cf8)',
                }} />
              </div>
            </div>

            {/* Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Budget', value: formatCurrency(selectedProject.budget), color: '#475569' },
                { label: 'Disbursed', value: formatCurrency(selectedProject.disbursed), color: '#4f46e5' },
                { label: 'Risk Score', value: `${selectedProject.riskScore}/100`, color: selectedProject.riskScore >= 70 ? '#dc2626' : selectedProject.riskScore >= 40 ? '#d97706' : '#059669' },
              ].map(item => (
                <div key={item.label} style={{ padding: 12, background: '#f8fafc', borderRadius: 10, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {selectedProject.description && (
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20, padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                {selectedProject.description}
              </div>
            )}

            {/* Report Section */}
            {!showReport ? (
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setShowReport(true)}>
                📍 Submit Community Progress Report
              </button>
            ) : (
              <div style={{ padding: 20, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12 }}>
                {reportSubmitted ? (
                  <div style={{ textAlign: 'center', color: '#059669', fontWeight: 600, padding: 20 }}>
                    ✅ Report submitted! Thank you for contributing to transparency.
                  </div>
                ) : (
                  <form onSubmit={handleReport}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>📝 Report Ground-Truth Status</div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Your Name (optional)</label>
                      <input className="input-glass" placeholder="Anonymous" value={reportForm.name}
                        onChange={e => setReportForm({ ...reportForm, name: e.target.value })} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>What is the actual status on-ground? *</label>
                      <select className="input-glass" required value={reportForm.statusClaim}
                        onChange={e => setReportForm({ ...reportForm, statusClaim: e.target.value })}>
                        <option value="">Select status you observed</option>
                        <option value="NOT_STARTED">Not Started — no work visible</option>
                        <option value="LESS_THAN_25_PCT">Less than 25% complete</option>
                        <option value="ABOUT_50_PCT">About 50% complete</option>
                        <option value="MORE_THAN_75_PCT">More than 75% complete</option>
                        <option value="COMPLETED">Fully Completed</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>What did you observe?</label>
                      <textarea className="input-glass" rows={3} style={{ resize: 'vertical' }}
                        placeholder="Describe what you see at the project site..."
                        value={reportForm.evidenceText}
                        onChange={e => setReportForm({ ...reportForm, evidenceText: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit Report</button>
                      <button type="button" className="btn-secondary" onClick={() => setShowReport(false)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

