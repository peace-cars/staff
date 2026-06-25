import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { 
  Users, Star, Activity, CheckCircle, Wallet, PlusCircle, X, Send, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { fetchWithCache } from '../lib/cache';
import { SkeletonCard } from './ui/Skeleton';

export default function TeamManager() {
  const { session } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const fetchTeam = async () => {
    if (!session) return;
    try {
      await fetchWithCache('/staff-performance/branch-roster', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }, (data) => {
        setTeam(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [session]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedStaff) return;

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          assigned_to: selectedStaff.id,
          description: taskDescription,
          priority
        })
      });
      setShowAssignModal(false);
      setTaskDescription('');
      fetchTeam();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-full space-y-6 pt-6">
      <div className="flex flex-col gap-1 mb-4">
         <div className="h-10 w-64 rounded bg-border-subtle/40 animate-pulse" />
         <div className="h-4 w-48 rounded bg-border-subtle/40 animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="shrink-0 pb-5 z-40 bg-bg-base/90 backdrop-blur-xl">
        <h1 className="text-[32px] sm:text-[36px] font-black text-text-main tracking-tight leading-none mb-1">Branch Team</h1>
        <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest leading-none flex items-center gap-2 mt-1 opacity-70">
          <Users size={14} /> Staff Management
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-6">

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {team.length === 0 ? (
          <div className="col-span-full py-20 text-center native-card bg-surface-card border-dashed border-border-subtle">
            <Users size={28} className="mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted font-bold uppercase tracking-widest text-[9px]">No team members found</p>
          </div>
        ) : team.map(member => (
          <div key={member.id} className="native-card p-3 sm:p-5 group transition-all bg-surface-card border border-border-subtle shadow-lg shadow-black/5 flex flex-col h-full">
            {/* Member Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-surface-hover rounded-xl flex items-center justify-center text-primary-main group-hover:scale-105 transition-transform">
                    <Star size={16} className={cn('sm:w-[18px] sm:h-[18px]', member.gamification_points > 500 ? 'text-amber-500' : 'text-text-muted')} />
                  </div>
                  {member.isOnline && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-surface-card" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] sm:text-sm font-bold text-text-main tracking-tight group-hover:text-primary-main transition-colors truncate">
                    {member.full_name}
                  </h4>
                  <p className="text-[8px] sm:text-[9px] text-primary-main font-bold uppercase tracking-widest mt-0.5 truncate">
                    {member.role?.replace(/_/g, ' ') || 'Staff'}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-[14px] sm:text-lg font-bold text-text-main tracking-tight leading-none">{member.gamification_points} <span className="text-[7px] sm:text-[8px] text-text-muted font-bold">PTS</span></p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-3 sm:mb-4 flex-1">
              <div className="bg-bg-base rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                <CheckCircle size={12} className="text-emerald-500 sm:w-[14px] sm:h-[14px]" />
                <span className="text-[12px] sm:text-sm font-bold text-text-main leading-none">{member.total_completed_tasks || 0}</span>
                <span className="text-[6px] sm:text-[7px] text-text-muted font-bold uppercase tracking-wider text-center">Done</span>
              </div>
              <div className="bg-bg-base rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                <Activity size={12} className="text-primary-main sm:w-[14px] sm:h-[14px]" />
                <span className="text-[12px] sm:text-sm font-bold text-text-main leading-none">{member.activeTasks || 0}</span>
                <span className="text-[6px] sm:text-[7px] text-text-muted font-bold uppercase tracking-wider text-center">Active</span>
              </div>
              <div className="bg-bg-base rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                <Wallet size={12} className="text-amber-500 sm:w-[14px] sm:h-[14px]" />
                <span className="text-[12px] sm:text-sm font-bold text-text-main leading-none">{member.pendingBudgets || 0}</span>
                <span className="text-[6px] sm:text-[7px] text-text-muted font-bold uppercase tracking-wider text-center">Budget</span>
              </div>
            </div>

            {/* Assign Button */}
            <button 
              onClick={() => { setSelectedStaff(member); setShowAssignModal(true); }}
              className="w-full bg-surface-hover text-text-secondary py-2.5 sm:py-3 font-bold rounded-xl text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-surface-hover/80 hover:text-primary-main transition-all border border-border-subtle mt-auto"
            >
              <PlusCircle size={12} className="sm:w-[14px] sm:h-[14px]" /> Assign Task
            </button>
          </div>
        ))}
      </div>

      {/* Assign Task Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-surface-card w-full sm:max-w-sm sm:rounded-2xl rounded-t-[2rem] p-6 sm:p-8 shadow-2xl border border-border-subtle"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-text-main tracking-tight">Assign Task</h3>
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mt-0.5">
                    To: <span className="text-primary-main">{selectedStaff?.full_name}</span>
                  </p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 bg-surface-hover rounded-xl text-text-secondary hover:bg-surface-hover/80 transition-all">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignTask} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Task Description</label>
                  <textarea
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    required
                    placeholder="Describe the task..."
                    className="w-full bg-bg-base border border-border-subtle px-4 py-3.5 rounded-xl text-sm text-text-main font-medium focus:outline-none focus:border-primary-main focus:ring-1 focus:ring-primary-main/20 transition-all placeholder:text-text-muted/30 min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Priority</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={cn(
                          "py-3 rounded-xl text-[9px] font-bold tracking-wider transition-all border uppercase",
                          priority === p 
                            ? 'bg-primary-main border-primary-main text-white shadow-lg shadow-primary-main/20' 
                            : 'bg-bg-base border-border-subtle text-text-secondary hover:bg-surface-hover'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-primary-main text-white py-4 font-bold rounded-xl text-sm hover:bg-primary-main/90 transition-all shadow-lg shadow-primary-main/20 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <Send size={16} /> Assign Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manager Note */}
      <div className="bg-surface-card border border-border-subtle p-5 rounded-[2rem] flex items-start gap-4 relative overflow-hidden">
        <div className="bg-bg-base p-2 rounded-xl text-text-muted shrink-0">
          <Shield size={16} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-text-main uppercase tracking-widest mb-1">Management Note</p>
          <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
            Task delegation helps optimize field operations. Verify staff availability before assigning high-priority missions.
          </p>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
