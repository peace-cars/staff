import React from 'react';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { 
  CheckCircle2, CarFront, Search, Settings, FileText,
  ShieldCheck, AlertTriangle, User, ChevronRight, MapPin, Phone,
  DollarSign, Tag, Calendar, ClipboardCheck, XCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface InspectionReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
}

export const InspectionReportView: React.FC<InspectionReportViewProps> = ({
  isOpen,
  onClose,
  lead
}) => {
  if (!lead) return null;

  const inspection = Array.isArray(lead.inspections) ? lead.inspections[0] : lead.inspections;
  const checklist = inspection?.checklist || {};
  const inspector = inspection?.profiles || {};
  const hasInspection = !!inspection;
  const details = lead.vehicleDetails || {};

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);

  const categories = React.useMemo(() => [
    { id: '1', name: 'Exterior & Body', icon: CarFront, data: checklist.exterior || [] },
    { id: '2', name: 'Interior & Cabin', icon: Search, data: checklist.interior || [] },
    { id: '3', name: 'Mechanical & Drivetrain', icon: Settings, data: checklist.mechanical || [] },
  ], [checklist]);

  const formatEvalDate = () => {
    const targetDate = inspection?.created_at || lead.created_at;
    if (!targetDate) return 'Pending';
    try {
      const date = new Date(targetDate);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Date Error';
    }
  };

  const evalDate = formatEvalDate();
  const leadIdSafe = lead.id?.substring(0, 8).toUpperCase() || 'UNKNOWN';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Vehicle Appraisal Report"
      height="full"
    >
      <div className="space-y-6 pb-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
           <div>
              <p className="text-[12px] font-medium text-text-muted">Reference ID</p>
              <p className="text-[14px] font-mono font-semibold text-text-main">PCS-{leadIdSafe}</p>
           </div>
        </div>

        {/* SECTION 1: VEHICLE OVERVIEW */}
        <div className="space-y-4">
           <h2 className="text-[15px] font-semibold text-text-main border-b border-border-subtle pb-2 flex items-center gap-2">
              <Tag size={16} className="text-primary-main" /> 1. Vehicle Overview
           </h2>

           <div className="flex flex-col gap-4">
              {/* Visual Identity */}
              <div className="space-y-3">
                 <div className="relative aspect-[4/3] bg-bg-secondary rounded-2xl overflow-hidden border border-border-subtle">
                    {lead.photos && lead.photos.length > 0 ? (
                      <img 
                        src={lead.photos[activePhotoIdx] || lead.photos[0]} 
                        alt={lead.vehicle} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted opacity-40">
                        <CarFront size={40} />
                        <span className="text-[14px] font-medium">No Image</span>
                      </div>
                    )}
                 </div>
                 {lead.photos && lead.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {lead.photos.map((photo: string, idx: number) => (
                        <button 
                          key={idx} 
                          onClick={() => setActivePhotoIdx(idx)}
                          className={cn(
                            "w-16 aspect-[4/3] rounded-lg overflow-hidden border-2 shrink-0 transition-all",
                            idx === activePhotoIdx ? "border-primary-main" : "border-transparent opacity-60"
                          )}
                        >
                          <img src={photo} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                 )}
              </div>

              {/* Core Attributes */}
               <div className="grid grid-cols-2 gap-y-4 gap-x-4 bg-bg-secondary p-4 rounded-2xl border border-border-subtle">
                 {[
                   { label: 'Date', value: evalDate, icon: <Calendar size={14}/> },
                   { label: 'Model', value: lead.vehicle || lead.vehicle_make_model || 'Unknown', icon: <CarFront size={14}/> },
                   { label: 'Customer', value: lead.customer || 'Unassigned', icon: <User size={14}/> },
                   { label: 'Phone', value: lead.phone || lead.contactPhone || 'No phone', icon: <Phone size={14}/> },
                   { label: 'Plate', value: lead.plate || details.plate_code || 'Not Recorded', icon: <ClipboardCheck size={14}/> },
                   { label: 'Location', value: lead.location || 'Central', icon: <MapPin size={14}/> },
                 ].map(item => (
                   <div key={item.label}>
                      <p className="text-[11px] font-medium text-text-muted flex items-center gap-1 mb-0.5">{item.icon} {item.label}</p>
                      <p className="text-[13px] font-semibold text-text-main truncate">{item.value}</p>
                   </div>
                 ))}
               </div>
           </div>
        </div>

        {/* SECTION 3: INSPECTION RESULTS */}
        <div className="space-y-4">
           <h2 className="text-[15px] font-semibold text-text-main border-b border-border-subtle pb-2 flex items-center gap-2">
              <Search size={16} className="text-primary-main" /> 2. Technical Inspection
           </h2>

           {!hasInspection ? (
              <div className="bg-warning/10 border border-warning/20 rounded-2xl p-6 text-center flex flex-col items-center gap-2">
                 <AlertTriangle size={24} className="text-warning" />
                 <h3 className="text-[15px] font-bold text-warning">Inspection Pending</h3>
              </div>
           ) : (
              <div className="space-y-4">
                  {/* Inspector Info */}
                 <div className="flex items-center gap-3 bg-bg-secondary p-3 rounded-xl border border-border-subtle">
                    <div className="w-10 h-10 bg-surface-card border border-border-subtle rounded-full flex items-center justify-center text-text-muted">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-text-muted">Certified Inspector</p>
                      <p className="text-[14px] font-semibold text-text-main">{inspector.full_name || 'Staff Technician'}</p>
                    </div>
                 </div>

                  {/* Categories */}
                 <div className="flex flex-col gap-3">
                   {categories.map(cat => (
                     <div key={cat.id} className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 bg-bg-secondary px-3 py-2 border-b border-border-subtle">
                          <cat.icon size={16} className="text-text-muted" />
                          <h3 className="text-[14px] font-semibold text-text-main">{cat.name}</h3>
                        </div>

                        <div className="p-0">
                          {cat.data && cat.data.length > 0 ? (
                            <table className="w-full text-left text-[12px]">
                              <tbody>
                                {cat.data.map((point: any, idx: number) => (
                                  <tr key={point.id || idx} className="border-b border-border-subtle last:border-0">
                                    <td className="py-2 px-3 font-medium text-text-main w-1/2">{point.label}</td>
                                    <td className="py-2 px-3 text-center w-24">
                                      {point.status === 'pass' ? (
                                        <span className="flex items-center text-success"><CheckCircle2 size={12} className="mr-1" /> Pass</span>
                                      ) : (
                                        <span className="flex items-center text-error-main"><XCircle size={12} className="mr-1" /> Defect</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-3 text-center text-text-muted text-[12px]">No data recorded.</div>
                          )}
                        </div>
                     </div>
                   ))}
                 </div>

                  {/* Final Verdict */}
                 <div className="bg-primary-main/10 border border-primary-main/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                       <ShieldCheck size={18} className="text-primary-main" />
                       <h3 className="text-[14px] font-semibold text-text-main">Final Verdict</h3>
                    </div>
                    <p className="text-text-main text-[13px] font-medium italic">
                      "{inspection.final_notes || "Evaluation completed."}"
                    </p>
                 </div>
              </div>
           )}
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="outline" className="w-full" onClick={onClose}>
             Close Report
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
