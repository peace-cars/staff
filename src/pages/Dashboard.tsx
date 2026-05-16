import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Award, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import TasksManager from '../components/TasksManager';
import BudgetRequests from '../components/BudgetRequests';
import TeamManager from '../components/TeamManager';
import InventoryModule from '../components/InventoryModule';
import { ModernLeadCard } from '../components/ui/ModernLeadCard';
import NegotiationWidget from '../components/NegotiationWidget';
import { cn } from '../lib/utils';

interface DashboardProps {
  activeTab?: 'leads' | 'tasks' | 'budget' | 'performance' | 'team' | 'inventory';
}

export default function Dashboard({ activeTab = 'leads' }: DashboardProps) {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [leadTab, setLeadTab] = useState<'TASKS' | 'COMPLETED'>('TASKS');

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

    Promise.all([
      fetch('http://localhost:3000/staff-performance/me', { headers }),
      fetch('http://localhost:3000/trade-in-requests', { headers }), 
      fetch('http://localhost:3000/staff-performance/leaderboard', { headers })
    ]).then(async ([perfRes, leadsRes, leaderRes]) => {
      if (perfRes.status === 401 || leadsRes.status === 401 || leaderRes.status === 401) {
         logout();
         return;
      }
      const perfData = perfRes.ok ? await perfRes.json() : null;
      const leadsData = leadsRes.ok ? await leadsRes.json() : [];
      const leaderData = leaderRes.ok ? await leaderRes.json() : [];
      
      if (perfData) setProfile((prev: any) => ({ ...prev, ...perfData }));
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setLeaderboard(Array.isArray(leaderData) ? leaderData : []);
      setIsSyncing(false);
    }).catch(() => setIsSyncing(false));

  }, [session]);

  if (isSyncing) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
       <div className="w-12 h-12 border-4 border-primary-main/20 border-t-primary-main rounded-full animate-spin" />
       <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Synchronizing data...</p>
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

      <div className="grid grid-cols-1 gap-4">
        {displayLeads.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border-subtle rounded-3xl bg-surface-card">
            <Activity size={32} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted font-bold uppercase tracking-wider text-[10px]">No active leads found in this category.</p>
          </div>
        ) : displayLeads.map(lead => (
          <ModernLeadCard 
            key={lead.id} 
            lead={lead} 
            onClick={() => navigate(`/eval/${lead.id}`)}
          />
        ))}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-8 pb-12">
       <div className="space-y-1">
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Regional Leaderboard</h1>
          <p className="text-text-secondary text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">Branch Performance Rankings</p>
       </div>

       <div className="grid grid-cols-1 gap-4">
         {leaderboard.slice(0, 10).map((medalist: any, idx: number) => (
            <div key={medalist.id} className={cn(
              "native-card p-5 group flex items-center gap-5",
              idx === 0 ? 'border-primary-main/30 bg-primary-subtle/10 shadow-lg' : ''
            )}>
               <div className={cn(
                 "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm",
                 idx === 0 ? "bg-primary-main text-white" : "bg-bg-base border border-border-subtle text-text-muted"
               )}>
                  {idx === 0 ? <Award size={24} /> : (idx + 1)}
               </div>
               <div className="flex-grow">
                  <h3 className="text-base font-bold text-text-main tracking-tight group-hover:text-primary-main transition-colors uppercase leading-none mb-2">
                    {medalist.fullName}
                  </h3>
                  <div className="flex items-center gap-4">
                     <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 leading-none">
                       <Star size={12} className="text-amber-500" /> {medalist.score} POINTS
                     </p>
                     <span className="w-1 h-1 bg-border-subtle rounded-full" />
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-none">
                       {idx === 0 ? 'Top Performer' : 'Regional Associate'}
                     </p>
                  </div>
               </div>
               <div className="text-right">
                 <p className="text-xl font-bold text-text-main tracking-tighter">#{idx + 1}</p>
                 <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Rank</p>
               </div>
            </div>
         ))}
       </div>
    </div>
  );

  return (
    <div className="pb-24">
      {activeTab === 'leads' && renderLeads()}
      {activeTab === 'performance' && renderPerformance()}
      {activeTab === 'tasks' && <TasksManager />}
      {activeTab === 'budget' && <BudgetRequests />}
      {(activeTab === 'team' && (profile?.role === 'DISTRICT_MANAGER' || profile?.role === 'GENERAL_MANAGER')) && <TeamManager />}
      {(activeTab === 'inventory' && (profile?.role === 'DISTRICT_MANAGER' || profile?.role === 'GENERAL_MANAGER')) && <InventoryModule />}
    </div>
  );
}
