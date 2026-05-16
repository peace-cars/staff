import { 
  User, Phone, ChevronRight, DollarSign, 
  Clock, MapPin, CheckCircle2, Hash, ArrowUpRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModernLeadCardProps {
  lead: any;
  onClick: () => void;
}

export function ModernLeadCard({ lead, onClick }: ModernLeadCardProps) {
  const isIncoming = lead.status === 'NEW_LEAD' || lead.status === 'INSPECTION_PENDING';
  
  return (
    <div className="native-card p-6 flex flex-col gap-6 group hover:border-border transition-all duration-300">
      {/* Header: Status & Ref */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className={cn(
          "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
          isIncoming 
            ? "bg-primary-subtle/20 text-primary-main border border-primary-subtle" 
            : "bg-surface-hover text-text-secondary border border-border-subtle"
        )}>
          {isIncoming ? <Clock size={12} className="animate-pulse" /> : <CheckCircle2 size={12} />}
          {lead.status?.replace(/_/g, ' ')}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-text-dim uppercase tracking-wider">
           <Hash size={12} />
           <span>Ref • #{lead.id.substring(0, 8)}</span>
        </div>
      </div>

      {/* Content: Vehicle & Client */}
      <div className="grid md:grid-cols-[1fr,auto] gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-text-main tracking-tight leading-none mb-2 group-hover:text-primary-main transition-colors">
              {lead.vehicle}
            </h3>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <MapPin size={14} className="text-text-dim" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{lead.location || 'Addis Ababa'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="w-10 h-10 rounded-xl bg-surface-hover border border-border-subtle flex items-center justify-center text-text-dim">
              <User size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-text-main leading-none mb-1">{lead.customer}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-primary-main font-bold uppercase tracking-wider">
                <Phone size={12} />
                <span>{lead.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between items-end gap-4">
          {lead.financing && (
            <div className="bg-warning/10 text-warning border border-warning/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <DollarSign size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Finance</span>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-0.5">Target Ask</p>
            <p className="text-xl font-bold text-text-main tracking-tighter">
              {Number(lead.askingPrice || 0).toLocaleString()} <span className="text-xs font-normal text-text-dim">ETB</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-primary-main" />
           <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Priority: Medium</p>
        </div>
        <button 
          onClick={onClick}
          className="bg-text-main text-bg-sidebar px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 hover:bg-text-main/90 active:scale-95 shadow-lg shadow-black/5"
        >
          {isIncoming ? 'Evaluate' : 'Details'}
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}
