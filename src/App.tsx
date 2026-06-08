import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/ThemeContext';
import { AppShell } from './components/ui/AppShell';
import { AnimatePresence } from 'framer-motion';
import { ScrollToTop } from './components/ui/ScrollToTop';
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InspectionForm = lazy(() => import('./pages/InspectionForm'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ActiveConversations = lazy(() => import('./pages/ActiveConversations'));
import Splash from './components/ui/Splash';
import { ApplePageTransition } from './components/ui/ApplePageTransition';
import { initializePushNotifications } from './lib/push';
import { CapacitorBackButtonHandler } from './components/ui/CapacitorBackButtonHandler';
import { PwaInstallPrompt } from './components/ui/PwaInstallPrompt';
import { Capacitor } from '@capacitor/core';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (session?.user?.id && Capacitor.isNativePlatform()) {
      initializePushNotifications(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setNotifications(data);
        }
      } catch (e) {
        console.error("Notifications Sync Failed", e);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [session]);

  const handleMarkAllRead = async () => {
    if (!session) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };
  
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
  
  return (
    <AppShell 
      notifications={notifications} 
      showNotifs={showNotifs}
      onToggleNotifs={() => setShowNotifs(!showNotifs)}
      onMarkAllRead={handleMarkAllRead}
    >
      {children}
    </AppShell>
  );
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
              <ScrollToTop />
              <CapacitorBackButtonHandler />
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg-base text-text-muted">Loading page…</div>}>
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

                  <Route path="/sourcing" element={
                    <ProtectedRoute>
                      <ApplePageTransition backPath="/">
                        <Dashboard activeTab="sourcing" />
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
              </Suspense>
              <PwaInstallPrompt />
            </Router>
          )}
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
