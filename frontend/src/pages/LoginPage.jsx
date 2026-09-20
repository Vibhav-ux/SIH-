import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mpApi, formatCurrency } from '../api';

const ROLES = [
  { id: 'citizen',   label: 'Citizen',               icon: '🏘️', desc: 'View projects, submit complaints & reports', path: '/app/',         color: '#22c55e' },
  { id: 'mp',        label: 'Member of Parliament',   icon: '🏛️', desc: 'Manage your MPLAD funds & projects',          path: '/app/mp',       color: '#ff9933' },
  { id: 'ministry',  label: 'Ministry Official',      icon: '🏢', desc: 'Oversee all MPs, approve proposals',          path: '/app/ministry', color: '#f59e0b' },
  { id: 'agency',    label: 'Implementing Agency',    icon: '🏗️', desc: 'Submit project progress updates',             path: '/app/agency',   color: '#818cf8' },
];

/* ── Particle Canvas ─────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const COLORS = ['#ff9933', '#22c55e', '#f59e0b', '#818cf8', '#38bdf8'];
    const N = 70;

    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.6 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.008,
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        // Breathing: alpha pulses in/out
        const liveAlpha = p.alpha * (0.4 + 0.6 * Math.abs(Math.sin(p.pulse)));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(liveAlpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Draw faint connection lines to close neighbors
        particles.forEach(q => {
          if (q === p) return;
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color + Math.round((1 - dist / 90) * 0.12 * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf.current = requestAnimationFrame(draw);
    }

    draw();

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

// ── Ministry credentials (demo) ──────────────────────────────────────────────
const MINISTRY_CREDS = [
  { username: 'admin',       password: 'ministry@2026', name: 'Nodal Officer, MoPR' },
  { username: 'ministry',    password: 'India@2024',    name: 'Joint Secretary, MoPR' },
  { username: 'superadmin',  password: 'mplad#sentinel', name: 'Secretary, MoPR' },
];

/* ── Ministry Login Sub-Form ─────────────────────────────────────────────── */
function MinistryLoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network auth delay
    setTimeout(() => {
      const match = MINISTRY_CREDS.find(
        c => c.username === username.trim() && c.password === password
      );
      if (match) {
        localStorage.setItem('mplad_ministry_auth', 'true');
        localStorage.setItem('mplad_ministry_user', match.name);
        setError('');
        onSuccess();
      } else {
        setError('Invalid credentials. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem',
      backdropFilter: 'blur(12px)',
      animation: shake ? 'shake 0.5s ease' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.2))',
          border: '1px solid rgba(245,158,11,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🔐</div>
        <div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>Ministry Official Access</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Secure portal — authorised personnel only</div>
        </div>
      </div>

      {/* Username */}
      <div style={{ marginBottom: '0.85rem' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.76rem', fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Username
        </label>
        <input
          type="text" autoComplete="username"
          value={username} onChange={e => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '0.75rem 1rem', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.25)'}`,
            color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
          }}
        />
      </div>

      {/* Password */}
      <div style={{ marginBottom: '1rem', position: 'relative' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.76rem', fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPwd ? 'text' : 'password'} autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.75rem 2.8rem 0.75rem 1rem', borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.25)'}`,
              color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
            }}
          />
          <button type="button" onClick={() => setShowPwd(v => !v)} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b',
          }}>{showPwd ? '🙈' : '👁️'}</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: '0.85rem', padding: '0.6rem 1rem', borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: '0.82rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '0.8rem', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#fff', fontSize: '0.9rem', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.75 : 1, transition: 'all 0.2s',
        boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
        letterSpacing: '0.5px',
      }}>
        {loading ? '⏳ Verifying...' : '🔓 Authenticate & Enter'}
      </button>

      <div style={{ textAlign: 'center', color: '#334155', fontSize: '0.7rem', marginTop: '0.85rem' }}>
        Demo credentials: <span style={{ color: '#f59e0b' }}>admin</span> / <span style={{ color: '#f59e0b' }}>ministry@2026</span>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </form>
  );
}

