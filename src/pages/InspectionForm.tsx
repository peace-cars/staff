import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, ChevronLeft, AlertTriangle, Activity, ShieldCheck, Zap, Loader2, X, Image as ImageIcon, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useInspectionState } from '../components/inspection/useInspectionState';
import { InspectionVehicleCard } from '../components/inspection/InspectionVehicleCard';
import { InspectionCategories } from '../components/inspection/InspectionCategories';
import { InspectionSheets } from '../components/inspection/InspectionSheets';
import { CheckCircle2 } from 'lucide-react';

export default function InspectionForm() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  
  const [activeSheet, setActiveSheet] = useState<'exterior' | 'interior' | 'mechanical' | 'ev' | 'summary' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);
  const [isAppPhotoModalOpen, setIsAppPhotoModalOpen] = useState(false);
  const [targetAssignPoint, setTargetAssignPoint] = useState<{ category: string; pointId: string } | null>(null);

  const {
    profile, isDM, checklist, evData, setEvData, finalNotes, setFinalNotes,
    scores, setScores, scoreOverrides, setScoreOverrides, isSubmitting, lead,
    commRate, fetchError, restoredDraft, setRestoredDraft, syncStatus,
    updatePoint, handleSubmit
  } = useInspectionState(leadId);

  // Wait for both profile and lead to load (or a fetchError to be set) before rendering.
  // Previously only gated on !profile, causing a "Registry Lock" flash if profile arrived
  // before the lead fetch completed.
  if ((!profile || !lead) && !fetchError) return (
    <div className="min-h-screen bg-bg-base flex flex-col p-6 animate-pulse">
      <div className="h-10 w-full max-w-[200px] bg-border-subtle/40 rounded-xl mb-6" />
      <div className="h-64 w-full bg-border-subtle/30 rounded-[24px] mb-4" />
      <div className="h-12 w-full bg-border-subtle/30 rounded-2xl mb-2" />
      <div className="h-12 w-full bg-border-subtle/30 rounded-2xl mb-2" />
      <div className="h-12 w-full bg-border-subtle/30 rounded-2xl mb-2" />
    </div>
  );

  if (fetchError) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-text-main mb-2">Access Restricted</h1>
        <p className="text-text-secondary text-sm mb-6">{fetchError}</p>
        <button onClick={() => navigate('/')} className="bg-surface-hover text-text-secondary px-6 py-3 rounded-xl font-bold text-sm border border-border-subtle hover:bg-surface-hover/80 transition-all">Back</button>
      </div>
    );
  }

  // Backend authorization is the source of truth: if the request for the lead succeeded
  // (no fetchError), the server already verified access via canAccessTradeIn().
  // Staff can access leads via direct assignment (assigned_staff_id) OR branch-level scope.
  // A redundant frontend-only check here was causing false "Registry Lock" for branch-scoped staff.
  if (!lead) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-text-main mb-2">Registry Lock</h1>
        <p className="text-text-secondary text-sm mb-6">Vehicle evaluation data could not be loaded. Please try again or contact your branch manager.</p>
        <button onClick={() => navigate('/')} className="bg-surface-hover text-text-secondary px-6 py-3 rounded-xl font-bold text-sm border border-border-subtle hover:bg-surface-hover/80 transition-all">Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col pb-24 relative font-sans text-text-main transition-colors duration-300">
      {uploadError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white text-[12px] font-bold px-4 py-3 rounded-2xl shadow-lg border border-red-500/50 flex items-center gap-2 max-w-sm w-[90%] justify-between animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {restoredDraft && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white text-[12px] font-bold px-4 py-3 rounded-2xl shadow-lg border border-indigo-500/50 flex items-center gap-2 max-w-sm w-[90%] justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>Resumed from local offline draft.</span>
          </div>
          <button onClick={() => setRestoredDraft(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {syncStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-[12px] font-bold px-4 py-3 rounded-2xl shadow-lg border border-slate-700 flex items-center gap-2 max-w-sm w-[90%] justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="shrink-0 animate-spin text-indigo-400" />
            <span>{syncStatus}</span>
          </div>
        </div>
      )}

      <header className="sticky top-0 bg-surface-card/90 backdrop-blur-xl border-b border-border-subtle z-50 px-5 py-4 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-surface-hover text-text-secondary hover:bg-surface-hover/80 transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-[11px] font-black text-text-main uppercase tracking-[0.1em]">{lead.vehicle}</h1>
          <div className="flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", navigator.onLine ? "bg-emerald-500" : "bg-amber-500")} />
            <p className="text-text-secondary text-[8px] font-bold uppercase tracking-widest">
              {navigator.onLine ? 'Live Appraisal' : 'Offline Draft Mode'} • {lead.location}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-0 py-4 sm:px-2 md:px-4 md:py-6 w-full mx-auto">
        <div className="flex flex-col lg:flex-row lg:gap-4 gap-4 items-start">
          <div className="w-full lg:w-7/12">
            <InspectionVehicleCard leadId={leadId} lead={lead} setSelectedGalleryPhoto={setSelectedGalleryPhoto} commRate={commRate} />
          </div>
          <div className="w-full lg:w-5/12 lg:sticky lg:top-20">
            <InspectionCategories lead={lead} commRate={commRate} scores={scores} checklist={checklist} setActiveSheet={setActiveSheet} />
          </div>
        </div>
      </main>

      <InspectionSheets 
        activeSheet={activeSheet}
        setActiveSheet={setActiveSheet}
        scores={scores}
        checklist={checklist}
        evData={evData}
        setEvData={setEvData}
        finalNotes={finalNotes}
        setFinalNotes={setFinalNotes}
        setScoreOverrides={setScoreOverrides}
        setScores={setScores}
        updatePoint={updatePoint}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isDM={isDM}
        leadId={leadId!}
        setUploadError={setUploadError}
      />



      {selectedGalleryPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedGalleryPhoto(null)}
        >
          <div className="absolute top-4 right-4 flex gap-3">
            <button 
              onClick={() => setSelectedGalleryPhoto(null)}
              className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-95 transition-all"
            >
              ✕
            </button>
          </div>
          <div className="max-w-3xl w-full max-h-[75vh] flex items-center justify-center select-none" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedGalleryPhoto} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" 
              alt="Zoomed Appraisal Asset"
            />
          </div>
          <div className="absolute bottom-10 text-center text-white/60 text-xs font-bold uppercase tracking-widest select-none">
            Gesture & Zoom Enabled
          </div>
        </div>
      )}

      {isAppPhotoModalOpen && targetAssignPoint && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-end justify-center animate-in fade-in duration-300"
          onClick={() => {
            setIsAppPhotoModalOpen(false);
            setTargetAssignPoint(null);
          }}
        >
          <div 
            className="w-full max-w-lg bg-surface-card rounded-t-[2.5rem] p-6 space-y-5 border-t border-border-subtle shadow-2xl flex flex-col max-h-[70vh] animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div>
                <h3 className="text-sm font-bold text-text-main">Appraisal Media Library</h3>
                <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider mt-1">Select an existing photo to assign to checklist</p>
              </div>
              <button 
                onClick={() => {
                  setIsAppPhotoModalOpen(false);
                  setTargetAssignPoint(null);
                }}
                className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary hover:text-text-main transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {lead.photos && lead.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {lead.photos.map((photo: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        updatePoint(targetAssignPoint.category, targetAssignPoint.pointId, { photo });
                        setIsAppPhotoModalOpen(false);
                        setTargetAssignPoint(null);
                      }}
                      className="aspect-square rounded-xl overflow-hidden border border-border-subtle hover:border-primary-main focus:border-primary-main transition-all group relative active:scale-95"
                    >
                      <img src={photo} className="w-full h-full object-cover group-hover:scale-105 transition-transform animate-in fade-in duration-200" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold uppercase tracking-widest">
                        Select
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        #{index + 1}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-text-muted">
                  <ImageIcon size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No appraisal photos available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
