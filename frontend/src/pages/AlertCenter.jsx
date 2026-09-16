import { useEffect, useState } from 'react';
import { aiApi } from '../api';
import StatCard from '../components/StatCard';
import SatelliteVerificationModal from '../components/SatelliteVerificationModal';

const TYPE_LABELS = {
  RISK_ANOMALY: 'Risk Anomaly',
  FUND_LAPSE: 'Fund Lapse',
  DUPLICATE_PROJECT: 'Duplicate Project',
  DOUBLE_FUNDING: 'Double Funding',
  COMMUNITY_MISMATCH: 'Community Mismatch',
  COMPLAINT: 'Complaint',
};

const SEVERITY_COLORS = {
  CRITICAL: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#dc2626', icon: '🔴' },
  HIGH: { bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', text: '#e11d48', icon: '🟠' },
  MEDIUM: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#d97706', icon: '🟡' },
  LOW: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#059669', icon: '🟢' },
};

export default function AlertCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [acknowledged, setAcknowledged] = useState(new Set());
  
  // Satellite Modal State
  const [satelliteProject, setSatelliteProject] = useState(null);

  useEffect(() => {
    aiApi.getAlerts()
      .then(d => { setData(d); setLoading(false); })
      .catch(console.error);
  }, []);

  const filtered = (data?.alerts || []).filter(a => {
    if (filterSeverity && a.severity !== filterSeverity) return false;
    if (filterType && a.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q) ||
        a.projectTitle?.toLowerCase().includes(q) || a.mpName?.toLowerCase().includes(q);
    }
    return true;
  });

  function handleAcknowledge(id) {
    setAcknowledged(prev => new Set([...prev, id]));
  }

  function handleVerifySatellite(alert) {
    // Only open if the alert has coordinates
    if (alert.projectLat && alert.projectLng) {
      setSatelliteProject({
        id: alert.projectId,
        title: alert.projectTitle,
        lat: alert.projectLat,
        lng: alert.projectLng,
        budget: alert.projectBudget || 0,
        agencyName: alert.projectAgency || 'Unknown Agency'
      });
    } else {
      alert('Error: No GPS coordinates found for this project.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 60px' }}>
      
      {/* Satellite Modal */}
      <SatelliteVerificationModal 
        isOpen={!!satelliteProject} 
        onClose={() => setSatelliteProject(null)} 
        project={satelliteProject} 
      />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 50%, #fef3c7 100%)',
        borderBottom: '1px solid #e2e8f0', padding: '40px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: '#fef2f2', border: '1px solid #fecaca',
            fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 16,
          }}>🚨 Centralized Alert & Notification Hub</div>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px',
            background: 'linear-gradient(135deg, #0f172a 0%, #dc2626 80%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Alert Center</h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, lineHeight: 1.7 }}>
            Unified alerts from all detection engines — risk anomalies, fund lapse warnings, duplicates, double funding, and community mismatches.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginTop: 24 }}>
            {[
              { label: 'Total Alerts', value: data?.total || 0, icon: '🔔', color: '#4f46e5' },
              { label: 'Critical', value: data?.critical || 0, icon: '🔴', color: '#dc2626' },
              { label: 'High', value: data?.high || 0, icon: '🟠', color: '#e11d48' },
              { label: 'Medium', value: data?.medium || 0, icon: '🟡', color: '#d97706' },
              { label: 'Low', value: data?.low || 0, icon: '🟢', color: '#059669' },
            ].map(s => <StatCard key={s.label} {...s} loading={loading} />)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input className="input-glass" style={{ paddingLeft: 38 }}
              placeholder="Search alerts, projects, MPs..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-glass" style={{ maxWidth: 180 }}
            value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="">All Severity</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>
          <select className="input-glass" style={{ maxWidth: 200 }}
            value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filtered.length} alerts</span>
        </div>

        {/* Alert List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(alert => {
            const sev = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.LOW;
            const isAcked = acknowledged.has(alert.id);

            return (
              <div key={alert.id} className={`alert-card ${alert.severity.toLowerCase()}`}
                style={{ opacity: isAcked ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                {/* Icon */}
                <div className={`alert-icon ${alert.severity.toLowerCase()}`}>
                  {alert.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{alert.title}</span>
                    <span className={`badge badge-${alert.severity === 'CRITICAL' ? 'critical' : alert.severity === 'HIGH' ? 'high' : alert.severity === 'MEDIUM' ? 'medium' : 'low'}`}>
                      {alert.severity}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5',
                    }}>{TYPE_LABELS[alert.type] || alert.type}</span>
                  </div>

                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 6px' }}>
                    {alert.message}
                  </p>

                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    {alert.projectTitle && <span>📋 {alert.projectTitle}</span>}
                    {alert.mpName && <span>🏛️ {alert.mpName}</span>}
                    {alert.score != null && <span>Score: {alert.score}</span>}
                    <span>🕐 {alert.category}</span>
                  </div>
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  
                  {/* Show Verify via Satellite if it's a Risk Anomaly */}
                  {alert.type === 'RISK_ANOMALY' && alert.projectLat && !isAcked && (
                    <button 
                      onClick={() => handleVerifySatellite(alert)} 
                      style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: '#dc2626', color: 'white', border: 'none',
                        cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
                      }}
                    >
                      🛰️ Verify via Satellite
                    </button>
                  )}

                  {!isAcked ? (
                    <button onClick={() => handleAcknowledge(alert.id)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: 'var(--text-primary)', border: '1px solid #e2e8f0', color: '#475569',
                      cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                    }}>Acknowledge</button>
                  ) : (
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>✓ Acknowledged</span>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#475569', marginBottom: 8 }}>No alerts match your filters</div>
              <div>Try adjusting severity or type filters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

