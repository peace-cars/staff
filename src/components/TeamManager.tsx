import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { 
  Users, Star, Activity, CheckCircle, Wallet, PlusCircle, X, Send, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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
      const res = await fetch('http://localhost:3000/staff-performance/branch-roster', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setTeam(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
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
      await fetch('http://localhost:3000/staff-tasks', {
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
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Loading team...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Branch Team</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none flex items-center gap-2 mt-1">
          <Users size={14} /> Staff Management
        </p>
      </div>

      <div className="space-y-4">
        {team.length === 0 ? (
          <div className="py-20 text-center ios-card bg-slate-50/50 border-dashed">
            <Users size={28} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No team members found</p>
          </div>
        ) : team.map(member => (
          <div key={member.id} className="ios-card ios-shadow p-5 group transition-all">
            {/* Member Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                    <Star size={18} className={cn(member.gamification_points > 500 ? 'text-amber-500' : 'text-slate-400')} />
                  </div>
                  {member.isOnline && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {member.full_name}
                  </h4>
                  <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">
                    {member.role?.replace(/_/g, ' ') || 'Staff'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 tracking-tight">{member.gamification_points} <span className="text-[8px] text-slate-400 font-bold">PTS</span></p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center gap-1">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-sm font-bold text-slate-900">{member.total_completed_tasks || 0}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center gap-1">
                <Activity size={14} className="text-indigo-500" />
                <span className="text-sm font-bold text-slate-900">{member.activeTasks || 0}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Active</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center gap-1">
                <Wallet size={14} className="text-amber-500" />
                <span className="text-sm font-bold text-slate-900">{member.pendingBudgets || 0}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Budget</span>
              </div>
            </div>

            {/* Assign Button */}
            <button 
              onClick={() => { setSelectedStaff(member); setShowAssignModal(true); }}
              className="w-full bg-slate-50 text-slate-600 py-3 font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
            >
              <PlusCircle size={14} /> Assign Task
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
              className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-[2rem] p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Assign Task</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                    To: <span className="text-indigo-600">{selectedStaff?.full_name}</span>
                  </p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 transition-all">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignTask} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Task Description</label>
                  <textarea
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    required
                    placeholder="Describe the task..."
                    className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300 min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={cn(
                          "py-3 rounded-xl text-[9px] font-bold tracking-wider transition-all border uppercase",
                          priority === p 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 text-white py-4 font-bold rounded-xl text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <Send size={16} /> Assign Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manager Note */}
      <div className="glass-card p-5 rounded-[2rem] flex items-start gap-4 relative overflow-hidden backdrop-blur-xl">
        <div className="bg-slate-100 p-2 rounded-xl text-slate-400 shrink-0">
          <Shield size={16} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-1">Management Note</p>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Task delegation helps optimize field operations. Verify staff availability before assigning high-priority missions.
          </p>
        </div>
      </div>
    </div>
  );
}
