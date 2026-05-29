import { motion } from 'framer-motion';
import { CarFront, ShieldCheck, Activity, Zap, FileText, ArrowRight, DollarSign, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { InspectionPoint } from './useInspectionState';

interface InspectionCategoriesProps {
  lead: any;
  commRate: number;
  scores: { mechanical: number; exterior: number; interior: number };
  checklist: Record<string, InspectionPoint[]>;
  setActiveSheet: (sheet: 'exterior' | 'interior' | 'mechanical' | 'ev' | 'summary' | null) => void;
}

export function InspectionCategories({ lead, commRate, scores, checklist, setActiveSheet }: InspectionCategoriesProps) {
  return (
    <div className="w-full space-y-4">
      {/* Estimated Commission */}
      <div className="bg-gradient-to-r from-primary-main to-primary-main/80 rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign size={80} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1 relative z-10">Est. Evaluation Commission</p>
        <h3 className="text-3xl font-black tracking-tighter relative z-10">
          {Math.floor((lead?.user_asking_price_etb || 0) * commRate).toLocaleString()}
          <span className="text-xs font-bold ml-1 opacity-60">ETB</span>
        </h3>
      </div>

      <div className="bg-surface-card p-6 rounded-3xl border border-border-subtle shadow-md space-y-4">
        <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.2em]">Inspection Categories</h3>
        
        <div className="space-y-3">
          {[
            { id: 'exterior', label: 'Exterior Inspection', icon: <CarFront size={20} />, score: scores.exterior, total: checklist.exterior.length },
            { id: 'interior', label: 'Interior Inspection', icon: <ShieldCheck size={20} />, score: scores.interior, total: checklist.interior.length },
            { id: 'mechanical', label: 'Mechanical & Engine', icon: <Activity size={20} />, score: scores.mechanical, total: checklist.mechanical.length },
            { id: 'ev', label: 'EV Diagnostics', icon: <Zap size={20} />, score: null, total: checklist.ev.length },
          ].map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSheet(cat.id as any)}
              className="w-full bg-surface-hover hover:bg-border-subtle/30 p-4 rounded-2xl border border-border-subtle flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-card border border-border-subtle/50 text-text-muted flex items-center justify-center group-hover:bg-primary-subtle group-hover:text-primary-main transition-colors">
                  {cat.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-main tracking-tight">{cat.label}</h4>
                  <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest">{cat.total} Points to verify</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {cat.score !== null && (
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    cat.score > 70 ? "bg-emerald-500/10 text-emerald-500" : cat.score > 40 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {cat.score}%
                  </div>
                )}
                <ChevronRight size={18} className="text-text-muted" />
              </div>
            </motion.button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveSheet('summary')}
          className="w-full bg-primary-main hover:bg-primary-main/90 p-4 rounded-2xl shadow-lg flex items-center justify-between text-left mt-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Finalize Report</h4>
              <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest">Submit for Review</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-white" />
        </motion.button>
      </div>
    </div>
  );
}
