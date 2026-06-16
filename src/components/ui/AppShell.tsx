import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  LayoutGrid,
  Users,
  Shield,
  Banknote,
  MessageCircle,
  Bell,
  LogOut,
  User,
  Sun,
  Moon,
  Search,
  Download,
  Wallet,
  X,
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/auth';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface AppShellProps {
  notifications?: any[];
  showNotifs?: boolean;
  onToggleNotifs?: () => void;
  onMarkAllRead?: () => void;
  children: React.ReactNode;
}

export function AppShell({
  children,
  notifications = [],
  showNotifs,
  onToggleNotifs,
  onMarkAllRead,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const { session, logout } = useAuth();
  const { isInstallable, installApp } = usePwaInstall();
  const profile = session?.profile;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { label: 'Leads', icon: CheckCircle2, path: '/', id: 'leads' },
    { label: 'Sourcing', icon: Search, path: '/sourcing', id: 'sourcing' },
    { label: 'Tasks', icon: LayoutGrid, path: '/tasks', id: 'tasks' },
    { label: 'Budget', icon: Banknote, path: '/budgets', id: 'budget' },
    { label: 'Chat', icon: MessageCircle, path: '/messages', id: 'messages' },
  ];

  // Add management tabs if role permits
  if (profile?.role === 'DISTRICT_MANAGER' || profile?.role === 'GENERAL_MANAGER') {
    navItems.splice(2, 0, { label: 'Team', icon: Users, path: '/team', id: 'team' });
    navItems.splice(3, 0, { label: 'Vault', icon: Shield, path: '/showroom', id: 'showroom' });
  }

  const handleLogout = async () => {
    await logout();
    // navigate('/login'); // No longer needed, session change triggers ProtectedRoute <Navigate>
  };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
    contentRef.current?.focus();
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-bg-base text-text-main font-sans overflow-hidden fixed inset-0">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0033FF]/20 via-[#0033FF]/5 to-transparent dark:from-[#0033FF]/40 dark:via-[#020A2F] dark:to-[#050511]" />
      </div>

      {/* Top Header (Floating Elements) */}
      <header className="fixed top-0 left-0 right-0 z-[60] px-4 sm:px-6 py-4 h-[76px] pointer-events-none">
        <div className="w-full mx-auto flex items-center justify-between h-full pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center transition-all',
                  profile?.is_inspector_verified
                    ? 'bg-primary-main text-white shadow-md shadow-primary-main/20'
                    : 'bg-bg-base border border-border-subtle text-text-secondary',
                )}
              >
                {profile?.is_inspector_verified ? <Shield size={18} /> : <User size={18} />}
              </div>
              {profile?.is_inspector_verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-surface-card rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-primary-main rounded-full animate-pulse shadow-sm shadow-primary-main/50" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-text-main leading-none">
                {profile?.full_name?.split(' ')[0] || 'Staff'}
              </h2>
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-none mt-1">
                {profile?.role?.replace(/_/g, ' ') || 'Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={installApp}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-primary-main/10 text-primary-main rounded-xl hover:bg-primary-main/20 transition-all font-bold text-[12px]"
              >
                <Download size={14} />
                Install App
              </button>
            )}
            <button
              onClick={() => navigate('/wallet')}
              className="p-2.5 bg-surface-card border border-border-subtle rounded-xl hover:bg-surface-hover transition-all text-emerald-500 hover:text-emerald-400"
            >
              <Wallet size={16} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-surface-card border border-border-subtle rounded-xl hover:bg-surface-hover transition-all text-text-secondary"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={onToggleNotifs}
                className={cn(
                  'relative p-2.5 bg-surface-card border border-border-subtle rounded-xl transition-all group',
                  showNotifs
                    ? 'bg-primary-main/10 text-primary-main border-primary-main/20'
                    : 'hover:bg-surface-hover text-text-secondary group-hover:text-text-main',
                )}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-surface-card" />
                )}
              </button>

              <AnimatePresence>
              {showNotifs && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm pointer-events-auto">
                  {/* Click outside to close */}
                  <div className="absolute inset-0" onClick={onToggleNotifs} />
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden z-10"
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-black text-text-main uppercase tracking-tight">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-primary-main text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={onMarkAllRead}
                          className="text-[11px] text-primary-main font-bold hover:underline uppercase tracking-wider"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={onToggleNotifs}
                          className="text-text-secondary hover:text-text-main transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-border-subtle/30 no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3 text-text-muted">
                          <Bell size={24} className="opacity-30" />
                          <p className="text-[12px] font-bold uppercase tracking-wider">
                            No new alerts
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              'px-5 py-4 hover:bg-bg-secondary/40 cursor-pointer transition-colors',
                              !n.isRead && 'bg-primary-main/[0.03]',
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  'text-[13px] font-bold leading-tight',
                                  !n.isRead ? 'text-text-main' : 'text-text-muted',
                                )}
                              >
                                {n.title}
                              </p>
                              {!n.isRead && (
                                <div className="w-2 h-2 bg-primary-main rounded-full mt-1 shrink-0" />
                              )}
                            </div>
                            <p className="text-[12px] text-text-muted mt-2 line-clamp-3 leading-relaxed">
                              {n.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-border-subtle text-center bg-bg-secondary/10">
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          onToggleNotifs?.();
                        }}
                        className="text-[11px] font-black text-primary-main uppercase tracking-widest hover:underline"
                      >
                        View All
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-surface-card border border-border-subtle rounded-xl hover:bg-error/10 hover:text-error hover:border-error/20 transition-all text-text-secondary"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        ref={contentRef}
        tabIndex={-1}
        className="flex-1 relative z-10 w-full px-4 sm:px-6 pt-[100px] flex flex-col min-h-0 mx-auto"
      >
        {children}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav
        id="bottom-nav"
        className="fixed inset-x-0 bottom-0 z-100 px-3 pb-2 pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 8px)' }}
      >
        <div className="relative mx-auto flex w-full max-w-md items-center justify-around overflow-hidden rounded-[30px] border border-white/25 bg-white/70 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.75)] backdrop-blur-2xl supports-backdrop-filter:bg-white/70 dark:border-white/10 dark:bg-white/8 dark:shadow-[0_18px_45px_-18px_rgba(0,0,0,0.92)]">
          <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[linear-gradient(135deg,rgba(255,255,255,0.65),rgba(255,255,255,0.12)_35%,rgba(255,255,255,0.05)_65%,transparent_100%)] opacity-90 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06)_35%,rgba(255,255,255,0.02)_65%,transparent_100%)]" />
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  'pointer-events-auto flex flex-1 flex-col items-center justify-center rounded-[20px] px-2 py-2.5 min-h-14 transition-all duration-200 relative group min-w-0',
                  isActive
                    ? 'bg-white/35 text-primary-main shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:bg-white/12 dark:text-primary-main'
                    : 'text-text-secondary hover:bg-white/20 hover:text-text-main dark:hover:bg-white/10 dark:hover:text-text-main',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="staff-nav-bg"
                    className="absolute inset-0 rounded-[20px] -z-10"
                    transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                  />
                )}
                <item.icon
                  size={18}
                  className={cn(
                    'mb-1 transition-transform',
                    isActive
                      ? 'scale-110'
                      : 'group-hover:scale-105 opacity-80 group-hover:opacity-100',
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] leading-none',
                    isActive ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Global Toaster placed securely inside AppShell */}
      <Toaster position="top-center" toastOptions={{ style: { zIndex: 999999, pointerEvents: 'auto' } }} />
    </div>
  );
}
