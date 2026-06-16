import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/ThemeContext';
import { AppShell } from './components/ui/AppShell';
import { AnimatePresence } from 'framer-motion';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { supabase } from './lib/supabase';
import { Toaster, toast } from 'react-hot-toast';
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InspectionForm = lazy(() => import('./pages/InspectionForm'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ActiveConversations = lazy(() => import('./pages/ActiveConversations'));
const Wallet = lazy(() => import('./pages/Wallet'));
import Splash from './components/ui/Splash';
import { ApplePageTransition } from './components/ui/ApplePageTransition';
import { initializePushNotifications } from './lib/push';
import { CapacitorBackButtonHandler } from './components/ui/CapacitorBackButtonHandler';
import { PwaInstallPrompt } from './components/ui/PwaInstallPrompt';
import { Capacitor } from '@capacitor/core';
import { apiFetch } from './lib/api';

function ProtectedRoute({ children, fullScreen = false }: { children: React.ReactNode, fullScreen?: boolean }) {
  const { session, loading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.user?.id && Capacitor.isNativePlatform()) {
      initializePushNotifications(session.user.id);
    }
  }, [session]);

  // Keep Realtime JWT in sync whenever Supabase auto-refreshes the access token.
  // Without this, Realtime disconnects ~1 hour after login when the token expires.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && newSession?.access_token) {
        supabase.realtime.setAuth(newSession.access_token);
        console.log('[Realtime] JWT refreshed on Supabase Realtime client, event:', event);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Global Realtime Listeners for Toasts
  useEffect(() => {
    if (!session?.user?.id || !session?.access_token) return;

    // CRITICAL: Authenticate the Realtime WebSocket with the user's JWT.
    // Without this, Supabase connects with the anon key only and RLS
    // filters like recipient_id=eq.<uuid> will be rejected.
    supabase.realtime.setAuth(session.access_token);
    console.log('[Realtime] JWT set on Supabase Realtime client');

    // Listen to Notifications
    const notifsChannel = supabase.channel('global_notifs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `recipient_id=eq.${session.user.id}`
      }, (payload) => {
        console.log('RECEIVED REALTIME NOTIF:', payload);
        const notif = payload.new;
        toast.custom((t) => (
          <div style={{ zIndex: 999999 }} className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-surface-card border border-border-subtle shadow-2xl rounded-2xl pointer-events-auto flex overflow-hidden`}>
            <div 
              className="flex-1 w-0 p-4 cursor-pointer hover:bg-bg-secondary/40 transition-colors"
              onClick={() => { navigate('/notifications'); toast.dismiss(t.id); }}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary-main flex items-center justify-center text-base shrink-0">🔔</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-main truncate">{notif.title || 'New Notification'}</p>
                  <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{notif.body || notif.message}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 px-4 border-l border-border-subtle text-xs font-black text-text-secondary hover:text-error hover:bg-error/5 transition-colors uppercase tracking-wider"
            >
              ✕
            </button>
          </div>
        ), { duration: Infinity, position: 'top-center' });
        setNotifications(prev => [notif, ...prev]);
      })
      .subscribe((status) => console.log('Global Notifs Channel Status:', status));

    // Listen to Messages globally
    const msgsChannel = supabase.channel('global_msgs_staff')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
      }, (payload) => {
        console.log('RECEIVED REALTIME MSG:', payload);
        const msg = payload.new;
        if (msg.sender_id !== session.user.id) {
          toast.custom((t) => (
            <div style={{ zIndex: 999999 }} className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-surface-card border border-border-subtle shadow-2xl rounded-2xl pointer-events-auto flex overflow-hidden`}>
              <div 
                className="flex-1 w-0 p-4 cursor-pointer hover:bg-bg-secondary/40 transition-colors"
                onClick={() => { navigate('/messages'); toast.dismiss(t.id); }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-main text-white flex items-center justify-center text-base shrink-0">💬</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-main">New Message</p>
                    <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{msg.text}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 px-4 border-l border-border-subtle text-xs font-black text-text-secondary hover:text-error hover:bg-error/5 transition-colors uppercase tracking-wider"
              >
                ✕
              </button>
            </div>
          ), { duration: Infinity, position: 'top-center' });
        }
      })
      .subscribe((status) => console.log('Global Msgs Channel Status:', status));

    return () => {
      supabase.removeChannel(notifsChannel);
      supabase.removeChannel(msgsChannel);
    };
  }, [session]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user?.id) return;
      try {
        const data = await apiFetch<any[]>('/notifications');
        if (Array.isArray(data)) setNotifications(data);
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
      await apiFetch('/notifications/mark-all-read', {
        method: 'POST',
        body: JSON.stringify({ recipientId: session.user.id })
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
  
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-bg-base relative overflow-x-hidden flex flex-col">
        {/* Dynamic Dark Mode Background for Full Screen */}
        <div className="fixed inset-0 pointer-events-none hidden dark:block z-0">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#0033FF,transparent_70%)] opacity-[0.03]" />
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,#0033FF,transparent_70%)] opacity-[0.03]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    );
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
                    <ProtectedRoute fullScreen={true}>
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

                  <Route path="/wallet" element={
                    <ProtectedRoute>
                      <ApplePageTransition backPath="/">
                        <Wallet />
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
