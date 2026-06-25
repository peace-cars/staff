import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Award, Star, CheckCircle2, MessageCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import TasksManager from '../components/TasksManager';
import BudgetRequests from '../components/BudgetRequests';
import TeamManager from '../components/TeamManager';
import InventoryModule from '../components/InventoryModule';
import SourcingModule from '../components/SourcingModule';
import { ModernLeadCard } from '../components/ui/ModernLeadCard';
import NegotiationWidget from '../components/NegotiationWidget';
import { cn } from '../lib/utils';
import { fetchWithCache, apiCache } from '../lib/cache';
import { API_URL } from '../lib/api';
import { InspectionReportView } from '../components/ui/InspectionReportView';
import { SkeletonCard } from '../components/ui/Skeleton';

interface DashboardProps {
  activeTab?: 'leads' | 'sourcing' | 'tasks' | 'budget' | 'performance' | 'team' | 'inventory';
}

export default function Dashboard({ activeTab = 'leads' }: DashboardProps) {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  
  // Attempt synchronous cache read to prevent UI flicker
  const initialSyncState = (() => {
    if (!session) return true;
    const perfCached = apiCache.get(`/staff-performance/me_GET_""`);
    const leadsCached = apiCache.get(`/trade-in-requests/me_GET_""`);
    return !(perfCached && leadsCached);
  })();

  const [isSyncing, setIsSyncing] = useState(initialSyncState);
  const [leadTab, setLeadTab] = useState<'TASKS' | 'COMPLETED'>('TASKS');
  const [selectedCompletedLead, setSelectedCompletedLead] = useState<any>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [activeConvs, setActiveConvs] = useState(0);

  useEffect(() => {
    if (!session) return;

    const sessionProfile = session.profile;
    if (!sessionProfile || !sessionProfile.role) {
      logout();
      navigate('/login');
      return;
    }

    setProfile({ ...sessionProfile });

    const headers = { 'Authorization': `Bearer ${session.access_token}` };

    let loadedPerf = false;
    let loadedLeads = false;

    const completeSync = () => {
      if (loadedPerf && loadedLeads) {
        setIsSyncing(false);
      }
    };

    fetchWithCache('/staff-performance/me', { headers }, (data) => {
      setProfile((prev: any) => ({ ...prev, ...data }));
      loadedPerf = true;
      completeSync();
    }).catch((err) => {
      if (err.status === 401) logout();
      loadedPerf = true;
      completeSync();
    });

    fetchWithCache('/trade-in-requests/me', { headers }, (data) => {
      setLeads(Array.isArray(data) ? data : []);
      loadedLeads = true;
      completeSync();
    }).catch((err) => {
      if (err.status === 401) logout();
      loadedLeads = true;
      completeSync();
    });

    // Fetch alerts & messages counts
    fetchWithCache(`/notifications?recipientId=${session.user.id}`, { headers }, (data) => {
      if (Array.isArray(data)) setUnreadAlerts(data.filter(n => !n.isRead).length);
    }).catch(console.error);

    fetchWithCache('/messages/conversations', { headers }, (data) => {
      if (Array.isArray(data)) setActiveConvs(data.length);
    }).catch(console.error);

  }, [session]);

  if (isSyncing) return (
    <div className="space-y-8 pb-12 pt-6">
      <div className="flex flex-col gap-1">
         <div className="h-8 w-48 rounded bg-border-subtle/40 animate-pulse" />
         <div className="h-4 w-64 rounded bg-border-subtle/40 animate-pulse mt-2" />
      </div>
      <div className="flex gap-2">
         <div className="h-10 w-24 rounded-lg bg-border-subtle/40 animate-pulse" />
         <div className="h-10 w-24 rounded-lg bg-border-subtle/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );

  const activeTasks = leads.filter(l => ['NEW_LEAD', 'INSPECTION_PENDING', 'IN_PROGRESS', 'ASSIGNED'].includes(l.status));
  const completedTasks = leads.filter(l => !['NEW_LEAD', 'INSPECTION_PENDING', 'IN_PROGRESS', 'ASSIGNED'].includes(l.status));

  const displayLeads = leadTab === 'TASKS' ? activeTasks : completedTasks;

  const renderLeads = () => (
    <div className="flex flex-col h-full">
      {/* Fixed Title Container */}
      <div className="shrink-0 pb-5 z-40 bg-bg-base/90 backdrop-blur-xl">
         <h1 className="text-[32px] sm:text-[36px] font-black text-text-main tracking-tight leading-none mb-1">Dashboard</h1>
         <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest opacity-70">
           Operational Dashboard • {profile?.location || 'Main'} Branch
         </p>
      </div>

      {/* Scrolling Content Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-6">
          
          {/* Dashboard Overview Snippets */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-surface-card border border-border-subtle rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-8 h-8 rounded-full bg-primary-main/10 flex items-center justify-center mb-1.5">
                <CheckCircle2 size={14} className="text-primary-main" />
              </div>
              <p className="text-[18px] font-black text-text-main leading-none">{profile?.total_completed_tasks ?? 0}</p>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-1">Inspections</p>
            </div>
            
            <div 
              onClick={() => navigate('/messages')}
              className="bg-surface-card border border-border-subtle rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden cursor-pointer hover:border-blue-500/30 transition-colors"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-[40px]" />
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-1.5 z-10">
                <MessageCircle size={14} className="text-blue-500" />
              </div>
              <p className="text-[18px] font-black text-text-main leading-none z-10">{activeConvs}</p>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-1 z-10">Messages</p>
            </div>

            <div 
              onClick={() => navigate('/notifications')}
              className="bg-surface-card border border-border-subtle rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden cursor-pointer hover:border-rose-500/30 transition-colors"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 rounded-bl-[40px]" />
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center mb-1.5 z-10">
                <Bell size={14} className="text-rose-500" />
              </div>
              <p className="text-[18px] font-black text-text-main leading-none z-10">{unreadAlerts}</p>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-1 z-10">Alerts</p>
            </div>
          </div>

          <NegotiationWidget />

          <div className="sticky top-0 z-30 flex bg-surface-card/60 backdrop-blur-2xl border border-border-subtle p-1 rounded-[16px] w-full max-w-sm shadow-sm mb-4">
               <button 
                 onClick={() => setLeadTab('TASKS')}
                 className={cn(
                   "flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all",
                   leadTab === 'TASKS' ? "bg-primary-main text-white shadow-md shadow-primary-main/20" : "text-text-secondary hover:bg-bg-secondary/50"
                 )}
               >
                 Active Tasks ({activeTasks.length})
               </button>
               <button 
                 onClick={() => setLeadTab('COMPLETED')}
                 className={cn(
                   "flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all",
                   leadTab === 'COMPLETED' ? "bg-primary-main text-white shadow-md shadow-primary-main/20" : "text-text-secondary hover:bg-bg-secondary/50"
                 )}
               >
                 Completed ({completedTasks.length})
               </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 pb-12">
            {displayLeads.length === 0 ? (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-border-subtle rounded-[24px] bg-surface-card/50">
                <Activity size={32} className="mx-auto text-text-muted/30 mb-4" />
                <p className="text-text-muted font-bold uppercase tracking-wider text-[10px]">No active leads found in this category.</p>
              </div>
            ) : displayLeads.map(lead => (
              <ModernLeadCard 
                key={lead.id} 
                lead={lead} 
                onClick={() => {
                  if (leadTab === 'COMPLETED') {
                    setSelectedCompletedLead(lead);
                  } else {
                    navigate(`/eval/${lead.id}`);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <div className="flex flex-col h-full w-full min-h-0">
      {activeTab === 'leads' && renderLeads()}
      {activeTab === 'sourcing' && <SourcingModule />}
      {activeTab === 'tasks' && <TasksManager />}
      {activeTab === 'budget' && <BudgetRequests />}
      {(activeTab === 'team' && (profile?.role === 'DISTRICT_MANAGER' || profile?.role === 'GENERAL_MANAGER')) && <TeamManager />}
      {(activeTab === 'inventory' && (profile?.role === 'DISTRICT_MANAGER' || profile?.role === 'GENERAL_MANAGER')) && <InventoryModule />}
      
      {/* Inspection Report View for Completed Leads */}
      <InspectionReportView 
        isOpen={!!selectedCompletedLead}
        onClose={() => setSelectedCompletedLead(null)}
        lead={selectedCompletedLead}
      />
    </div>
  );
}
