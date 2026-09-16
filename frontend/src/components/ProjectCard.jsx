import { formatCurrency } from '../api';

// Force HMR
const STATUS_CONFIG = {
  COMPLETED:   { label: 'Completed',   color: '#34d399', icon: '✓' },
  IN_PROGRESS: { label: 'In Progress', color: '#818cf8', icon: '⟳' },
  STALLED:     { label: 'Stalled',     color: '#f87171', icon: '!' },
  PENDING:     { label: 'Pending',     color: '#fbbf24', icon: '◷' },
};

const CATEGORY_ICONS = {
  ROADS: '🛣️', INFRASTRUCTURE: '🏗️', EDUCATION: '🏫', HEALTH: '🏥',
  WATER: '💧', ENERGY: '⚡', COMMUNITY: '🏘️', SANITATION: '🚽',
  ENVIRONMENT: '🌳', RURAL: '🌾',
};

function CircularProgress({ pct, size = 56, strokeWidth = 4, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, pct) / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring" style={{ flexShrink: 0 }}>
      <circle className="progress-ring-track" cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} />
      <circle
        className="progress-ring-fill"
        cx={size/2} cy={size/2} r={radius}
        strokeWidth={strokeWidth}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text
        x={size/2} y={size/2}
        textAnchor="middle" dominantBaseline="central"
        style={{
          fontFamily: 'Outfit, sans-serif', fontSize: size > 50 ? 14 : 11,
          fontWeight: 800, fill: 'var(--text-primary)',
          transform: 'rotate(90deg)', transformOrigin: 'center',
        }}
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function ProjectCard({ project, onClick }) {
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.IN_PROGRESS;
  const riskLevel = project.riskLevel || (project.riskScore >= 70 ? 'HIGH' : project.riskScore >= 40 ? 'MEDIUM' : 'LOW');

  const riskGradient = riskLevel === 'HIGH'
    ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
    : riskLevel === 'MEDIUM'
    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
    : 'linear-gradient(90deg, #10b981, #059669)';

  const riskGlow = riskLevel === 'HIGH'
    ? 'rgba(244,63,94,0.2)'
    : riskLevel === 'MEDIUM'
    ? 'rgba(245,158,11,0.15)'
    : 'rgba(16,185,129,0.12)';

  const progressColor = project.status === 'STALLED' ? '#f43f5e'
    : project.status === 'COMPLETED' ? '#34d399' : '#818cf8';

  const disbPct = project.budget > 0 ? Math.round((project.disbursed / project.budget) * 100) : 0;

  // Days remaining
  const endDate = new Date(project.endDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  const isOverdue = endDate < now && project.status !== 'COMPLETED';

  return (
    <div
      className="project-card"
      onClick={onClick}
      style={{
        '--card-accent': riskGradient,
        '--card-glow': riskGlow,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="card-shimmer" />
      <div className="card-inner">

        {/* Top Row: Category + Risk */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="category-pill">
              <span style={{ fontSize: 12 }}>{CATEGORY_ICONS[project.category] || '📌'}</span>
              {project.category}
            </span>
            {project.lapseRisk && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#f87171',
                background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.25)',
                padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5,
                animation: 'pulse-critical 2s infinite',
              }}>⚡ LAPSE</span>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 20,
            background: `${riskLevel === 'HIGH' ? 'rgba(244,63,94,0.12)' : riskLevel === 'MEDIUM' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)'}`,
            border: `1px solid ${riskLevel === 'HIGH' ? 'rgba(244,63,94,0.25)' : riskLevel === 'MEDIUM' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
          }}>
            <span className={`risk-dot ${riskLevel.toLowerCase()}`} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              color: riskLevel === 'HIGH' ? '#f87171' : riskLevel === 'MEDIUM' ? '#fbbf24' : '#6ee7b7',
            }}>{project.riskScore}</span>
          </div>
        </div>

        {/* Title + Location */}
        <h3 style={{
          fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.45, margin: '0 0 6px', letterSpacing: -0.2,
        }}>
          {project.title}
        </h3>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ opacity: 0.7 }}>📍</span>
          {project.district}, {project.state}
        </p>

        {/* Progress + Budget Row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <CircularProgress pct={project.completionPct || 0} color={progressColor} />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Budget */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Budget</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                  {formatCurrency(project.budget)}
                </span>
              </div>
              <div className="budget-bar-track">
                <div className="budget-bar-fill" style={{
                  width: `${disbPct}%`,
                  background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                {formatCurrency(project.disbursed)} disbursed ({disbPct}%)
              </div>
            </div>

            {/* Status + Timeline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20,
                background: `${statusCfg.color}18`,
                border: `1px solid ${statusCfg.color}30`,
                fontSize: 10, fontWeight: 600, color: statusCfg.color,
              }}>
                <span style={{ fontWeight: 800 }}>{statusCfg.icon}</span> {statusCfg.label}
              </div>

              {project.status !== 'COMPLETED' && (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: isOverdue ? '#f87171' : daysLeft < 60 ? '#fbbf24' : 'var(--text-muted)',
                }}>
                  {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer: MP + Agency */}
        {(project.mpName || project.agencyName) && (
          <div style={{
            paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 11, color: 'var(--text-muted)',
            gap: 8,
          }}>
            {project.mpName && (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🏛️ {project.mpName}
              </span>
            )}
            {project.agencyName && (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                🔧 {project.agencyName}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

