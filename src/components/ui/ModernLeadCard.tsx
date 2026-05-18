import { 
  User, Phone, DollarSign, Clock, MapPin, 
  CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModernLeadCardProps {
  lead: any;
  onClick: () => void;
}

export function ModernLeadCard({ lead, onClick }: ModernLeadCardProps) {
  const isIncoming = lead.status === 'NEW_LEAD' || lead.status === 'INSPECTION_PENDING';
  
  return (
    <div 
      onClick={onClick}
      className="native-card bg-surface-card border border-border-subtle p-3.5 flex flex-col gap-3 group hover:border-primary-main/30 transition-all duration-300 cursor-pointer active:scale-[0.99]"
    >
      {/* Upper Row: Status, ID & Action */}
      <div className="flex items-center justify-between">
        <div className={cn(
          "px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5",
          isIncoming 
            ? "bg-primary-subtle text-primary-main border border-primary-main/20" 
            : "bg-surface-hover text-text-secondary border border-border-subtle"
        )}>
          {isIncoming ? <Clock size={10} className="animate-pulse" /> : <CheckCircle2 size={10} />}
          {lead.status?.replace(/_/g, ' ')}
        </div>
        <div className="flex items-center gap-1.5">
          {lead.financing && (
            <span className="bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
              Finance
            </span>
          )}
          <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">
            #{lead.id.substring(0, 6)}
          </span>
        </div>
      </div>

      {/* Main Info Row */}
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-text-main tracking-tight truncate group-hover:text-primary-main transition-colors leading-tight">
            {lead.vehicle}
          </h3>
          <div className="flex items-center gap-1.5 text-text-secondary mt-1">
            <MapPin size={10} className="text-text-muted shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider truncate">{lead.location || 'Addis Ababa'}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest leading-none mb-0.5">Asking Price</p>
          <p className="text-sm font-black text-text-main tracking-tight leading-none">
            {Number(lead.askingPrice || lead.user_asking_price_etb || 0).toLocaleString()} <span className="text-[9px] font-medium text-text-muted">ETB</span>
          </p>
        </div>
      </div>

      {/* Bottom Action / Metadata Row */}
      <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary truncate">
            <User size={10} className="text-text-muted shrink-0" />
            <span className="truncate">{lead.customer}</span>
          </div>
          <span className="w-1 h-1 bg-border-subtle rounded-full shrink-0" />
          <div className="flex items-center gap-1 text-[10px] text-primary-main font-bold shrink-0">
            <Phone size={10} className="shrink-0" />
            <span>{lead.phone}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-primary-main group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>{isIncoming ? 'Evaluate' : 'Details'}</span>
          <ArrowUpRight size={10} />
        </div>
      </div>
    </div>
  );
}
