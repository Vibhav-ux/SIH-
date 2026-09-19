// Force HMR
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CitizenPortal from './pages/CitizenPortal';
import MPDashboard from './pages/MPDashboard';
import MinistryDashboard from './pages/MinistryDashboard';
import AgencyDashboard from './pages/AgencyDashboard';
import AgencyTrustRegistry from './pages/AgencyTrustRegistry';
import AuditTrail from './pages/AuditTrail';
import NexusDetector from './pages/NexusDetector';
import MPScorecard from './pages/MPScorecard';
import DoubleFunding from './pages/DoubleFunding';
import StateNodalDashboard from './pages/StateNodalDashboard';
import DistrictDashboard from './pages/DistrictDashboard';
import TrendAnalysis from './pages/TrendAnalysis';
import AlertCenter from './pages/AlertCenter';
import MPDirectory from './pages/MPDirectory';
import NirikshanBot from './components/NirikshanBot';

const RoleRoute = ({ role, allowedRoles, children }) => {
  if (!allowedRoles.includes(role)) {
    const roleRoutes = {
      'citizen': '/app/',
      'mp': '/app/mp',
      'ministry': '/app/ministry',
      'state': '/app/state',
      'district': '/app/district',
      'agency': '/app/agency',
    };
    return <Navigate to={roleRoutes[role] || '/app/'} replace />;
  }
  return children;
};

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('mplad_role') || 'citizen');
  const [activeId, setActiveId] = useState(() => localStorage.getItem('mplad_mp_id') || 'mp-001');

  // Re-read localStorage whenever it changes (handles post-login navigation without refresh)
  const syncFromStorage = useCallback(() => {
    const newRole = localStorage.getItem('mplad_role') || 'citizen';
    const newId   = localStorage.getItem('mplad_mp_id') || 'mp-001';
    setRole(r  => r  !== newRole ? newRole : r);
    setActiveId(id => id !== newId   ? newId   : id);
  }, []);

  // Sync on cross-tab storage events
  useEffect(() => {
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, [syncFromStorage]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem('mplad_role', newRole);
  };

  const handleIdChange = (newId) => {
    setActiveId(newId);
    localStorage.setItem('mplad_mp_id', newId);
  };

  // Inner component — must be inside BrowserRouter to use useLocation
  function LocationSync() {
    const location = useLocation();
    useEffect(() => { syncFromStorage(); }, [location.pathname]);
    return null;
  }

  return (
    <BrowserRouter>
      <LocationSync />
      <Routes>
        {/* Landing page at root */}
        <Route path="/" element={<LandingPage />} />

        {/* Role / Login selection */}
        <Route path="/login" element={<LoginPage />} />

        {/* App pages with navbar */}
        <Route path="/app/*" element={
          <>
            <Navbar role={role} setRole={handleRoleChange} activeId={activeId} setActiveId={handleIdChange} />
            <Routes>
              <Route path="/" element={<RoleRoute role={role} allowedRoles={['citizen']}><CitizenPortal /></RoleRoute>} />
              <Route path="/mp" element={<RoleRoute role={role} allowedRoles={['mp', 'ministry', 'citizen', 'state']}><MPDashboard mpId={activeId} /></RoleRoute>} />
              <Route path="/ministry" element={<RoleRoute role={role} allowedRoles={['ministry']}><MinistryDashboard /></RoleRoute>} />
              <Route path="/agency" element={<RoleRoute role={role} allowedRoles={['agency']}><AgencyDashboard agencyId={activeId} /></RoleRoute>} />
              <Route path="/trust-registry" element={<RoleRoute role={role} allowedRoles={['citizen', 'ministry', 'state']}><AgencyTrustRegistry /></RoleRoute>} />
              <Route path="/audit" element={<RoleRoute role={role} allowedRoles={['citizen', 'ministry', 'mp']}><AuditTrail /></RoleRoute>} />
              <Route path="/nexus" element={<RoleRoute role={role} allowedRoles={['ministry']}><NexusDetector /></RoleRoute>} />
              <Route path="/mp-scores" element={<RoleRoute role={role} allowedRoles={['citizen', 'state']}><MPScorecard /></RoleRoute>} />
              <Route path="/double-funding" element={<RoleRoute role={role} allowedRoles={['ministry']}><DoubleFunding /></RoleRoute>} />
              <Route path="/state" element={<RoleRoute role={role} allowedRoles={['state']}><StateNodalDashboard /></RoleRoute>} />
              <Route path="/district" element={<RoleRoute role={role} allowedRoles={['district']}><DistrictDashboard /></RoleRoute>} />
              <Route path="/trends" element={<RoleRoute role={role} allowedRoles={['ministry', 'state']}><TrendAnalysis /></RoleRoute>} />
              <Route path="/alerts" element={<RoleRoute role={role} allowedRoles={['ministry', 'state', 'district']}><AlertCenter /></RoleRoute>} />
              <Route path="/mp-directory" element={<RoleRoute role={role} allowedRoles={['mp', 'ministry', 'citizen', 'state']}><MPDirectory /></RoleRoute>} />
              <Route path="*" element={<Navigate to="/app/" />} />
            </Routes>
          </>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <NirikshanBot />
    </BrowserRouter>
  );
}
