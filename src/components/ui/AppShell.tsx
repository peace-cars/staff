import { 
  CheckCircle2, LayoutGrid, Users, Shield, Banknote, MessageCircle, Star, Bell, LogOut, User, Sun, Moon, ScanLine, Camera 
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();
  const profile = session?.profile;
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const navItems = [
    { label: 'Leads', icon: CheckCircle2, path: '/', id: 'leads' },
    { label: 'Tasks', icon: LayoutGrid, path: '/tasks', id: 'tasks' },
    { label: 'Budget', icon: Banknote, path: '/budgets', id: 'budget' },
    { label: 'Chat', icon: MessageCircle, path: '/messages', id: 'messages' },
    { label: 'Elite', icon: Star, path: '/performance', id: 'performance' },
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

  return (
    <div className="min-h-screen bg-bg-base text-text-main font-sans overflow-x-hidden">

      {/* Top Header */}
      <header className="sticky top-0 bg-surface-card/80 backdrop-blur-xl border-b border-border-subtle z-[60] px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                profile?.is_inspector_verified ? "bg-primary-main text-white shadow-md shadow-primary-main/20" : "bg-bg-base border border-border-subtle text-text-secondary"
              )}>
                {profile?.is_inspector_verified ? <Shield size={20} /> : <User size={20} />}
              </div>
              {profile?.is_inspector_verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface-card rounded-full flex items-center justify-center">
                   <div className="w-3.5 h-3.5 bg-primary-main rounded-full animate-pulse shadow-sm shadow-primary-main/50" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-text-main leading-tight">
                {profile?.full_name?.split(' ')[0] || 'Staff'}
              </h2>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none mt-1">
                {profile?.role?.replace(/_/g, ' ') || 'Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={toggleTheme} className="p-3 bg-surface-card border border-border-subtle rounded-xl hover:bg-surface-hover transition-all text-text-secondary">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
             </button>
             <button onClick={() => navigate('/notifications')} className="relative p-3 bg-surface-card border border-border-subtle rounded-xl hover:bg-surface-hover transition-all group">
                <Bell size={18} className="text-text-secondary group-hover:text-text-main" />
                <div className="absolute top-3 right-3 w-2 h-2 bg-primary-main rounded-full border-2 border-surface-card" />
             </button>
             <button onClick={handleLogout} className="p-3 bg-surface-card border border-border-subtle rounded-xl hover:bg-error/10 hover:text-error hover:border-error/20 transition-all text-text-secondary">
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 p-6 max-w-lg mx-auto w-full pb-32">
         {children}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-surface-card rounded-[2.5rem] p-2 flex justify-between shadow-xl shadow-black/20 z-[100] border border-border-subtle">
         {navItems.map((item, index) => {
           const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
           
           // Insert the FAB in the middle
           if (index === Math.floor(navItems.length / 2)) {
             return (
               <div key="fab-container" className="flex items-center">
                 <button 
                   onClick={() => setIsScannerOpen(true)}
                   className="w-14 h-14 bg-primary-main text-white rounded-full flex items-center justify-center -translate-y-4 shadow-lg shadow-primary-main/30 border-4 border-bg-base active:scale-95 transition-transform"
                 >
                   <ScanLine size={24} />
                 </button>
               </div>
             );
           }

           return (
             <button 
               key={item.id}
               onClick={() => navigate(item.path)}
               className={cn(
                 "flex-1 flex flex-col items-center justify-center py-3.5 rounded-[2.2rem] transition-all relative group",
                 isActive ? "text-primary-main" : "text-text-muted hover:text-text-main"
               )}
             >
               {isActive && (
                 <motion.div 
                   layoutId="staff-nav-bg"
                   className="absolute inset-0 bg-primary-subtle rounded-[2.2rem] -z-10"
                   transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                 />
               )}
               <item.icon size={20} className={cn("transition-transform", isActive ? "scale-110" : "group-hover:scale-105 opacity-80 group-hover:opacity-100")} />
               {!isActive && <span className="text-[8px] font-bold uppercase tracking-[0.2em] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{item.label}</span>}
             </button>
           );
         })}
      </nav>

      {/* Mobile-First Scanner Sheet */}
      <BottomSheet 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)}
        title="Asset Scanner"
        height="half"
      >
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="w-full max-w-xs aspect-square border-2 border-dashed border-border-subtle rounded-3xl flex flex-col items-center justify-center bg-surface-hover text-text-muted relative overflow-hidden">
            <Camera size={48} className="mb-4 opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest text-center px-8">Point camera at vehicle QR or VIN barcode</p>
            
            {/* Animated scanning line */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-primary-main shadow-[0_0_8px_2px_rgba(var(--color-primary-main),0.5)] z-10"
            />
          </div>
          <button 
            onClick={() => setIsScannerOpen(false)}
            className="w-full max-w-xs py-4 rounded-xl bg-surface-hover text-text-secondary font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform"
          >
            Cancel Scan
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
