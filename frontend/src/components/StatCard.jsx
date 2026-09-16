import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

export default function StatCard({ label, value, unit = '', icon, color = '#4f46e5', subtitle, trend, loading = false }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animated = useCountUp(numericValue);
  const displayValue = typeof value === 'number' ? animated.toLocaleString('en-IN') : value;

  if (loading) {
    return (
      <div className="glass-card-static" style={{ padding: 24 }}>
        <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '80%' }} />
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{ padding: 24, cursor: 'default', position: 'relative', overflow: 'hidden' }}
    >
      {/* Glow background */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        borderRadius: '0 16px 0 80px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>
          {label}
        </div>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1,
          animation: 'slideUp 0.4s ease-out',
        }}>
          {displayValue}
        </span>
        {unit && <span style={{ fontSize: 16, fontWeight: 600, color }}>{unit}</span>}
      </div>

      {subtitle && (
        <div style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</div>
      )}

      {trend !== undefined && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
          padding: '2px 8px', borderRadius: 20,
          background: trend >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
          fontSize: 11, fontWeight: 600,
          color: trend >= 0 ? '#059669' : '#dc2626',
        }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 24, right: 24, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        borderRadius: 1,
      }} />
    </div>
  );
}
