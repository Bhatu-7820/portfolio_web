import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeadGeneration from './pages/LeadGeneration';
import Leads from './pages/Leads';
import Upload from './pages/Upload';
import Classification from './pages/Classification';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import SendEmail from './pages/SendEmail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Unsubscribe from './pages/Unsubscribe';

// Protected Layout Guard with Glassmorphic Video Background
const ProtectedLayout = ({ children }) => {
  const { user, token, loading } = useAuth();
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a11] flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="font-semibold text-slate-300">Initializing EmailPro Glass Engine...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-[#070a11]">
      {/* Background Video Layer for Theme */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-20 filter blur-[1px] scale-105"
        >
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a11]/85 via-[#070a11]/70 to-[#070a11]/90" />
      </div>

      {/* Main Glass Workspace */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <Navbar onSearchChange={setGlobalSearch} searchTerm={globalSearch} />
        <main className="p-6 flex-1 overflow-y-auto">
          {React.cloneElement(children, { globalSearch })}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication & Unsubscribe Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unsubscribe/:token" element={<Unsubscribe />} />

          {/* Protected SaaS Dashboard Modules */}
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/lead-generation"
            element={
              <ProtectedLayout>
                <LeadGeneration />
              </ProtectedLayout>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedLayout>
                <Leads />
              </ProtectedLayout>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedLayout>
                <Upload />
              </ProtectedLayout>
            }
          />
          <Route
            path="/classification"
            element={
              <ProtectedLayout>
                <Classification />
              </ProtectedLayout>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedLayout>
                <Campaigns />
              </ProtectedLayout>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedLayout>
                <Templates />
              </ProtectedLayout>
            }
          />
          <Route
            path="/send-email"
            element={
              <ProtectedLayout>
                <SendEmail />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedLayout>
                <Reports />
              </ProtectedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedLayout>
                <Settings />
              </ProtectedLayout>
            }
          />

          {/* Fallback Root Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
