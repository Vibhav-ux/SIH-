// Force HMR
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('mplad_role') || 'citizen');
  const [activeId, setActiveId] = useState(() => localStorage.getItem('mplad_mp_id') || 'mp-001');

  // Keep localStorage in sync with state
  useEffect(() => {
    localStorage.setItem('mplad_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('mplad_mp_id', activeId);
  }, [activeId]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem('mplad_role', newRole);
  };

  const handleIdChange = (newId) => {
    setActiveId(newId);
    localStorage.setItem('mplad_mp_id', newId);
  };

  return (
    <BrowserRouter>
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
              <Route path="/" element={<CitizenPortal />} />
              <Route path="/mp" element={<MPDashboard mpId={activeId} />} />
              <Route path="/ministry" element={<MinistryDashboard />} />
              <Route path="/agency" element={<AgencyDashboard agencyId={activeId} />} />
              <Route path="/trust-registry" element={<AgencyTrustRegistry />} />
              <Route path="/audit" element={<AuditTrail />} />
              <Route path="/nexus" element={<NexusDetector />} />
              <Route path="/mp-scores" element={<MPScorecard />} />
              <Route path="/double-funding" element={<DoubleFunding />} />
              <Route path="/state" element={<StateNodalDashboard />} />
              <Route path="/district" element={<DistrictDashboard />} />
              <Route path="/trends" element={<TrendAnalysis />} />
              <Route path="/alerts" element={<AlertCenter />} />
              <Route path="/mp-directory" element={<MPDirectory />} />
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
