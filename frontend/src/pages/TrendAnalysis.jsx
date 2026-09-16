import { useEffect, useState } from 'react';
import { aiApi, formatCurrency } from '../api';
import StatCard from '../components/StatCard';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#0891b2', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

// ─── SVG Line Chart ──────────────────────────────────────────────────────────
function LineChart({ data, width = 600, height = 260, label = 'Value' }) {
  if (!data || data.length < 2) return <div style={{ color: 'var(--text-secondary)', padding: 40, textAlign: 'center' }}>Not enough data</div>;

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const maxY = Math.max(...data.map(d => d.value)) * 1.15;
  const minY = 0;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * w,
    y: padding.top + h - ((d.value - minY) / (maxY - minY)) * h,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + h} L ${points[0].x} ${padding.top + h} Z`;

  // Y-axis labels
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => Math.round(minY + ((maxY - minY) / yTicks) * i));

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = padding.top + h - ((v - minY) / (maxY - minY)) * h;
        return (
          <g key={i}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" style={{ fontSize: 10, fill: 'var(--text-secondary)' }}>
              {v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : v.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Area */}
      <path d={areaPath} className="chart-area" fill="url(#lineGradient)" />
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Line */}
      <path d={linePath} className="chart-line" stroke="#6366f1" />

      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#6366f1" stroke="#fff" strokeWidth={2} className="chart-dot" />
          {data.length <= 12 && (
            <text x={p.x} y={height - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text-secondary)' }}>
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data, width = 600, height = 260 }) {
  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 50, left: 60 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const maxY = Math.max(...data.map(d => d.value)) * 1.15;
  const barWidth = Math.min(40, (w / data.length) * 0.6);
  const gap = (w - barWidth * data.length) / (data.length + 1);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const v = Math.round(maxY * pct);
        const y = padding.top + h - pct * h;
        return (
          <g key={i}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" style={{ fontSize: 10, fill: 'var(--text-secondary)' }}>
              {v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : v.toLocaleString()}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = (d.value / maxY) * h;
        const x = padding.left + gap + i * (barWidth + gap);
        const y = padding.top + h - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={4}
              fill={d.color || COLORS[i % COLORS.length]} className="chart-bar" opacity={0.85} />
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle"
              style={{ fontSize: 9, fill: '#64748b', fontWeight: 500 }}
              transform={data.length > 6 ? `rotate(-30, ${x + barWidth / 2}, ${height - 8})` : ''}>
              {d.label.length > 12 ? d.label.slice(0, 10) + '…' : d.label}
            </text>
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle"
              style={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}>
              {d.value >= 100000 ? `₹${(d.value / 100000).toFixed(0)}L` : d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────
function DonutChart({ data, size = 220 }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, radius = size * 0.35;
  const strokeWidth = size * 0.15;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const seg = { ...d, pct, dash, offset, color: d.color || COLORS[i % COLORS.length] };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={radius}
            fill="none" stroke={s.color} strokeWidth={strokeWidth}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            className="donut-segment"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, fill: '#0f172a' }}>
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-secondary)' }}>Total</text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: '#475569', minWidth: 80 }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.value}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TrendAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiApi.getTrends()
      .then(d => { setData(d); setLoading(false); })
      .catch(console.error);
  }, []);

  const expenditureLineData = data?.expenditureTrend?.map(m => ({
    label: m.month.split('-').slice(1).join('/'),
    value: m.disbursed,
  })) || [];

  const categoryBarData = data?.categoryDistribution?.map((c, i) => ({
    label: c.category,
    value: c.budget,
    color: COLORS[i % COLORS.length],
  })) || [];

  const stateBarData = data?.statePerformance?.map((s, i) => ({
    label: s.state.split(' ')[0],
    value: s.utilizationPct,
    color: s.utilizationPct >= 80 ? '#10b981' : s.utilizationPct >= 50 ? '#6366f1' : '#f43f5e',
  })) || [];

  const riskDonutData = data?.riskDistribution ? [
    { label: 'High Risk', value: data.riskDistribution.high, color: '#f43f5e' },
    { label: 'Medium Risk', value: data.riskDistribution.medium, color: '#f59e0b' },
    { label: 'Low Risk', value: data.riskDistribution.low, color: '#10b981' },
  ] : [];

  const statusDonutData = data?.statusDistribution ? [
    { label: 'Completed', value: data.statusDistribution.COMPLETED, color: '#10b981' },
    { label: 'In Progress', value: data.statusDistribution.IN_PROGRESS, color: '#6366f1' },
    { label: 'Stalled', value: data.statusDistribution.STALLED, color: '#f43f5e' },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 60px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0f4ff 50%, #faf5ff 100%)',
        borderBottom: '1px solid #e2e8f0', padding: '40px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: '#eef2ff', border: '1px solid #c7d2fe',
            fontSize: 12, fontWeight: 600, color: '#4f46e5', marginBottom: 16,
          }}>📈 Analytics & Trend Analysis</div>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px',
            background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 80%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>MPLADS Trend Analysis</h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, lineHeight: 1.7 }}>
            Expenditure patterns, category distributions, risk trends, and performance analytics across all MPLADS projects.
          </p>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginTop: 24 }}>
            {[
              { label: 'Total Projects', value: data?.summary?.totalProjects || 0, icon: '📋', color: '#4f46e5' },
              { label: 'Total Budget', value: data ? Math.round(data.summary.totalBudget / 10000000) : 0, unit: ' Cr', icon: '💰', color: '#d97706' },
              { label: 'Avg Risk', value: data?.summary?.avgRiskScore || 0, icon: '⚡', color: '#f43f5e' },
              { label: 'Avg Completion', value: data?.summary?.avgCompletionPct || 0, unit: '%', icon: '📊', color: '#10b981' },
            ].map(s => <StatCard key={s.label} {...s} loading={loading} />)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        {!loading && data && (
          <>
            {/* Row 1: Expenditure Line + Category Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="chart-container">
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
                  💰 Monthly Expenditure Trend
                </h3>
                <LineChart data={expenditureLineData} />
              </div>
              <div className="chart-container">
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
                  📊 Category-wise Budget Allocation
                </h3>
                <BarChart data={categoryBarData} />
              </div>
            </div>

            {/* Row 2: Risk Donut + Status Donut + State Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0f172a', alignSelf: 'flex-start' }}>
                  🚨 Risk Distribution
                </h3>
                <DonutChart data={riskDonutData} size={180} />
              </div>
              <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0f172a', alignSelf: 'flex-start' }}>
                  📋 Status Breakdown
                </h3>
                <DonutChart data={statusDonutData} size={180} />
              </div>
              <div className="chart-container">
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
                  🗺️ State Utilization (%)
                </h3>
                <BarChart data={stateBarData} height={220} />
              </div>
            </div>

            {/* Row 3: Top Risk Projects Table */}
            <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  🔥 Top Risk Projects Requiring Attention
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project</th><th>Risk Score</th><th>Status</th><th>Completion</th><th>Budget</th><th>MP</th><th>Agency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topRiskProjects.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: '#0f172a', maxWidth: 250 }}>{p.title}</td>
                        <td>
                          <span className={`badge badge-${p.riskScore >= 70 ? 'high' : p.riskScore >= 40 ? 'medium' : 'low'}`}>
                            {p.riskScore}/100
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${p.status === 'COMPLETED' ? 'low' : p.status === 'STALLED' ? 'high' : 'info'}`}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-track" style={{ width: 50 }}>
                              <div className="progress-fill" style={{
                                width: `${p.completionPct}%`,
                                background: p.completionPct >= 80 ? '#10b981' : p.completionPct >= 40 ? '#6366f1' : '#f43f5e',
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{p.completionPct}%</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: '#4f46e5' }}>{formatCurrency(p.budget)}</td>
                        <td style={{ fontSize: 12 }}>{p.mpName}</td>
                        <td style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.agencyName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

