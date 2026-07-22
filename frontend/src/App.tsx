import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './core/contexts/AccessibilityContext';
import { AuthProvider } from './core/contexts/AuthContext';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import CareCommunityHub from './features/care/CareCommunityHub';
import AutomationPanel from './features/automation/AutomationPanel';
import ApplicationsPage from './features/applications/ApplicationsPage';
import SettingsPage from './features/settings/SettingsPage';
import SchemesPage from './features/schemes/SchemesPage';

const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/care-community" element={<CareCommunityHub />} />
            <Route path="/automation" element={<AutomationPanel />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/schemes" element={<SchemesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </AccessibilityProvider>
  );
};

export default App;
