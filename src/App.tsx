import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/ThemeContext';
import { AppShell } from './components/ui/AppShell';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import InspectionForm from './pages/InspectionForm';
import Notifications from './pages/Notifications';
import ActiveConversations from './pages/ActiveConversations';
import Splash from './components/ui/Splash';
import { ApplePageTransition } from './components/ui/ApplePageTransition';
import { initializePushNotifications } from './lib/push';
import { useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      initializePushNotifications(session.user.id, session.access_token || '');
    }
  }, [session]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-sans uppercase tracking-[0.4em] text-[11px]">
        <div className="w-12 h-12 border-2 border-primary-main/10 border-t-primary-main rounded-full animate-spin mb-6" />
        Syncing Authority...
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="relative min-h-screen bg-bg-base">
          <AnimatePresence mode="wait">
            {showSplash && <Splash onComplete={handleSplashComplete} />}
          </AnimatePresence>

          {!showSplash && (
            <Router>
              <Routes>
                <Route path="/login" element={
                  <ApplePageTransition backPath="/signup">
                    <Login />
                  </ApplePageTransition>
                } />
                <Route path="/signup" element={
                  <ApplePageTransition backPath="/login">
                    <Signup />
                  </ApplePageTransition>
                } />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <ApplePageTransition>
                      <Dashboard activeTab="leads" />
                    </ApplePageTransition>
                  </ProtectedRoute>
                } />

                <Route path="/tasks" element={
                  <ProtectedRoute>
                    <ApplePageTransition backPath="/">
                      <Dashboard activeTab="tasks" />
                    </ApplePageTransition>
                  </ProtectedRoute>
                } />

                <Route path="/budgets" element={
                  <ProtectedRoute>
                    <ApplePageTransition backPath="/">
                      <Dashboard activeTab="budget" />
                    </ApplePageTransition>
                  </ProtectedRoute>
                } />

                <Route path="/team" element={
                  <ProtectedRoute>
                    <ApplePageTransition backPath="/">
                      <Dashboard activeTab="team" />
                    </ApplePageTransition>
                  </ProtectedRoute>
                } />

                <Route path="/showroom" element={
                  <ProtectedRoute>
                    <ApplePageTransition backPath="/">
                      <Dashboard activeTab="inventory" />
                    </ApplePageTransition>
                  </ProtectedRoute>
                } />
                
                <Route path="/eval/:leadId" element={
                  <ProtectedRoute>
                    <ApplePageTransition backPath="/">
                      <InspectionForm />
                    </ApplePageTransition>
                  </ProtectedRoute>
                } />

                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <ApplePageTransition backPath="/">
                      <Notifications />
                    </ApplePageTransition>
                  </ProtectedRoute>
                } />

                <Route path="/messages" element={
                  <ProtectedRoute>
                    <ApplePageTransition backPath="/">
                      <ActiveConversations />
                    </ApplePageTransition>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          )}
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