/* ── Main Login Page ─────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [ministryAuthed, setMinistryAuthed] = useState(false);
  const [mpSearch, setMpSearch] = useState('');
  const [mps, setMps]           = useState([]);
  const [selectedMp, setSelectedMp] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const searchTimer = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside the search box
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const AGENCIES = [
    { id: 'ag-001', name: 'Shree Ram Constructions Pvt Ltd', state: 'Uttar Pradesh' },
    { id: 'ag-002', name: 'Kerala Infrastructure Development Corp', state: 'Kerala' },
    { id: 'ag-003', name: 'Vishal Projects Limited', state: 'Uttar Pradesh' },
    { id: 'ag-004', name: 'Sunrise Road Works', state: 'Tamil Nadu' },
    { id: 'ag-005', name: 'Gujarat Civil Engineers Consortium', state: 'Gujarat' },
    { id: 'ag-006', name: 'Deccan Builders & Associates', state: 'Telangana' },
    { id: 'ag-007', name: 'Bengal Public Works Solutions', state: 'West Bengal' },
    { id: 'ag-008', name: 'Andhra Rural Development Trust', state: 'Andhra Pradesh' },
    { id: 'ag-009', name: 'Punjab Water & Sanitation Board', state: 'Punjab' },
    { id: 'ag-010', name: 'MP State Road Development Corp', state: 'Madhya Pradesh' },
    { id: 'ag-011', name: 'National Smart Infra Ltd', state: 'Uttar Pradesh' },
    { id: 'ag-012', name: 'South India Civil Works', state: 'Tamil Nadu' },
    { id: 'ag-013', name: 'Rapid Build Infrastructure', state: 'Gujarat' },
    { id: 'ag-014', name: 'GreenPath Environmental Works', state: 'Karnataka' },
    { id: 'ag-015', name: 'Hill Region Development Agency', state: 'Himachal Pradesh' },
  ];

  // Pre-load MPs list immediately when MP role selected
  useEffect(() => {
    if (selectedRole === 'mp') {
      setLoading(true);
      mpApi.getAll({ limit: 50 })
        .then(data => { setMps(data.mps || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [selectedRole]);

  // Debounced search
  const handleSearchInput = useCallback((e) => {
    const val = e.target.value;
    setMpSearch(val);
    setSelectedMp(null);
    setShowDropdown(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.length >= 2) {
      searchTimer.current = setTimeout(() => {
        mpApi.getAll({ search: val, limit: 20 }).then(data => setMps(data.mps || []));
      }, 250);
    }
  }, []);

  const handleLogin = () => {
    if (!selectedRole) return;
    if (selectedRole === 'mp' && !selectedMp) return;
    if (selectedRole === 'ministry' && !ministryAuthed) return;
    if (selectedRole === 'agency' && !selectedAgency) return;
    const activeId = selectedRole === 'mp' ? selectedMp.id
      : selectedRole === 'agency' ? selectedAgency.id
      : 'mp-001';
    localStorage.setItem('mplad_role', selectedRole);
    localStorage.setItem('mplad_mp_id', activeId);
    localStorage.setItem('mplad_mp_name', selectedMp?.name || selectedAgency?.name || '');
    localStorage.setItem('mplad_mp_state', selectedMp?.state || selectedAgency?.state || '');
    const role = ROLES.find(r => r.id === selectedRole);
    navigate(role.path);
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
      <ParticleCanvas />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem',
          background: 'linear-gradient(135deg, rgba(255,153,51,0.2), rgba(34,197,94,0.15))',
          border: '2px solid rgba(255,153,51,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.2rem',
          boxShadow: '0 0 40px rgba(255,153,51,0.2)',
          animation: 'logoPulse 4s ease-in-out infinite',
        }}>🏛️</div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", color: 'var(--text-primary)', fontSize: '2.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
          Nirikshan <span style={{ color: '#ff9933' }}>AI</span>
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          AI-Powered MPLAD Fund Accountability Platform
        </p>
      </div>

      {/* Role Cards */}
      <div style={{ width: '100%', maxWidth: '860px', position: 'relative', zIndex: 2 }}>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.85rem', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600 }}>
          Select your role to continue
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {ROLES.map(role => (
            <div
              key={role.id}
              onClick={() => { setSelectedRole(role.id); setSelectedMp(null); setSelectedAgency(null); setMpSearch(''); }}
              style={{
                background: selectedRole === role.id
                  ? `linear-gradient(135deg, ${role.color}18, ${role.color}30)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedRole === role.id ? role.color + '60' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '18px',
                padding: '1.5rem 1.25rem',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                textAlign: 'center',
                backdropFilter: 'blur(12px)',
                boxShadow: selectedRole === role.id ? `0 0 30px ${role.color}22` : '0 4px 16px rgba(0,0,0,0.3)',
                transform: selectedRole === role.id ? 'translateY(-4px)' : 'none',
              }}
            >
              <div style={{ fontSize: '2.4rem', marginBottom: '0.7rem' }}>{role.icon}</div>
              <div style={{
                color: selectedRole === role.id ? role.color : 'var(--text-primary)',
                fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem',
                transition: 'color 0.2s',
              }}>{role.label}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.4 }}>{role.desc}</div>
            </div>
          ))}
        </div>

        {/* MP Selector */}
        {selectedRole === 'mp' && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,153,51,0.25)',
            borderRadius: '16px', padding: '1.5rem', marginBottom: '1.25rem',
            backdropFilter: 'blur(12px)',
          }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>
              🔍 Search Your Constituency
            </h3>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <input
                value={selectedMp ? `${selectedMp.name} — ${selectedMp.constituency}` : mpSearch}
                onChange={handleSearchInput}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type MP name or constituency..."
                style={{
                  width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,153,51,0.25)',
                  color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              {loading && (
                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.75rem' }}>
                  Loading...
                </div>
              )}
              {showDropdown && mps.length > 0 && !selectedMp && (
                <div style={{
                  position: 'absolute', bottom: '110%', left: 0, right: 0, zIndex: 999,
                  background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', maxHeight: '220px', overflowY: 'auto', marginBottom: '4px',
                  boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
                }}>
                  {mps.map(mp => (
                    <div
                      key={mp.id}
                      onMouseDown={() => { setSelectedMp(mp); setShowDropdown(false); setMpSearch(''); }}
                      style={{
                        padding: '0.75rem 1rem', cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.88rem' }}>{mp.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '2px' }}>
                        {mp.constituency} • {mp.state} • {mp.type}
                        {mp.totalFunds > 0 && ` • Allocated: ${formatCurrency(mp.totalFunds)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedMp && (
              <div style={{
                marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: '10px',
                background: 'rgba(255,153,51,0.1)', border: '1px solid rgba(255,153,51,0.3)',
              }}>
                <div style={{ color: '#ff9933', fontWeight: 700, fontSize: '0.9rem' }}>✅ {selectedMp.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '3px' }}>
                  {selectedMp.constituency} • {selectedMp.state} • {selectedMp.type}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ministry Auth Gate */}
        {selectedRole === 'ministry' && !ministryAuthed && (
          <MinistryLoginForm onSuccess={() => setMinistryAuthed(true)} />
        )}

        {/* Agency Selector */}
        {selectedRole === 'agency' && (
          <div style={{
            width: '100%', marginBottom: '1.25rem', padding: '1.25rem',
            background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)',
            borderRadius: '16px', backdropFilter: 'blur(12px)',
          }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>
              🏗️ Select Your Agency
            </h3>
            <select
              value={selectedAgency?.id || ''}
              onChange={e => setSelectedAgency(AGENCIES.find(a => a.id === e.target.value) || null)}
              style={{
                width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(129,140,248,0.35)',
                color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">— Select an agency —</option>
              {AGENCIES.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.state})</option>
              ))}
            </select>
            {selectedAgency && (
              <div style={{ marginTop: '0.75rem', padding: '0.7rem 1rem', borderRadius: 10, background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)' }}>
                <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.9rem' }}>✅ {selectedAgency.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 3 }}>{selectedAgency.state}</div>
              </div>
            )}
          </div>
        )}
        {selectedRole === 'ministry' && ministryAuthed && (
          <div style={{
            marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: 12,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>Authentication Successful</div>
              <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>{localStorage.getItem('mplad_ministry_user')} — Ready to enter</div>
            </div>
          </div>
        )}
        {/* Enter Button */}
        <button
          onClick={handleLogin}
          disabled={!selectedRole || (selectedRole === 'mp' && !selectedMp) || (selectedRole === 'ministry' && !ministryAuthed) || (selectedRole === 'agency' && !selectedAgency)}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', padding: '1rem', borderRadius: '14px',
            background: selectedRole
              ? `linear-gradient(135deg, ${ROLES.find(r => r.id === selectedRole)?.color}, ${ROLES.find(r => r.id === selectedRole)?.color}bb)`
              : 'rgba(255,255,255,0.07)',
            border: 'none', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700,
            cursor: selectedRole && (selectedRole !== 'mp' || selectedMp) && (selectedRole !== 'agency' || selectedAgency) ? 'pointer' : 'not-allowed',
            opacity: selectedRole && (selectedRole !== 'mp' || selectedMp) && (selectedRole !== 'ministry' || ministryAuthed) && (selectedRole !== 'agency' || selectedAgency) ? 1 : 0.45,
            transition: 'all 0.25s ease',
            boxShadow: selectedRole ? `0 8px 32px ${ROLES.find(r => r.id === selectedRole)?.color}40` : 'none',
            letterSpacing: '0.5px',
          }}
        >
          Enter Dashboard →
        </button>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.75rem', marginTop: '1.25rem' }}>
          Nirikshan AI | 17th Lok Sabha + Rajya Sabha | 776 MPs | SIH 2026 Demo
        </p>
      </div>

      <style>{`
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,153,51,0.15); }
          50%       { box-shadow: 0 0 50px rgba(255,153,51,0.35), 0 0 80px rgba(34,197,94,0.12); }
        }
      `}</style>
    </div>
  );
}

