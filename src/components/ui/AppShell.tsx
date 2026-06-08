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
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth';
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
    contentRef.current?.focus();
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg-base text-text-main font-sans overflow-x-hidden">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 bg-surface-card/80 backdrop-blur-xl border-b border-border-subtle z-[60] px-6 py-4 h-[76px]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
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

              {showNotifs && (
                <div className="absolute right-0 mt-3 w-80 bg-surface-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden z-[200]">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-black text-text-main uppercase tracking-tight">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-primary-main text-white text-[9px] px-1.5 py-0.5 rounded-md">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={onMarkAllRead}
                      className="text-[10px] text-primary-main font-bold hover:underline uppercase tracking-wider"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto divide-y divide-border-subtle/30 no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center gap-2 text-text-muted">
                        <Bell size={20} className="opacity-30" />
                        <p className="text-[11px] font-bold uppercase tracking-wider">
                          No new alerts
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'px-5 py-3 hover:bg-bg-secondary/40 cursor-pointer transition-colors',
                            !n.isRead && 'bg-primary-main/[0.03]',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-[12px] font-bold leading-tight',
                                !n.isRead ? 'text-text-main' : 'text-text-muted',
                              )}
                            >
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <div className="w-1.5 h-1.5 bg-primary-main rounded-full mt-1 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                            {n.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-border-subtle text-center bg-bg-secondary/10">
                    <button
                      onClick={() => {
                        navigate('/notifications');
                        onToggleNotifs?.();
                      }}
                      className="text-[10px] font-black text-primary-main uppercase tracking-widest hover:underline"
                    >
                      View All
                    </button>
                  </div>
                </div>
              )}
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
        className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-8 pt-[100px] pb-32"
      >
        {children}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav
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
    </div>
  );
}
