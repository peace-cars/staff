import { cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { ShieldAlert, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { InspectionPointItem } from './InspectionPointItem';
import type { InspectionPoint } from './useInspectionState';

interface InspectionSheetsProps {
  activeSheet: 'exterior' | 'interior' | 'mechanical' | 'ev' | 'summary' | null;
  setActiveSheet: (sheet: 'exterior' | 'interior' | 'mechanical' | 'ev' | 'summary' | null) => void;
  scores: any;
  checklist: Record<string, InspectionPoint[]>;
  evData: any;
  setEvData: (data: any) => void;
  finalNotes: string;
  setFinalNotes: (notes: string) => void;
  setScoreOverrides: (updater: any) => void;
  setScores: (updater: any) => void;
  updatePoint: (category: string, id: string, updates: Partial<InspectionPoint>) => void;
  handleSubmit: (status?: string) => void;
  isSubmitting: boolean;
  isDM: boolean;
  leadId: string;
  setUploadError: (err: string | null) => void;
}

export function InspectionSheets({
  activeSheet,
  setActiveSheet,
  scores,
  checklist,
  evData,
  setEvData,
  finalNotes,
  setFinalNotes,
  setScoreOverrides,
  setScores,
  updatePoint,
  handleSubmit,
  isSubmitting,
  isDM,
  leadId,
  setUploadError
}: InspectionSheetsProps) {
  const avg = (scores.mechanical + scores.exterior + scores.interior) / 3;

  return (
    <>
      <BottomSheet 
        isOpen={activeSheet === 'exterior' || activeSheet === 'interior' || activeSheet === 'mechanical'}
        onClose={() => setActiveSheet(null)}
        title={activeSheet ? activeSheet.charAt(0).toUpperCase() + activeSheet.slice(1) + ' Checklist' : ''}
        height="full"
      >
        {activeSheet && activeSheet !== 'summary' && activeSheet !== 'ev' && (
          <div className="space-y-4 pb-20">
            <div className="flex items-center gap-3 p-3 bg-surface-hover border border-border-subtle rounded-2xl mb-6">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-surface-card border border-border-subtle shadow-sm",
                scores[activeSheet] > 70 ? "text-emerald-500" : scores[activeSheet] > 40 ? "text-amber-500" : "text-red-500"
              )}>{scores[activeSheet]}%</div>
              <div>
                <p className="text-[10px] font-bold text-text-main">Computed Score</p>
                <p className="text-[9px] text-text-secondary">
                  {checklist[activeSheet].filter(p=>p.status==='pass').length} pass / {checklist[activeSheet].filter(p=>p.status==='fail').length} fail
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {checklist[activeSheet].map(point => (
                <InspectionPointItem 
                  key={point.id} 
                  category={activeSheet} 
                  point={point} 
                  leadId={leadId} 
                  updatePoint={updatePoint}
                  setUploadError={setUploadError}
                />
              ))}
            </div>
            
            <div className="pt-8 space-y-4">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-2">Manual Grade Override</p>
              <div className="bg-surface-hover p-6 rounded-3xl border border-border-subtle">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-text-main">{activeSheet.toUpperCase()} GRADE</span>
                    <span className="text-lg font-black text-primary-main">{scores[activeSheet]}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={scores[activeSheet]} 
                    onChange={e => {
                      setScoreOverrides((prev: any) => ({ ...prev, [activeSheet]: true }));
                      setScores((prev: any) => ({...prev, [activeSheet]: parseInt(e.target.value)}));
                    }}
                    className="w-full accent-primary-main h-1.5 bg-border-subtle rounded-full appearance-none cursor-pointer"
                  />
              </div>
            </div>

            <button 
              onClick={() => setActiveSheet(null)}
              className="w-full mt-6 py-4 rounded-2xl bg-primary-main text-white font-bold text-sm hover:bg-primary-main/90 active:scale-95 transition-transform"
            >
              Done
            </button>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'ev'}
        onClose={() => setActiveSheet(null)}
        title="EV Diagnostics"
        height="full"
      >
        <div className="space-y-6 pb-20">
          <div className="bg-primary-subtle p-6 rounded-3xl border border-primary-main/20 space-y-6">
              <div className="flex items-center gap-4 border-b border-primary-main/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-main text-white flex items-center justify-center shadow-lg">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-main tracking-tight">Battery Telemetry</h3>
                  <p className="text-[9px] text-primary-main font-bold uppercase tracking-widest">State of Health Verification</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Battery State of Health (%)</label>
                  <input 
                    type="number" 
                    value={evData.batterySoh}
                    onChange={e => setEvData({...evData, batterySoh: e.target.value})}
                    placeholder="e.g. 98.5"
                    className="w-full bg-surface-card border border-border-subtle rounded-2xl py-4 px-5 text-text-main font-bold text-lg focus:outline-none focus:border-primary-main transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Verified Range (KM)</label>
                  <input 
                    type="number" 
                    value={evData.range}
                    onChange={e => setEvData({...evData, range: e.target.value})}
                    placeholder="e.g. 420"
                    className="w-full bg-surface-card border border-border-subtle rounded-2xl py-4 px-5 text-text-main font-bold text-lg focus:outline-none focus:border-primary-main transition-all shadow-sm"
                  />
                </div>
              </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {checklist.ev?.map(point => (
              <InspectionPointItem 
                key={point.id} 
                category="ev" 
                point={point} 
                leadId={leadId} 
                updatePoint={updatePoint}
                setUploadError={setUploadError}
              />
            ))}
          </div>

          <button 
            onClick={() => setActiveSheet(null)}
            className="w-full mt-6 py-4 rounded-2xl bg-primary-main text-white font-bold text-sm hover:bg-primary-main/90 active:scale-95 transition-transform"
          >
            Save EV Data
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'summary'}
        onClose={() => setActiveSheet(null)}
        title="Finalize Report"
        height="full"
      >
        <div className="space-y-6 pb-20">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-xl",
                avg > 70 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : avg > 40 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-red-500/10 border-red-500/20 text-red-500"
              )}>
                <p className="text-3xl font-black">{Math.round(avg)}%</p>
              </div>
              <div>
                <h3 className="text-lg font-black text-text-main tracking-tight">Total Health Score</h3>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Calculated from all categories</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Inspector's Final Summary</label>
              <textarea 
                value={finalNotes}
                onChange={e => setFinalNotes(e.target.value)}
                placeholder="Detailed summary of vehicle condition, required immediate maintenance, and pricing recommendations..."
                className="w-full bg-surface-hover border border-border-subtle rounded-3xl p-5 text-sm min-h-[120px] focus:outline-none focus:border-primary-main text-text-main transition-all resize-none placeholder:text-text-muted"
              />
            </div>

            <div className="pt-4 border-t border-border-subtle space-y-4">
                <button
                  onClick={() => handleSubmit('review_pending')}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-primary-main text-white font-bold text-sm hover:bg-primary-main/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                  Submit for DM Review
                </button>
                
                {isDM && (
                  <button
                    onClick={() => handleSubmit('approved')}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    Approve & Acquire Instantly
                  </button>
                )}
            </div>
        </div>
      </BottomSheet>
    </>
  );
}
