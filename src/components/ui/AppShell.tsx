import React, { useEffect, useRef } from 'react';
import { 
  CheckCircle2, LayoutGrid, Users, Shield, Banknote, MessageCircle, Bell, LogOut, User, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const { session, logout } = useAuth();
  const profile = session?.profile;

  const navItems = [
    { label: 'Leads', icon: CheckCircle2, path: '/', id: 'leads' },
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
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                profile?.is_inspector_verified ? "bg-primary-main text-white shadow-md shadow-primary-main/20" : "bg-bg-base border border-border-subtle text-text-secondary"
              )}>
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
             <button onClick={toggleTheme} className="p-2.5 bg-surface-card border border-border-subtle rounded-xl hover:bg-surface-hover transition-all text-text-secondary">
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
             </button>
             <button onClick={() => navigate('/notifications')} className="relative p-2.5 bg-surface-card border border-border-subtle rounded-xl hover:bg-surface-hover transition-all group">
                <Bell size={16} className="text-text-secondary group-hover:text-text-main" />
                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary-main rounded-full border border-surface-card" />
             </button>
             <button onClick={handleLogout} className="p-2.5 bg-surface-card border border-border-subtle rounded-xl hover:bg-error/10 hover:text-error hover:border-error/20 transition-all text-text-secondary">
                <LogOut size={16} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main ref={contentRef} tabIndex={-1} className="relative z-10 p-6 max-w-lg mx-auto w-full pt-[100px] pb-32">
         {children}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-surface-card rounded-[2.2rem] p-1.5 flex justify-between items-center shadow-xl shadow-black/35 z-[100] border border-border-subtle">
         {navItems.map((item) => {
           const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
           
           return (
             <button 
               key={item.id}
               onClick={() => navigate(item.path)}
               className={cn(
                 "flex-1 flex flex-col items-center justify-center py-2.5 rounded-[2rem] transition-all relative group min-w-0",
                 isActive ? "text-primary-main" : "text-text-muted hover:text-text-main"
               )}
             >
               {isActive && (
                 <motion.div 
                   layoutId="staff-nav-bg"
                   className="absolute inset-0 bg-primary-subtle rounded-[2rem] -z-10"
                   transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                 />
               )}
               <item.icon size={18} className={cn("transition-transform", isActive ? "scale-110" : "group-hover:scale-105 opacity-80 group-hover:opacity-100")} />
               {isActive && <span className="text-[7px] font-bold uppercase tracking-[0.1em] mt-0.5">{item.label}</span>}
             </button>
           );
         })}
      </nav>

    </div>
  );
}
