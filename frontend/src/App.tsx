import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './core/contexts/AccessibilityContext';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import CareCommunityHub from './features/care/CareCommunityHub';
import AutomationPanel from './features/automation/AutomationPanel';

const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/care-community" element={<CareCommunityHub />} />
          <Route path="/automation" element={<AutomationPanel />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AccessibilityProvider>
  );
};

export default App;
