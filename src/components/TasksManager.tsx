import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { 
  MapPin, Navigation, CheckCircle, Clock, Target, ExternalLink, ShieldCheck, Activity, Zap 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { fetchWithCache } from '../lib/cache';

export default function TasksManager() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!session) return;
    try {
      await fetchWithCache(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }, (data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    } catch (e: any) {
      if (e.status === 401) logout();
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [session]);

  const updateProgress = async (id: string) => {
    if (!session) return;
    let coords = '(9.005401, 38.763611)'; 
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          coords = `(${pos.coords.latitude}, ${pos.coords.longitude})`;
       });
    }

    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-tasks/${id}/progress`, {
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
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-tasks/${id}/complete`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    fetchTasks();
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-50 text-red-600 border-red-100';
      case 'HIGH': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
       <div className="w-10 h-10 border-4 border-primary-main/20 border-t-primary-main rounded-full animate-spin" />
       <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Updating task queue...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1">
         <h1 className="text-2xl font-bold text-text-main tracking-tight">Active Assignments</h1>
         <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Target size={14} className="text-text-muted" /> Field Operations Control
         </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border-subtle rounded-2xl bg-surface-card">
            <Activity size={32} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted font-bold uppercase tracking-wider text-[9px]">No tasks currently assigned.</p>
          </div>
        ) : tasks.map(task => (
          <div key={task.id} className={cn(
            "native-card p-4 flex flex-col gap-2 group transition-all duration-300 bg-surface-card rounded-2xl", 
            task.status === 'COMPLETED' ? 'opacity-60 grayscale-[0.2]' : 'hover:border-border-subtle'
          )}>
             {/* Task Header */}
             <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <div className="flex items-center gap-1.5">
                   <span className={cn(
                     "text-[8px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-widest", 
                     task.priority === 'URGENT' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                     task.priority === 'HIGH' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                     "bg-primary-subtle text-primary-main border-primary-subtle"
                   )}>
                      {task.priority || 'NORMAL'}
                   </span>
                   <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-hover border border-border-subtle rounded-lg text-[8px] font-bold text-text-secondary uppercase tracking-widest">
                      <Clock size={10} /> {task.status?.replace(/_/g, ' ')}
                   </div>
                </div>
                <ShieldCheck className={cn(task.status === 'COMPLETED' ? "text-emerald-500" : "text-text-muted/30")} size={16} />
             </div>
             
             {/* Task Body */}
             <div className="space-y-2">
                <h3 className="text-base font-bold text-text-main tracking-tight leading-tight group-hover:text-primary-main transition-colors">
                  {task.description}
                </h3>
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-text-secondary font-bold text-[9px] uppercase tracking-widest bg-surface-hover px-2 py-0.5 rounded-lg border border-border-subtle">
                      <MapPin size={10} className="text-text-muted" /> 
                      {task.location_coordinates ? 'Location Logged' : 'Location Not Set'}
                   </div>
                   
                   {task.location_coordinates && (
                     <button 
                       onClick={() => window.open(`https://maps.google.com?q=${task.location_coordinates}`, '_blank')} 
                       className="p-1.5 rounded-lg text-primary-main hover:bg-primary-subtle bg-surface-card border border-border-subtle shadow-sm"
                     >
                        <ExternalLink size={12} />
                     </button>
                   )}
                </div>
             </div>

             {/* Action Section */}
             <div className="pt-2.5 border-t border-border-subtle">
                {task.status !== 'COMPLETED' ? (
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
                  <div className="bg-emerald-500/10 text-emerald-500 py-2 px-3 rounded-xl flex items-center justify-between border border-emerald-500/20 shadow-sm">
                     <div className="flex items-center gap-1.5">
                        <CheckCircle size={14} />
                        <p className="text-[11px] font-bold uppercase tracking-widest">Assignment Completed</p>
                     </div>
                     <p className="text-[10px] text-emerald-500/80 font-mono">ID: {task.id.substring(0,6).toUpperCase()}</p>
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
