import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';

export default function NegotiationWidget() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = async () => {
    try {
      const sessionStr = sessionStorage.getItem('staff_session');
      if (!sessionStr) return;
      const { access_token } = JSON.parse(sessionStr);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/recent`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      const data = await res.json();
      setRecent(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch (e) {
      console.error('Failed to fetch recent negotiations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  if (loading) return (
     <div className="h-32 bg-surface-card border border-border-subtle rounded-3xl flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-[3px] border-primary-main/10 border-t-primary-main rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Loading active messages...</p>
     </div>
  );

  if (recent.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
         <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-subtle/20 text-primary-main flex items-center justify-center shadow-sm">
               <MessageSquare size={16} />
            </div> 
            Active Negotiations
         </h4>
         <button onClick={() => navigate('/messages')} className="text-[10px] font-bold text-primary-main hover:underline uppercase tracking-wider px-0 bg-transparent">
            View All <ChevronRight size={14} className="inline ml-1" />
         </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recent.map((conv) => (
          <div 
            key={conv.id}
            onClick={() => navigate('/messages')}
            className="native-card bg-surface-card p-5 cursor-pointer hover:border-primary-main/30 transition-all flex items-center gap-4 group relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center text-text-main font-bold text-xs shadow-sm group-hover:bg-primary-subtle group-hover:text-primary-main transition-colors">
               {conv.profiles?.full_name?.substring(0, 2).toUpperCase() || 'NA'}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between gap-4 mb-1">
                  <p className="text-sm font-bold text-text-main truncate tracking-tight group-hover:text-primary-main transition-colors">{conv.profiles?.full_name}</p>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1 shrink-0">
                     <Clock size={10} className="text-primary-main/50" /> {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
               </div>
               <p className="text-xs text-text-secondary line-clamp-1 mb-2 opacity-80">
                  "{conv.last_message || 'Awaiting response...'}"
               </p>
               <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-bg-base rounded-md border border-border-subtle flex items-center gap-1.5">
                     <Zap size={10} className="text-primary-main" />
                     <p className="text-[9px] text-text-main font-bold uppercase tracking-wider leading-none">{conv.vehicles?.make} {conv.vehicles?.model}</p>
                  </div>
               </div>
            </div>
            <ChevronRight size={18} className="text-text-muted/40 group-hover:text-primary-main group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
}
