import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { 
  MapPin, Navigation, CheckCircle, Clock, Target, ExternalLink, ShieldCheck, Activity, Zap 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function TasksManager() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!session) return;
    try {
      const res = await fetch('http://localhost:3000/staff-tasks/my-tasks', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.status === 401) return logout();
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
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

    await fetch(`http://localhost:3000/staff-tasks/${id}/progress`, {
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
    await fetch(`http://localhost:3000/staff-tasks/${id}/complete`, {
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
         <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
            <Target size={14} className="text-text-muted" /> Field Operations Control
         </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border-subtle rounded-3xl bg-white">
            <Activity size={32} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted font-bold uppercase tracking-wider text-[9px]">No tasks currently assigned.</p>
          </div>
        ) : tasks.map(task => (
          <div key={task.id} className={cn(
            "native-card p-6 flex flex-col gap-5 group transition-all duration-300", 
            task.status === 'COMPLETED' ? 'opacity-60 grayscale-[0.2]' : 'hover:border-slate-300'
          )}>
             {/* Task Header */}
             <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-2">
                   <span className={cn(
                     "text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-widest", 
                     task.priority === 'URGENT' ? "bg-red-50 text-red-600 border-red-100" :
                     task.priority === 'HIGH' ? "bg-amber-50 text-amber-600 border-amber-100" :
                     "bg-blue-50 text-blue-600 border-blue-100"
                   )}>
                      {task.priority || 'NORMAL'}
                   </span>
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <Clock size={12} /> {task.status?.replace(/_/g, ' ')}
                   </div>
                </div>
                <ShieldCheck className={cn(task.status === 'COMPLETED' ? "text-emerald-500" : "text-slate-200")} size={20} />
             </div>
             
             {/* Task Body */}
             <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                  {task.description}
                </h3>
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <MapPin size={12} className="text-slate-400" /> 
                      {task.location_coordinates ? 'Location Logged' : 'Location Not Set'}
                   </div>
                   
                   {task.location_coordinates && (
                     <button 
                       onClick={() => window.open(`https://maps.google.com?q=${task.location_coordinates}`, '_blank')} 
                       className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors bg-white border border-slate-100 shadow-sm"
                     >
                        <ExternalLink size={14} />
                     </button>
                   )}
                </div>
             </div>

             {/* Action Section */}
             <div className="pt-4 border-t border-slate-50">
                {task.status !== 'COMPLETED' ? (
                   <div className="flex flex-col gap-3">
                      {task.trade_in_id ? (
                        <button 
                           className="w-full bg-slate-900 text-white py-4 font-bold rounded-xl shadow-lg shadow-slate-200 text-[11px] uppercase tracking-widest flex items-center justify-center hover:bg-slate-800 transition-all active:scale-95 gap-2"
                           onClick={() => navigate(`/eval/${task.trade_in_id}`)} 
                        >
                           <Zap size={16} /> Start Evaluation
                        </button>
                      ) : (
                        <button 
                           className="w-full bg-slate-900 text-white py-4 font-bold rounded-xl shadow-lg shadow-slate-200 text-[11px] uppercase tracking-widest flex items-center justify-center hover:bg-slate-800 transition-all active:scale-95 gap-2"
                           onClick={() => updateProgress(task.id)} 
                        >
                           <Navigation size={16} /> Mark Arrival
                        </button>
                      )}
                      
                      <button 
                         className="w-full bg-white text-slate-500 py-3.5 font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-slate-50 transition-all border border-slate-100 gap-2"
                         onClick={() => completeTask(task.id)} 
                      >
                         <CheckCircle size={16} /> Mark as Resolved
                      </button>
                   </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-600 py-4 px-6 rounded-xl flex items-center justify-between border border-emerald-100 shadow-sm">
                     <div className="flex items-center gap-2">
                        <CheckCircle size={16} />
                        <p className="text-[11px] font-bold uppercase tracking-widest">Assignment Completed</p>
                     </div>
                     <p className="text-[10px] text-emerald-400 font-mono">ID: {task.id.substring(0,6).toUpperCase()}</p>
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border-subtle p-6 rounded-3xl flex items-start gap-4">
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
