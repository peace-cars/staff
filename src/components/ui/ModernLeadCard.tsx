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
      className="native-card bg-surface-card border border-border-subtle overflow-hidden flex flex-col group hover:border-primary-main/30 transition-all duration-300 cursor-pointer active:scale-[0.99]"
    >
      {/* Photo / Thumbnail */}
      <div className="relative w-full aspect-[16/10] bg-bg-base overflow-hidden">
        {photo ? (
          <img 
            src={photo} 
            alt={lead.vehicle || 'Vehicle'} 
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted/30">
            <CarFront size={36} />
            <span className="text-[9px] font-bold uppercase tracking-widest">No Photo</span>
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-sm",
            isIncoming 
              ? "bg-primary-main/90 text-white" 
              : "bg-black/60 text-white/90"
          )}>
            {isIncoming ? <Clock size={10} className="animate-pulse" /> : <CheckCircle2 size={10} />}
            {lead.status?.replace(/_/g, ' ')}
          </div>
        </div>
        {/* Photo Count */}
        {lead.photos && lead.photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <ImageIcon size={10} />
            {lead.photos.length}
          </div>
        )}
        {lead.financing && (
          <div className="absolute top-3 right-3 bg-warning/90 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
            Finance
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Vehicle Name & Location */}
        <div>
          <h3 className="text-[15px] font-bold text-text-main tracking-tight leading-tight group-hover:text-primary-main transition-colors">
            {lead.vehicle}
          </h3>
          <div className="flex items-center gap-1.5 text-text-secondary mt-1">
            <MapPin size={11} className="text-text-muted shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">{lead.location || 'Addis Ababa'}</span>
          </div>
        </div>

        {/* Price Row */}
        <div className="flex items-end justify-between pt-2 border-t border-border-subtle/50">
          <div>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Asking Price</p>
            <p className="text-lg font-black text-text-main tracking-tight leading-none">
              {Number(lead.askingPrice || lead.user_asking_price_etb || 0).toLocaleString()} <span className="text-[10px] font-medium text-text-muted">ETB</span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary-main group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>{isIncoming ? 'Evaluate' : 'Details'}</span>
            <ArrowUpRight size={12} />
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary min-w-0 truncate">
            <User size={11} className="text-text-muted shrink-0" />
            <span className="truncate">{lead.customer}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-primary-main font-bold shrink-0">
            <Phone size={11} className="shrink-0" />
            <span>{lead.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
