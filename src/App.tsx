import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/ThemeContext';
import { AppShell } from './components/ui/AppShell';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import InspectionForm from './pages/InspectionForm';
import Notifications from './pages/Notifications';
import ActiveConversations from './pages/ActiveConversations';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-midnight flex flex-col items-center justify-center text-white font-sans uppercase tracking-[0.4em] text-[11px]">
      <div className="w-16 h-16 border-[3px] border-primary-aurora/10 border-t-primary-aurora rounded-full animate-spin mb-8" />
      Syncing Authority...
    </div>;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard activeTab="leads" />
              </ProtectedRoute>
            } />

            <Route path="/tasks" element={
              <ProtectedRoute>
                <Dashboard activeTab="tasks" />
              </ProtectedRoute>
            } />

            <Route path="/budgets" element={
              <ProtectedRoute>
                <Dashboard activeTab="budget" />
              </ProtectedRoute>
            } />

            <Route path="/team" element={
              <ProtectedRoute>
                <Dashboard activeTab="team" />
              </ProtectedRoute>
            } />

            <Route path="/showroom" element={
              <ProtectedRoute>
                <Dashboard activeTab="inventory" />
              </ProtectedRoute>
            } />

            <Route path="/performance" element={
              <ProtectedRoute>
                <Dashboard activeTab="performance" />
              </ProtectedRoute>
            } />
            
            <Route path="/eval/:leadId" element={
              <ProtectedRoute>
                <InspectionForm />
              </ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute>
                <ActiveConversations />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
