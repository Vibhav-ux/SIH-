export default function RiskBadge({ score, level, showScore = true, size = 'md' }) {
  const riskLevel = level || (score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW');
  const color = riskLevel === 'HIGH' ? '#f43f5e' : riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';
  const bg = `${color}15`;
  const border = `${color}30`;
  const icon = riskLevel === 'HIGH' ? '🔴' : riskLevel === 'MEDIUM' ? '🟡' : '🟢';

  const sizeMap = {
    sm: { padding: '2px 8px', fontSize: 10 },
    md: { padding: '4px 12px', fontSize: 12 },
    lg: { padding: '6px 16px', fontSize: 14 },
  };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      ...sizeMap[size],
      borderRadius: 20,
      background: bg,
      border: `1px solid ${border}`,
      color,
      fontWeight: 700,
      letterSpacing: 0.5,
    }}>
      {icon} {riskLevel} {showScore && score !== undefined && `· ${score}`}
    </span>
  );
}
