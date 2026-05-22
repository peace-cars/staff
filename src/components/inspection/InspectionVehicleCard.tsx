import { Image as ImageIcon, ChevronLeft, ChevronRight, User, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface InspectionVehicleCardProps {
  leadId: string | undefined;
  lead: any;
  setSelectedGalleryPhoto: (photo: string | null) => void;
}

export function InspectionVehicleCard({ leadId, lead, setSelectedGalleryPhoto }: InspectionVehicleCardProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!lead) return null;

  return (
    <div className="bg-surface-card overflow-hidden rounded-3xl shadow-xl border border-border-subtle p-4 space-y-4">
      <div className="relative aspect-[16/10] bg-surface-hover rounded-2xl overflow-hidden border border-border-subtle group">
        {lead.photos && lead.photos[activePhotoIndex] ? (
          <img 
            src={lead.photos[activePhotoIndex]} 
            className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            onClick={() => setSelectedGalleryPhoto(lead.photos[activePhotoIndex])}
            alt="Active Vehicle Photo"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <ImageIcon size={64} className="opacity-20 animate-pulse" />
          </div>
        )}
        
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-widest z-10">
          #{leadId?.substring(0,6)}
        </div>
        
        {lead.photos && lead.photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActivePhotoIndex(prev => (prev - 1 + lead.photos.length) % lead.photos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-black/70 transition active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setActivePhotoIndex(prev => (prev + 1) % lead.photos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-black/70 transition active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {lead.photos && lead.photos.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-widest">
            Photo {activePhotoIndex + 1} of {lead.photos.length}
          </div>
        )}
      </div>

      {lead.photos && lead.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth snap-x">
          {lead.photos.map((photo: string, index: number) => (
            <button
              key={index}
              type="button"
              onClick={() => setActivePhotoIndex(index)}
              className={cn(
                "w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 snap-start transition active:scale-95",
                activePhotoIndex === index 
                  ? "border-primary-main shadow-lg shadow-primary-main/15 scale-[1.02]" 
                  : "border-border-subtle hover:border-text-secondary opacity-70 hover:opacity-100"
              )}
            >
              <img src={photo} className="w-full h-full object-cover" alt={`Thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>
      )}

      <div className="bg-surface-card p-6 rounded-3xl shadow-lg border border-border-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-4 gap-3">
          <div>
            <p className="text-text-secondary text-[9px] font-bold uppercase tracking-widest mb-0.5">Asset Registry</p>
            <h2 className="text-2xl font-black text-text-main tracking-tight leading-none">{lead.vehicle}</h2>
          </div>
          <div className="sm:text-right">
            <p className="text-text-secondary text-[9px] font-bold uppercase tracking-widest mb-0.5">Asking Price</p>
            <p className="text-2xl font-black text-primary-main tracking-tight">{lead.user_asking_price_etb?.toLocaleString()} <span className="text-[10px] font-bold">ETB</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-surface-hover p-3 rounded-2xl border border-border-subtle/40">
            <div className="w-10 h-10 rounded-xl bg-surface-card border border-border-subtle/50 flex items-center justify-center text-text-muted">
              <User size={16} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Customer</p>
              <p className="text-xs font-bold text-text-main">{lead.customer}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-surface-hover p-3 rounded-2xl border border-border-subtle/40">
            <div className="w-10 h-10 rounded-xl bg-surface-card border border-border-subtle/50 flex items-center justify-center text-text-muted">
              <Phone size={16} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Contact</p>
              <p className="text-xs font-bold text-text-main">{lead.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
