import { 
  User, Phone, DollarSign, Clock, MapPin, CarFront,
  CheckCircle2, ArrowUpRight, Image as ImageIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModernLeadCardProps {
  lead: any;
  onClick: () => void;
}

export function ModernLeadCard({ lead, onClick }: ModernLeadCardProps) {
  const isIncoming = lead.status === 'NEW_LEAD' || lead.status === 'INSPECTION_PENDING';
  const photo = lead.photos && lead.photos.length > 0 ? lead.photos[0] : null;
  
  return (
    <div 
      onClick={onClick}
      className="native-card bg-surface-card border border-border-subtle overflow-hidden flex flex-col sm:flex-row group hover:border-primary-main/30 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99] rounded-xl sm:h-32 h-full"
    >
      {/* Photo / Thumbnail */}
      <div className="relative w-full sm:w-48 h-32 sm:h-full bg-bg-base overflow-hidden shrink-0 border-b sm:border-b-0 sm:border-r border-border-subtle/20">
        {photo ? (
          <img 
            src={photo} 
            alt={lead.vehicle || 'Vehicle'} 
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted/30">
            <CarFront size={32} />
            <span className="text-[8px] font-bold uppercase tracking-widest">No Photo</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <div className={cn(
            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-sm",
            isIncoming 
              ? "bg-primary-main/90 text-white" 
              : "bg-black/60 text-white/90"
          )}>
            {isIncoming ? <Clock size={9} className="animate-pulse" /> : <CheckCircle2 size={9} />}
            {lead.status?.replace(/_/g, ' ')}
          </div>
        </div>
        
        {/* Photo Count */}
        {lead.photos && lead.photos.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <ImageIcon size={9} />
            {lead.photos.length}
          </div>
        )}
        {lead.financing && (
          <div className="absolute top-2 right-2 bg-warning/90 backdrop-blur-md text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm">
            Finance
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-1 sm:gap-3">
          <div className="min-w-0 w-full">
            <h3 className="text-[12px] sm:text-[15px] font-bold text-text-main tracking-tight leading-tight group-hover:text-primary-main transition-colors truncate">
              {lead.vehicle}
            </h3>
            <div className="flex items-center gap-1.5 text-text-secondary mt-1">
              <MapPin size={11} className="text-text-muted shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider truncate">{lead.location || 'Addis Ababa'}</span>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
            <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1 hidden sm:block">Asking Price</p>
            <p className="text-[13px] sm:text-[16px] font-black text-text-main tracking-tight leading-none">
              {Number(lead.askingPrice || lead.user_asking_price_etb || 0).toLocaleString()} <span className="text-[8px] sm:text-[9px] font-medium text-text-muted">ETB</span>
            </p>
          </div>
        </div>

        {/* Customer Info & Action */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 mt-auto sm:mt-3 border-t border-border-subtle/30 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-text-secondary min-w-0 truncate">
              <User size={10} className="text-text-muted shrink-0" />
              <span className="truncate">{lead.customer}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-primary-main font-bold shrink-0">
              <Phone size={10} className="shrink-0" />
              <span>{lead.phone}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary-main group-hover:translate-x-1 transition-transform shrink-0 opacity-0 group-hover:opacity-100">
            <span>{isIncoming ? 'Evaluate' : 'Details'}</span>
            <ArrowUpRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
