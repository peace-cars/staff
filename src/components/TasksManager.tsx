import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { 
  MapPin, Navigation, CheckCircle, Clock, Target, ExternalLink, ShieldCheck, Activity, Zap, 
  CarFront, User, Phone, Image as ImageIcon, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { fetchWithCache } from '../lib/cache';
import { InspectionReportView } from './ui/InspectionReportView';
import { API_URL } from '../lib/api';
import { SkeletonCard } from './ui/Skeleton';

export default function TasksManager() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedCompletedTask, setSelectedCompletedTask] = useState<any>(null);

  const fetchTasks = async () => {
    if (!session) return;
    try {
      await fetchWithCache(`/staff-tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }, (data) => {
        setTasks(Array.isArray(data) ? data : []);
      });
    } catch (e: any) {
      if (e.status === 401) logout();
      console.error(e);
    }
  };

  const fetchLeads = async () => {
    if (!session) return;
    try {
      await fetchWithCache(`/trade-in-requests/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }, (data) => {
        setLeads(Array.isArray(data) ? data : []);
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchLeads()]).finally(() => setLoading(false));
  }, [session]);

  const updateProgress = async (id: string) => {
    if (!session) return;
    let coords = '(9.005401, 38.763611)'; 
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          coords = `(${pos.coords.latitude}, ${pos.coords.longitude})`;
       });
    }

    await fetch(`${API_URL}/staff-tasks/${id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ notes: 'Arrived at location', coords })
    });
    fetchTasks();
  };

  const completeTask = async (id: string) => {
    if (!session) return;
    await fetch(`${API_URL}/staff-tasks/${id}/complete`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    fetchTasks();
  };

  // Map trade-in data to tasks for richer display
  const getLeadForTask = (task: any) => {
    if (!task.trade_in_id) return null;
    return leads.find(l => l.id === task.trade_in_id) || null;
  };

  if (loading) return (
    <div className="flex flex-col h-full space-y-6 pt-6">
      <div className="flex flex-col gap-1">
         <div className="h-10 w-64 rounded bg-border-subtle/40 animate-pulse" />
         <div className="h-4 w-48 rounded bg-border-subtle/40 animate-pulse mt-2" />
      </div>
      <div className="flex gap-2 mb-2">
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

  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const displayTasks = activeTab === 'active' ? activeTasks : completedTasks;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-5 z-40 bg-bg-base/90 backdrop-blur-xl">
         <h1 className="text-[32px] sm:text-[36px] font-black text-text-main tracking-tight leading-none mb-1">Inspection Tasks</h1>
         <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-70">
            <Target size={14} className="text-text-muted" /> Assigned Evaluations & Field Tasks
         </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-6">

      {/* Tabs */}
      <div className="flex bg-surface-card border border-border-subtle p-1 rounded-xl w-full max-w-sm shadow-sm">
         <button 
           onClick={() => setActiveTab('active')}
           className={cn(
             "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
             activeTab === 'active' ? "bg-primary-main text-white shadow-sm" : "text-text-secondary hover:bg-bg-base"
           )}
         >
           Active ({activeTasks.length})
         </button>
         <button 
           onClick={() => setActiveTab('completed')}
           className={cn(
             "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
             activeTab === 'completed' ? "bg-primary-main text-white shadow-sm" : "text-text-secondary hover:bg-bg-base"
           )}
         >
           Completed ({completedTasks.length})
         </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {displayTasks.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-border-subtle rounded-2xl bg-surface-card flex flex-col items-center gap-3">
            <Activity size={32} className="text-text-muted/20" />
            <p className="text-text-muted font-bold uppercase tracking-wider text-[9px]">
              {activeTab === 'active' ? 'No active tasks assigned.' : 'No completed tasks yet.'}
            </p>
          </div>
        ) : displayTasks.map(task => {
          const linkedLead = getLeadForTask(task);
          const photo = linkedLead?.photos?.[0];
          const vehicleName = linkedLead?.vehicle || task.description;
          const isCompleted = task.status === 'COMPLETED';
          
          return (
            <div 
              key={task.id} 
              className={cn(
                "native-card bg-surface-card border border-border-subtle overflow-hidden rounded-2xl transition-all duration-300",
                isCompleted ? 'opacity-80' : 'hover:border-primary-main/30'
              )}
            >
              {/* Task Card with Photo */}
              <div className="flex flex-col sm:flex-row gap-0 h-full">
                {/* Vehicle Photo */}
                <div className="w-full sm:w-36 h-32 sm:h-full shrink-0 bg-bg-base overflow-hidden relative border-b sm:border-b-0 sm:border-r border-border-subtle/20">
                  {photo ? (
                    <img 
                      src={photo} 
                      alt={vehicleName} 
                      className="w-full h-full object-cover sm:min-h-[140px]" 
                    />
                  ) : (
                    <div className="w-full h-full sm:min-h-[140px] flex flex-col items-center justify-center gap-1 text-text-muted/25">
                      <CarFront size={28} />
                      <span className="text-[7px] font-bold uppercase tracking-widest">No Photo</span>
                    </div>
                  )}
                  {/* Priority Badge on Photo */}
                  <div className="absolute top-2 left-2">
                    <span className={cn(
                      "text-[7px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest backdrop-blur-md shadow-sm",
                      task.priority === 'URGENT' ? "bg-red-500/90 text-white" :
                      task.priority === 'HIGH' ? "bg-amber-500/90 text-white" :
                      "bg-black/60 text-white/90"
                    )}>
                       {task.priority || 'NORMAL'}
                    </span>
                  </div>
                </div>

                {/* Task Content */}
                <div className="flex-1 p-2.5 sm:p-4 flex flex-col gap-1.5 sm:gap-2 min-w-0">
                  {/* Header: Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-surface-hover border border-border-subtle rounded-md sm:rounded-lg text-[8px] font-bold text-text-secondary uppercase tracking-widest leading-none">
                       <Clock size={8} className="sm:w-[9px] sm:h-[9px]" /> {task.status?.replace(/_/g, ' ')}
                    </div>
                    {isCompleted && <ShieldCheck size={14} className="text-emerald-500" />}
                  </div>

                  {/* Vehicle Title */}
                  <h3 className="text-[13px] sm:text-[14px] font-bold text-text-main tracking-tight leading-tight truncate">
                    {vehicleName}
                  </h3>

                  {/* Customer info if available */}
                  {linkedLead && (
                    <div className="flex items-center gap-1 sm:gap-3 text-[9px] sm:text-[10px] text-text-secondary font-bold truncate">
                      <span className="flex items-center gap-1 truncate shrink">
                        <User size={9} className="shrink-0 text-text-muted" />
                        <span className="truncate">{linkedLead.customer}</span>
                      </span>
                      {linkedLead.phone && (
                        <>
                          <span className="hidden sm:block w-0.5 h-0.5 bg-border-subtle rounded-full shrink-0" />
                          <span className="flex items-center gap-0.5 sm:gap-1 shrink-0 text-primary-main">
                            <Phone size={9} className="shrink-0" />
                            <span className="truncate">{linkedLead.phone}</span>
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Price if linked */}
                  {linkedLead && (linkedLead.askingPrice || linkedLead.user_asking_price_etb) && (
                    <p className="text-[13px] font-black text-text-main tracking-tight">
                      {Number(linkedLead.askingPrice || linkedLead.user_asking_price_etb).toLocaleString()} <span className="text-[9px] font-medium text-text-muted">ETB</span>
                    </p>
                  )}

                  {/* Action Button */}
                  <div className="mt-auto pt-2">
                    {!isCompleted ? (
                      <div className="flex flex-col gap-2">
                        {task.trade_in_id ? (
                          <button 
                             className="w-full bg-primary-main text-white py-2.5 font-bold rounded-xl shadow-lg shadow-primary-main/20 text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-primary-main/90 transition-all active:scale-95 gap-1.5"
                             onClick={() => navigate(`/eval/${task.trade_in_id}`)} 
                          >
                             <Zap size={14} /> Start Evaluation
                          </button>
                        ) : (
                          <button 
                             className="w-full bg-primary-main text-white py-2.5 font-bold rounded-xl shadow-lg shadow-primary-main/20 text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-primary-main/90 transition-all active:scale-95 gap-1.5"
                             onClick={() => updateProgress(task.id)} 
                          >
                             <Navigation size={14} /> Mark Arrival
                          </button>
                        )}
                        
                        <button 
                           className="w-full bg-surface-card text-text-secondary py-2 font-bold rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center hover:bg-surface-hover transition-all border border-border-subtle gap-1.5"
                           onClick={() => completeTask(task.id)} 
                        >
                           <CheckCircle size={14} /> Mark as Resolved
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          if (linkedLead) {
                            setSelectedCompletedTask(linkedLead);
                          }
                        }}
                        className="w-full bg-emerald-500/10 text-emerald-600 py-2.5 px-3 rounded-xl flex items-center justify-between border border-emerald-500/20 hover:bg-emerald-500/15 transition-all active:scale-[0.98]"
                      >
                         <div className="flex items-center gap-1.5">
                            <CheckCircle size={14} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Completed</p>
                         </div>
                         {linkedLead && (
                           <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest opacity-70">
                             View Report <ChevronRight size={12} />
                           </div>
                         )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-surface-card border border-border-subtle p-4 rounded-2xl flex items-start gap-4">
         <div className="bg-bg-base p-2.5 rounded-xl text-text-muted shrink-0">
            <Activity size={18} />
         </div>
         <div>
            <p className="text-[10px] font-bold text-text-main uppercase tracking-wider mb-1">Information</p>
            <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
               Please ensure all tasks are resolved within the allocated timeframe. Completed tasks contribute to your performance metrics.
            </p>
         </div>
      </div>

      <InspectionReportView 
        isOpen={!!selectedCompletedTask}
        onClose={() => setSelectedCompletedTask(null)}
        lead={selectedCompletedTask}
      />
        </div>
      </div>
    </div>
  );
}
