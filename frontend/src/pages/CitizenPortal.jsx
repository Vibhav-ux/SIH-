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
  const [view, setView] = useState('grid');
  const [mpScores, setMpScores] = useState([]);
  
  // New State variables for WOW features
  const [isLocating, setIsLocating] = useState(false);
  const [sliderPos, setSliderPos] = useState(50); // Satellite slider position (0-100)
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Single combined call instead of 3 separate ones
    citizenApi.getSummary()
      .then(({ stats, projects: p, total }) => {
        setStats(stats);
        setProjects(p);
        setFiltered(p);
        setLoading(false);
      })
      .catch(console.error);

    // MP scores load separately in background (non-blocking)
    aiApi.getMPScores()
      .then(ms => setMpScores(ms.scores?.slice(0, 5) || []))
      .catch(() => {});
  }, []);


  useEffect(() => {
    let result = [...projects];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q) ||
        p.district?.toLowerCase().includes(q)
      );
    }
    if (filterCategory) result = result.filter(p => p.category === filterCategory);
    if (filterStatus) result = result.filter(p => p.status === filterStatus);
    if (filterRisk) result = result.filter(p => p.riskLevel === filterRisk);

    if (userLocation) {
      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };
      
      result = result.map(p => ({
        ...p,
        distance: getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
      })).sort((a, b) => a.distance - b.distance).slice(0, 30);
    }

    setFiltered(result);
  }, [search, filterCategory, filterStatus, filterRisk, projects, userLocation]);

  async function handleReport(e) {
    e.preventDefault();
    if (!reportForm.statusClaim) return;
    await citizenApi.submitReport({ projectId: selectedProject.id, ...reportForm });
    setReportSubmitted(true);
    // Don't auto-close modal immediately so they can see the gamification
    setTimeout(() => { 
      setShowReport(false); 
      setReportSubmitted(false); 
      setReportForm({ statusClaim: '', evidenceText: '', name: '' }); 
      setSelectedProject(null);
    }, 4000);
  }

  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          alert('Could not get live location. Ensure location permissions are granted.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  const gradeColor = (g) => ({ A: '#059669', B: '#4f46e5', C: '#d97706', D: '#ea580c', F: '#dc2626' }[g] || 'var(--text-secondary)');

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 60px' }}>
      <style>
        {`
          @keyframes scrollTicker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes popIn {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .ticker-track {
            display: flex;
            width: fit-content;
            animation: scrollTicker 30s linear infinite;
          }
          .ticker-track:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0f4ff 50%, #ecfeff 100%)',
        borderBottom: '1px solid #e2e8f0',
        padding: '48px 24px 32px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20,
              background: '#eef2ff', border: '1px solid #c7d2fe',
              fontSize: 12, fontWeight: 600, color: '#4f46e5', marginBottom: 20,
            }}>
              🇮🇳 Citizen Public Tracker • No Login Required
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
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

      {/* 3. Live Activity Ticker */}
      <div style={{ background: '#1e293b', color: '#e2e8f0', padding: '10px 0', fontSize: '0.85rem', overflow: 'hidden', borderBottom: '1px solid #334155' }}>
        <div className="ticker-track">
          {[
            '👤 Rahul from Varanasi reported a stalled road project',
            '🏛️ MP Priya Nair hit 90% fund utilization',
            '🚨 AI flagged a double-funding risk in Lucknow',
            '✅ New community center approved in Pune',
            '📸 Evidence uploaded for school renovation in Kochi',
            // Duplicate for seamless scroll
            '👤 Rahul from Varanasi reported a stalled road project',
            '🏛️ MP Priya Nair hit 90% fund utilization',
            '🚨 AI flagged a double-funding risk in Lucknow',
            '✅ New community center approved in Pune',
            '📸 Evidence uploaded for school renovation in Kochi'
          ].map((msg, i) => (
            <span key={i} style={{ margin: '0 30px', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              {msg}
            </span>
          ))}
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
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex w-full md:flex-1 min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base z-10">🔍</span>
            <input
              className="input-glass pl-10 rounded-r-none border-r-0 flex-1"
              placeholder="Search projects, state, district..."
              value={search}
              onChange={e => { setSearch(e.target.value); setUserLocation(null); }}
            />
            {/* 1. Projects Near Me Button */}
            <button 
              onClick={handleLocateMe}
              disabled={isLocating}
              className="px-3 md:px-4 bg-slate-50 border border-slate-200 rounded-r-lg text-indigo-600 font-semibold text-xs md:text-sm flex items-center gap-1 md:gap-2 transition-all"
            >
              {isLocating ? <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span> : <span>📍</span>}
              {isLocating ? 'Locating...' : 'Near Me'}
            </button>
          </div>

          {[
            { value: filterCategory, set: setFilterCategory, options: CATEGORIES, placeholder: 'All Categories' },
            { value: filterStatus, set: setFilterStatus, options: STATUSES, placeholder: 'All Status' },
            { value: filterRisk, set: setFilterRisk, options: ['HIGH', 'MEDIUM', 'LOW'], placeholder: 'All Risk Levels' },
          ].map((f, i) => (
            <select key={i} className="input-glass w-full md:w-[160px] flex-none"
              value={f.value} onChange={e => f.set(e.target.value)}>
              <option value="">{f.placeholder}</option>
              {f.options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          ))}

          <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 w-full justify-center md:w-auto">
            {[['grid', '⊞'], ['map', '🗺️']].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-md border-none cursor-pointer text-sm transition-all flex-1 md:flex-none ${view === v ? 'bg-indigo-600 text-white' : 'bg-transparent text-slate-500'}`}>
                {icon}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 hidden md:block">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }} onClick={() => { setSelectedProject(null); setShowReport(false); }}>
          <div style={{
            background: 'var(--text-primary)', border: '1px solid #e2e8f0',
            borderRadius: 20, padding: 32, maxWidth: 650, width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  {selectedProject.category}
                </div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {selectedProject.title}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                  📍 {selectedProject.district}, {selectedProject.state}
                </p>
              </div>
              <button onClick={() => { setSelectedProject(null); setShowReport(false); }}
                style={{ background: 'var(--text-primary)', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontSize: 16 }}>✕</button>
            </div>

            {/* 2. Real-Time Satellite Location */}
            <div style={{ marginBottom: 24, background: '#f8fafc', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🛰️ Live Satellite Verification
                </span>
                <div style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>
                  Live Coordinates
                </div>
              </div>
              <div style={{ position: 'relative', height: 260, width: '100%', pointerEvents: 'auto' }}>
                <ProjectMap projects={[selectedProject]} height={260} />
              </div>
            </div>

            {/* Budget & Progress */}
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

            {/* Report Section */}
            {!showReport ? (
              <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px' }} onClick={() => setShowReport(true)}>
                <span>📍</span> Submit Community Progress Report
              </button>
            ) : (
              <div style={{ padding: 24, background: '#fff', border: '1px solid #c7d2fe', borderRadius: 16, boxShadow: '0 4px 20px rgba(79, 70, 229, 0.08)' }}>
                {reportSubmitted ? (
                  // 4. Gamification Success State
                  <div style={{ textAlign: 'center', padding: '20px 10px', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Report Verified!</div>
                    <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Thank you for holding representatives accountable.</div>
                    <div style={{ 
                      display: 'inline-block', background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                      color: 'white', padding: '10px 20px', borderRadius: 30, fontSize: 15, fontWeight: 700, 
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' 
                    }}>
                      ⭐ +50 Transparency Points
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleReport}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                      📝 Report Ground-Truth Status
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Your Name (optional)</label>
                      <input className="input-glass" placeholder="e.g. Rahul, Local Resident" value={reportForm.name}
                        onChange={e => setReportForm({ ...reportForm, name: e.target.value })} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>What is the actual status on-ground? *</label>
                      <select className="input-glass" required value={reportForm.statusClaim}
                        onChange={e => setReportForm({ ...reportForm, statusClaim: e.target.value })}>
                        <option value="">Select status you observed...</option>
                        <option value="NOT_STARTED">Not Started — no work visible</option>
                        <option value="LESS_THAN_25_PCT">Less than 25% complete</option>
                        <option value="ABOUT_50_PCT">About 50% complete</option>
                        <option value="MORE_THAN_75_PCT">More than 75% complete</option>
                        <option value="COMPLETED">Fully Completed</option>
                      </select>
                    </div>
                    
                    {/* 5. Audio / Video Proof UI */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Attach Proof (Required for High Trust Score)</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={() => alert('Camera module opened!')} style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 8, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', ':hover': { borderColor: '#4f46e5', color: '#4f46e5' } }}>
                          📸 Photo / Video
                        </button>
                        <button type="button" onClick={() => alert('Microphone recording started!')} style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 8, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', ':hover': { borderColor: '#4f46e5', color: '#4f46e5' } }}>
                          🎙️ Record Audio
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Additional Details</label>
                      <textarea className="input-glass" rows={3} style={{ resize: 'vertical' }}
                        placeholder="Describe what you see at the project site..."
                        value={reportForm.evidenceText}
                        onChange={e => setReportForm({ ...reportForm, evidenceText: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px' }}>Submit Evidence</button>
                      <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowReport(false)}>Cancel</button>
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
