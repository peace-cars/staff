import { Image as ImageIcon, ChevronLeft, ChevronRight, User, Phone, CarFront, MapPin, DollarSign, Tag, Fuel, Gauge, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface InspectionVehicleCardProps {
  leadId: string | undefined;
  lead: any;
  setSelectedGalleryPhoto: (photo: string | null) => void;
  commRate?: number;
}

const DETAIL_LABELS: Record<string, { label: string; icon?: any }> = {
  body_type: { label: 'Body Type' },
  color: { label: 'Color' },
  fuel_type: { label: 'Fuel Type' },
  transmission: { label: 'Transmission' },
  drive_type: { label: 'Drive Type' },
  engine_cc: { label: 'Engine (CC)' },
  battery_kwh: { label: 'Battery (kWh)' },
  battery_soh: { label: 'Battery Health' },
  charger_type: { label: 'Charger Type' },
  software_language: { label: 'Software Lang' },
  duty_status: { label: 'Duty Status' },
  libre_status: { label: 'Libre Status' },
  num_owners: { label: 'Owners' },
  accident_history: { label: 'Accidents' },
  insurance_status: { label: 'Insurance' },
  import_origin: { label: 'Import Origin' },
  mileage: { label: 'Mileage (KM)' },
  vin: { label: 'VIN / Chassis' },
};

export function InspectionVehicleCard({ leadId, lead, setSelectedGalleryPhoto, commRate = 0.01 }: InspectionVehicleCardProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!lead) return null;

  const vehicleDetails = lead.vehicleDetails || {};
  const detailEntries = Object.entries(vehicleDetails).filter(([_, v]) => v !== null && v !== undefined && v !== '');

  return (
    <div className="space-y-4">
      {/* Photo Gallery — Full Width Mobile */}
      <div className="bg-surface-card overflow-hidden rounded-2xl shadow-lg border border-border-subtle">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-bg-base overflow-hidden">
          {lead.photos && lead.photos[activePhotoIndex] ? (
            <img 
              src={lead.photos[activePhotoIndex]} 
              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => setSelectedGalleryPhoto(lead.photos[activePhotoIndex])}
              alt="Vehicle Photo"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/25 gap-2">
              <CarFront size={56} />
              <span className="text-[10px] font-bold uppercase tracking-widest">No Photos Available</span>
            </div>
          )}
          
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-widest z-10">
            #{leadId?.substring(0,6)}
          </div>
          
          {lead.photos && lead.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(prev => (prev - 1 + lead.photos.length) % lead.photos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-black/70 transition active:scale-90"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(prev => (prev + 1) % lead.photos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-black/70 transition active:scale-90"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {lead.photos && lead.photos.length > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-widest">
              Photo {activePhotoIndex + 1} of {lead.photos.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {lead.photos && lead.photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar scroll-smooth snap-x bg-bg-base/50">
            {lead.photos.map((photo: string, index: number) => (
              <button
                key={index}
                type="button"
                onClick={() => setActivePhotoIndex(index)}
                className={cn(
                  "w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 snap-start transition active:scale-95",
                  activePhotoIndex === index 
                    ? "border-primary-main shadow-lg shadow-primary-main/15" 
                    : "border-border-subtle hover:border-text-secondary opacity-60 hover:opacity-100"
                )}
              >
                <img src={photo} className="w-full h-full object-cover" alt={`Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Info Card */}
      <div className="bg-surface-card p-5 rounded-2xl shadow-lg border border-border-subtle space-y-5">
        {/* Title & Price */}
        <div className="space-y-4">
          <div>
            <p className="text-text-secondary text-[9px] font-bold uppercase tracking-widest mb-1">Asset Registry</p>
            <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight leading-tight">{lead.vehicle}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-hover p-3 rounded-xl border border-border-subtle/30">
              <p className="text-text-secondary text-[9px] font-bold uppercase tracking-widest mb-1">Asking Price</p>
              <p className="text-xl font-black text-primary-main tracking-tight">{lead.user_asking_price_etb?.toLocaleString()} <span className="text-[10px] font-bold">ETB</span></p>
            </div>
            <div className="bg-surface-hover p-3 rounded-xl border border-border-subtle/30">
              <p className="text-text-secondary text-[9px] font-bold uppercase tracking-widest mb-1">Commission ({(commRate * 100).toFixed(1)}%)</p>
              <p className="text-xl font-black text-emerald-500 tracking-tight">{Math.round((lead.user_asking_price_etb || 0) * commRate).toLocaleString()} <span className="text-[10px] font-bold">ETB</span></p>
            </div>
          </div>
        </div>

        {/* Customer & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-3 bg-surface-hover p-3 rounded-xl border border-border-subtle/30">
            <div className="w-10 h-10 rounded-xl bg-surface-card border border-border-subtle/50 flex items-center justify-center text-text-muted shrink-0">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Customer</p>
              <p className="text-sm font-bold text-text-main truncate">{lead.customer}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-surface-hover p-3 rounded-xl border border-border-subtle/30">
            <div className="w-10 h-10 rounded-xl bg-surface-card border border-border-subtle/50 flex items-center justify-center text-text-muted shrink-0">
              <Phone size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Contact</p>
              <p className="text-sm font-bold text-text-main truncate">{lead.phone}</p>
            </div>
          </div>
        </div>

        {/* Description / Plate */}
        <div className="pt-3 border-t border-border-subtle space-y-3">
          <p className="text-text-secondary text-[9px] font-bold uppercase tracking-widest">Description & Plate</p>
          <div className="bg-surface-hover p-3 rounded-xl border border-border-subtle/30">
            <p className="text-sm font-medium text-text-main whitespace-pre-wrap leading-relaxed">{lead.plate || 'No description provided'}</p>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin size={13} className="text-text-muted shrink-0" />
            <span className="text-[11px] font-bold">{lead.location || 'Local Branch'}</span>
          </div>
        </div>

        {/* Vehicle Specifications */}
        {detailEntries.length > 0 && (
          <div className="pt-3 border-t border-border-subtle space-y-3">
            <p className="text-text-secondary text-[9px] font-bold uppercase tracking-widest">Vehicle Specifications</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {detailEntries.map(([key, value]) => {
                const meta = DETAIL_LABELS[key] || { label: key.replace(/_/g, ' ') };
                const displayValue = typeof value === 'number' ? value.toLocaleString() : String(value).replace(/_/g, ' ');
                return (
                  <div key={key} className="bg-surface-hover p-2.5 rounded-xl border border-border-subtle/30">
                    <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-0.5">{meta.label}</p>
                    <p className="text-[12px] font-bold text-text-main" title={displayValue}>{displayValue}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
