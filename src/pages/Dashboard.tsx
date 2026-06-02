import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Award, Star } from 'lucide-react';
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
    const perfCached = apiCache.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-performance/me_GET_""`);
    const leadsCached = apiCache.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/trade-in-requests/me_GET_""`);
    return !(perfCached && leadsCached);
  })();

  const [isSyncing, setIsSyncing] = useState(initialSyncState);
  const [leadTab, setLeadTab] = useState<'TASKS' | 'COMPLETED'>('TASKS');
  const [selectedCompletedLead, setSelectedCompletedLead] = useState<any>(null);

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

    fetchWithCache(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-performance/me`, { headers }, (data) => {
      setProfile((prev: any) => ({ ...prev, ...data }));
      loadedPerf = true;
      completeSync();
    }).catch((err) => {
      if (err.status === 401) logout();
      loadedPerf = true;
      completeSync();
    });

    fetchWithCache(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/trade-in-requests/me`, { headers }, (data) => {
      setLeads(Array.isArray(data) ? data : []);
      loadedLeads = true;
      completeSync();
    }).catch((err) => {
      if (err.status === 401) logout();
      loadedLeads = true;
      completeSync();
    });

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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
         <h1 className="text-3xl font-bold text-text-main tracking-tight">Lead Pipeline</h1>
         <p className="text-text-secondary text-[11px] font-bold uppercase tracking-wider opacity-70">Operational Dashboard • {profile?.location || 'Main'} Branch</p>
      </div>

      <NegotiationWidget />

      <div className="flex bg-surface-card border border-border-subtle p-1 rounded-xl w-full max-w-sm shadow-sm">
         <button 
           onClick={() => setLeadTab('TASKS')}
           className={cn(
             "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
             leadTab === 'TASKS' ? "bg-primary-main text-white shadow-sm" : "text-text-secondary hover:bg-bg-base"
           )}
         >
           Active Tasks ({activeTasks.length})
         </button>
         <button 
           onClick={() => setLeadTab('COMPLETED')}
           className={cn(
             "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
             leadTab === 'COMPLETED' ? "bg-primary-main text-white shadow-sm" : "text-text-secondary hover:bg-bg-base"
           )}
         >
           Completed ({completedTasks.length})
         </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayLeads.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border-subtle rounded-3xl bg-surface-card">
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
  );



  return (
    <div className="pb-24">
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
