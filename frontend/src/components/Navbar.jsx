import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const ROLES = [
  { id: 'citizen',  label: 'Citizen Portal',     icon: '🏘️', color: '#138808' },
  { id: 'mp',       label: 'MP Dashboard',        icon: '🏛️', color: '#ff9933' },
  { id: 'ministry', label: 'Ministry',            icon: '🏢', color: '#f59e0b' },
  { id: 'state',    label: 'State Nodal',         icon: '🗺️', color: '#e07820' },
  { id: 'district', label: 'District Authority',  icon: '📍', color: '#1e3a5f' },
  { id: 'agency',   label: 'Agency',              icon: '🏗️', color: '#dc2626' },
];

const AGENCY_LIST = [
  { id: 'ag-001', name: 'Shree Ram Constructions' },
  { id: 'ag-002', name: 'Kerala Infrastructure Dev Corp' },
  { id: 'ag-003', name: 'Vishal Projects Limited' },
];

export default function Navbar({ role, setRole, activeId, setActiveId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentRole = ROLES.find(r => r.id === role) || ROLES[0];

  // Get saved MP name from localStorage
  const mpName = localStorage.getItem('mplad_mp_name') || '';
  const mpState = localStorage.getItem('mplad_mp_state') || '';

  const navLinks = [
    { to: '/app/', label: 'Citizen Portal', icon: '🏘️', roles: ['citizen'] },
    { to: '/app/mp', label: 'MP Dashboard', icon: '📊', roles: ['mp'] },
    { to: '/app/mp-directory', label: 'MP Directory', icon: '👥', roles: ['mp', 'ministry', 'citizen', 'state'] },
    { to: '/app/ministry', label: 'Ministry', icon: '🏢', roles: ['ministry'] },
    { to: '/app/state', label: 'State Overview', icon: '🗺️', roles: ['state'] },
    { to: '/app/district', label: 'District Monitor', icon: '📍', roles: ['district'] },
    { to: '/app/agency', label: 'Agency', icon: '🏗️', roles: ['agency'] },
    { to: '/app/trends', label: 'Trends', icon: '📈', roles: ['ministry', 'state'] },
    { to: '/app/alerts', label: 'Alerts', icon: '🚨', roles: ['ministry', 'state', 'district'] },
    { to: '/app/trust-registry', label: 'Trust Registry', icon: '⭐', roles: ['citizen', 'ministry', 'state'] },
    { to: '/app/audit', label: 'Audit Trail', icon: '🔐', roles: ['citizen', 'ministry', 'mp'] },
    { to: '/app/nexus', label: 'Nexus Graph', icon: '🕸️', roles: ['ministry'] },
    { to: '/app/mp-scores', label: 'MP Scores', icon: '🏆', roles: ['citizen', 'state'] },
    { to: '/app/double-funding', label: 'Double Funding', icon: '⚠️', roles: ['ministry'] },
  ];

  const visibleLinks = navLinks.filter(l => l.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem('mplad_role');
    localStorage.removeItem('mplad_mp_id');
    localStorage.removeItem('mplad_mp_name');
    localStorage.removeItem('mplad_mp_state');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-[100] backdrop-blur-xl bg-[#fffdf9]/95 border-b border-[var(--border-subtle)]">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 md:px-6 h-[60px]">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>👁️</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1rem', fontFamily: "'Inter', sans-serif" }}>
            Nirikshan<span style={{ color: '#ff9933' }}> AI</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex gap-1 items-center flex-1 justify-center px-4">
          {visibleLinks.map(link => {
            const isActive = location.pathname === link.to || (link.to !== '/app/' && location.pathname.startsWith(link.to));
            return (
              <Link key={link.to} to={link.to} style={{
                textDecoration: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif",
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? `${currentRole.color}33` : 'transparent',
                borderBottom: isActive ? `2px solid ${currentRole.color}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                {link.icon} {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Role + User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Current MP info */}
          {role === 'mp' && mpName && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mpName}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{mpState}</div>
            </div>
          )}

          {/* Role Badge */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setRoleOpen(o => !o)}
              style={{
                padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                background: `${currentRole.color}22`, border: `1px solid ${currentRole.color}55`,
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              {currentRole.icon} {currentRole.label} ▾
            </button>
            {roleOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                padding: '0.5rem', minWidth: '180px', zIndex: 200,
              }}>
                {ROLES.map(r => (
                  <div
                    key={r.id}
                    onClick={() => { 
                      setRole(r.id); 
                      setRoleOpen(false); 
                      const roleRoutes = {
                        'citizen': '/app/',
                        'mp': '/app/mp',
                        'ministry': '/app/ministry',
                        'state': '/app/state',
                        'district': '/app/district',
                        'agency': '/app/agency',
                      };
                      navigate(roleRoutes[r.id] || '/app/');
                    }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem',
                      color: role === r.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: role === r.id ? `${r.color}33` : 'transparent',
                    }}
                  >
                    {r.icon} {r.label}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                  <Link
                    to="/app/mp-directory"
                    onClick={() => setRoleOpen(false)}
                    style={{
                      display: 'block', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px',
                      fontSize: '0.85rem', color: '#a5b4fc', textDecoration: 'none',
                    }}
                  >
                    👥 MP Directory
                  </Link>
                  <div
                    onClick={handleLogout}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', borderRadius: '8px',
                      fontSize: '0.85rem', color: '#f87171',
                    }}
                  >
                    🚪 Sign Out
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden ml-2 p-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Nav Links Dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--border-subtle)] bg-white max-h-[60vh] overflow-y-auto shadow-xl">
          <div className="flex flex-col p-2">
            {visibleLinks.map(link => {
              const isActive = location.pathname === link.to || (link.to !== '/app/' && location.pathname.startsWith(link.to));
              return (
                <Link key={link.to} to={link.to} 
                  onClick={() => setMenuOpen(false)}
                  style={{
                    textDecoration: 'none', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : 500, fontFamily: "'Inter', sans-serif",
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? `${currentRole.color}15` : 'transparent',
                    borderLeft: isActive ? `4px solid ${currentRole.color}` : '4px solid transparent',
                  }}
                >
                  {link.icon} <span className="ml-2">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

