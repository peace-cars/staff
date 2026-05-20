import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, ChevronLeft, Save, AlertTriangle, Activity, 
  Phone, User, DollarSign, Image as ImageIcon, Shield, ArrowRight, CheckCircle2,
  XCircle, CarFront, Zap, FileText, Camera, Clock, Loader2, Trash2, ChevronRight,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import { BottomSheet } from '../components/ui/BottomSheet';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

interface InspectionPoint {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'pending';
  notes: string;
  photo?: string;
}

export default function InspectionForm() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const isDM = profile?.role === 'DISTRICT_MANAGER' || profile?.role === 'GENERAL_MANAGER';
  
  const [activeSheet, setActiveSheet] = useState<'exterior' | 'interior' | 'mechanical' | 'ev' | 'summary' | null>(null);
  
  // Detailed Checklist State
  const [checklist, setChecklist] = useState<Record<string, InspectionPoint[]>>({
    exterior: [
      { id: 'paint', label: 'Paint & Body Panels', status: 'pending', notes: '' },
      { id: 'glass', label: 'Windshield & Glass', status: 'pending', notes: '' },
      { id: 'lights', label: 'Headlights, Taillights & Indicators', status: 'pending', notes: '' },
      { id: 'tires', label: 'Tire Tread Depth & Sidewalls', status: 'pending', notes: '' },
      { id: 'wheels', label: 'Wheels & Rims Condition', status: 'pending', notes: '' },
      { id: 'bumpers', label: 'Bumpers & Fenders', status: 'pending', notes: '' },
      { id: 'mirrors', label: 'Side Mirrors & Antenna', status: 'pending', notes: '' },
      { id: 'undercarriage', label: 'Undercarriage & Rust Check', status: 'pending', notes: '' },
      { id: 'wipers', label: 'Wiper Blades & Washer System', status: 'pending', notes: '' },
      { id: 'exhaust', label: 'Exhaust Pipe & Emissions', status: 'pending', notes: '' },
    ],
    interior: [
      { id: 'seats', label: 'Seats & Upholstery', status: 'pending', notes: '' },
      { id: 'dashboard', label: 'Dashboard & Instrument Cluster', status: 'pending', notes: '' },
      { id: 'ac', label: 'Climate Control / AC & Heating', status: 'pending', notes: '' },
      { id: 'odometer', label: 'Odometer Verification & Mileage', status: 'pending', notes: '' },
      { id: 'infotainment', label: 'Infotainment & Audio System', status: 'pending', notes: '' },
      { id: 'windows', label: 'Power Windows & Locks', status: 'pending', notes: '' },
      { id: 'airbags', label: 'Airbag Indicators & Safety', status: 'pending', notes: '' },
      { id: 'carpet', label: 'Carpet, Headliner & Trim', status: 'pending', notes: '' },
      { id: 'seatbelts', label: 'Seatbelt Function & Condition', status: 'pending', notes: '' },
      { id: 'steering_wheel', label: 'Steering Wheel & Column', status: 'pending', notes: '' },
    ],
    mechanical: [
      { id: 'engine', label: 'Engine Performance & Sound', status: 'pending', notes: '' },
      { id: 'braking', label: 'Brake Pads, Discs & Lines', status: 'pending', notes: '' },
      { id: 'steering', label: 'Steering Response & Alignment', status: 'pending', notes: '' },
      { id: 'suspension', label: 'Suspension & Shock Absorbers', status: 'pending', notes: '' },
      { id: 'transmission', label: 'Transmission / Gearbox Shift', status: 'pending', notes: '' },
      { id: 'fluids', label: 'Oil, Coolant & Fluid Levels', status: 'pending', notes: '' },
      { id: 'leaks', label: 'Leak Inspection (Engine Bay & Under)', status: 'pending', notes: '' },
      { id: 'battery_mech', label: 'Battery Health & Terminals', status: 'pending', notes: '' },
      { id: 'clutch', label: 'Clutch / Torque Converter', status: 'pending', notes: '' },
      { id: 'drivetrain', label: 'Drivetrain & CV Joints', status: 'pending', notes: '' },
    ],
    ev: [
      { id: 'battery', label: 'High Voltage Battery Health (SOH)', status: 'pending', notes: '' },
      { id: 'charging', label: 'Charging Port & Cable', status: 'pending', notes: '' },
      { id: 'thermal', label: 'Battery Thermal Management', status: 'pending', notes: '' },
      { id: 'motor', label: 'Electric Motor & Inverter', status: 'pending', notes: '' },
      { id: 'regen', label: 'Regenerative Braking System', status: 'pending', notes: '' },
      { id: 'range', label: 'Range Test & Verification', status: 'pending', notes: '' },
      { id: 'onboard_charger', label: 'Onboard Charger Unit', status: 'pending', notes: '' },
      { id: 'hv_wiring', label: 'High Voltage Wiring Insulation', status: 'pending', notes: '' },
    ]
  });

  const [evData, setEvData] = useState({ batterySoh: '', range: '', chargerIncluded: true });
  const [finalNotes, setFinalNotes] = useState('');
  const [uploadingPointId, setUploadingPointId] = useState<string | null>(null);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isAppPhotoModalOpen, setIsAppPhotoModalOpen] = useState(false);
  const [targetAssignPoint, setTargetAssignPoint] = useState<{ category: string; pointId: string } | null>(null);

  // Auto-calculate scores from pass/fail ratios
  const calcScore = (cat: string): number => {
    const pts = checklist[cat];
    if (!pts) return 0;
    const evaluated = pts.filter(p => p.status !== 'pending');
    if (evaluated.length === 0) return 0;
    return Math.round((evaluated.filter(p => p.status === 'pass').length / pts.length) * 100);
  };

  // Scores state: auto-synced from checklist, but overridable via slider
  const [scores, setScores] = useState({ mechanical: 0, exterior: 0, interior: 0 });
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, boolean>>({ mechanical: false, exterior: false, interior: false });

  // Auto-sync scores from checklist unless manually overridden
  useEffect(() => {
    setScores(prev => ({
      mechanical: scoreOverrides.mechanical ? prev.mechanical : calcScore('mechanical'),
      exterior: scoreOverrides.exterior ? prev.exterior : calcScore('exterior'),
      interior: scoreOverrides.interior ? prev.interior : calcScore('interior'),
    }));
  }, [checklist]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lead, setLead] = useState<any>(null);
  const [commRate, setCommRate] = useState(0.01);
  const [fetchError, setFetchError] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    
    const headers = { 'Authorization': `Bearer ${session.access_token}` };

    // Fetch Staff Profile
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-performance/me`, { headers })
      .then(r => r.json())
      .then(setProfile)
      .catch(console.error);

    // Fetch Lead Details
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/trade-in-requests/${leadId}`, { headers })
      .then(r => {
        if (!r.ok) throw new Error(`Access denied (${r.status})`);
        return r.json();
      })
      .then(data => {
        setLead(data);
      })
      .catch(err => {
        console.error(err);
        setFetchError(err.message);
      });

    // Fetch Commission Rate
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/settings`, { headers })
      .then(r => r.json())
      .then(settings => {
        if (settings.evaluation_commission_percent) {
          setCommRate(parseFloat(settings.evaluation_commission_percent));
        }
      })
      .catch(console.error);
  }, [session, leadId]);

  const updatePoint = (category: string, id: string, updates: Partial<InspectionPoint>) => {
    setChecklist(prev => ({
      ...prev,
      [category]: prev[category].map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const handlePhotoUpload = async (category: string, pointId: string, file: File) => {
    if (!session) return;
    setUploadingPointId(pointId);
    setUploadError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const authHeader = { 'Authorization': `Bearer ${session.access_token}` };

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]); // strip data: prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${apiUrl}/storage/upload-base64`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: base64, // Wait, backend endpoint expects 'base64', not 'base64Data'
          base64: base64,
          filename: file.name || 'image.jpg',
          folder: `inspections/${leadId}`,
          bucket: 'vehicles'
        })
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { url } = await res.json();
      updatePoint(category, pointId, { photo: url });
    } catch (e: any) {
      console.error('[Upload]', e);
      setUploadError(e?.message || 'Photo upload failed. Please try again.');
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      setUploadingPointId(null);
    }
  };

  const handleSubmit = async (statusOverride?: string) => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/trade-in-requests/inspection`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          leadId,
          mechanical_score: scores.mechanical,
          exterior_score: scores.exterior,
          interior_score: scores.interior,
          checklist,
          ev_data: evData,
          final_notes: finalNotes
        })
      });

      const result = await res.json();
      
      if (!res.ok) {
        alert(result.message || 'Submission failed');
        return;
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#f59e0b', '#10b981']
      });

      alert('Evaluation submitted successfully. Syncing with registry...');
      setTimeout(() => navigate('/'), 2000);
    } catch (e) {
      console.error(e);
      alert('Network Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile && !fetchError) return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center gap-3">
      <div className="w-5 h-5 border-2 border-primary-main/10 border-t-primary-main rounded-full animate-spin" />
      <span className="text-text-muted font-bold uppercase tracking-widest text-[9px]">Synchronizing...</span>
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

  const isAssigned = lead?.assigned_staff_id === session?.user?.id;
  if (!lead || (!profile?.is_inspector_verified && !isDM && !isAssigned)) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-text-main mb-2">Registry Lock</h1>
        <p className="text-text-secondary text-sm mb-6">Unauthorized access detected. You are not assigned to this vehicle evaluation.</p>
        <button onClick={() => navigate('/')} className="bg-surface-hover text-text-secondary px-6 py-3 rounded-xl font-bold text-sm border border-border-subtle hover:bg-surface-hover/80 transition-all">Back</button>
      </div>
    );
  }

  const avg = (scores.mechanical + scores.exterior + scores.interior) / 3;
  const isHighRisk = avg < 40 || scores.mechanical < 50;

  const renderPoint = (category: string, point: InspectionPoint) => (
    <div key={point.id} className="rounded-2xl bg-surface-card border border-border-subtle/50 overflow-hidden shadow-sm">
      {/* Header row: label + pass/fail toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle/40">
        <p className="text-[11px] font-bold text-text-main uppercase tracking-wider flex-1 pr-3 leading-tight">{point.label}</p>
        <div className="flex rounded-xl overflow-hidden border border-border-subtle shadow-sm shrink-0">
          <button 
            onClick={() => updatePoint(category, point.id, { status: 'pass' })}
            className={cn(
              "h-10 px-4 flex items-center gap-1.5 text-[11px] font-bold transition-all",
              point.status === 'pass'
                ? "bg-emerald-500 text-white"
                : "bg-surface-hover text-text-muted hover:bg-emerald-500/10 hover:text-emerald-500"
            )}
          >
            <CheckCircle2 size={14} />
            <span>Pass</span>
          </button>
          <div className="w-px bg-border-subtle" />
          <button 
            onClick={() => updatePoint(category, point.id, { status: 'fail' })}
            className={cn(
              "h-10 px-4 flex items-center gap-1.5 text-[11px] font-bold transition-all",
              point.status === 'fail'
                ? "bg-red-500 text-white"
                : "bg-surface-hover text-text-muted hover:bg-red-500/10 hover:text-red-500"
            )}
          >
            <XCircle size={14} />
            <span>Fail</span>
          </button>
        </div>
      </div>

      {/* Notes input */}
      <div className="px-4 py-3">
        <input 
          placeholder="Observation notes..."
          value={point.notes}
          onChange={(e) => updatePoint(category, point.id, { notes: e.target.value })}
          className="w-full bg-bg-secondary border border-border-subtle/40 rounded-xl px-3 py-2.5 text-[12px] text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary-main/60 transition-all"
        />
      </div>

      {/* Photo section */}
      <div className="px-4 pb-4">
        {point.photo ? (
          <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border-subtle group">
            <img src={point.photo} className="w-full h-full object-cover" alt="inspection photo" />
            <button
              onClick={() => updatePoint(category, point.id, { photo: undefined })}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
            >
              <Trash2 size={14} />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Photo attached</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Camera capture */}
            <label className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-border-subtle bg-surface-hover text-text-muted text-[11px] font-bold transition-all cursor-pointer",
              uploadingPointId === point.id ? "opacity-50 pointer-events-none" : "hover:border-primary-main/50 hover:text-primary-main active:scale-95"
            )}>
              {uploadingPointId === point.id ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              <span>Camera</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(category, point.id, f); }}
                disabled={!!uploadingPointId}
              />
            </label>

            {/* Gallery picker */}
            <label className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-border-subtle bg-surface-hover text-text-muted text-[11px] font-bold transition-all cursor-pointer",
              uploadingPointId === point.id ? "opacity-50 pointer-events-none" : "hover:border-primary-main/50 hover:text-primary-main active:scale-95"
            )}>
              {uploadingPointId === point.id ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              <span>Gallery</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(category, point.id, f); }}
                disabled={!!uploadingPointId}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-base flex flex-col pb-24 relative font-sans text-text-main transition-colors duration-300">
      {/* Upload Error Toast */}
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

      {/* Dynamic Mobile Header */}
      <header className="sticky top-0 bg-surface-card/90 backdrop-blur-xl border-b border-border-subtle z-50 px-5 py-4 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-surface-hover text-text-secondary hover:bg-surface-hover/80 transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-[11px] font-black text-text-main uppercase tracking-[0.1em]">{lead.vehicle}</h1>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-text-secondary text-[8px] font-bold uppercase tracking-widest">Live Appraisal • {lead.location}</p>
          </div>
        </div>
      </header>

      {/* Category Summary Cards - Facebook Marketplace Side-by-Side style layout */}
      <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Premium Image Gallery & Vehicle Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-card overflow-hidden rounded-3xl shadow-xl border border-border-subtle p-4 space-y-4">
              {/* Main Photo Display */}
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
                
                {/* Overlay details */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-widest z-10">
                  #{leadId?.substring(0,6)}
                </div>
                
                {lead.photos && lead.photos.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => setActivePhotoIndex(prev => (prev - 1 + lead.photos.length) % lead.photos.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-black/70 transition active:scale-90"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    {/* Next Button */}
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

              {/* Thumbnails Row */}
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
            </div>

            {/* Vehicle Details Card */}
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

          {/* RIGHT COLUMN: Appraisals, Categories & Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Estimated Commission */}
            <div className="bg-gradient-to-r from-primary-main to-primary-main/80 rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <DollarSign size={80} />
               </div>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1 relative z-10">Est. Evaluation Commission</p>
               <h3 className="text-3xl font-black tracking-tighter relative z-10">
                 {Math.floor((lead.user_asking_price_etb || 0) * commRate).toLocaleString()}
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
          
        </div>
      </main>

      {/* Bottom Sheets for Progressive Disclosure */}
      
      {/* Dynamic Checklist Sheet */}
      <BottomSheet 
        isOpen={activeSheet === 'exterior' || activeSheet === 'interior' || activeSheet === 'mechanical'}
        onClose={() => setActiveSheet(null)}
        title={activeSheet ? activeSheet.charAt(0).toUpperCase() + activeSheet.slice(1) + ' Checklist' : ''}
        height="full"
      >
        {activeSheet && activeSheet !== 'summary' && activeSheet !== 'ev' && (
          <div className="space-y-4 pb-20">
            {/* Auto Score Indicator */}
            <div className="flex items-center gap-3 p-3 bg-surface-hover border border-border-subtle rounded-2xl mb-6">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-surface-card border border-border-subtle shadow-sm",
                (scores as any)[activeSheet] > 70 ? "text-emerald-500" : (scores as any)[activeSheet] > 40 ? "text-amber-500" : "text-red-500"
              )}>{(scores as any)[activeSheet]}%</div>
              <div>
                <p className="text-[10px] font-bold text-text-main">Computed Score</p>
                <p className="text-[9px] text-text-secondary">
                  {checklist[activeSheet].filter(p=>p.status==='pass').length} pass / {checklist[activeSheet].filter(p=>p.status==='fail').length} fail
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {checklist[activeSheet].map(point => renderPoint(activeSheet, point))}
            </div>
            
            <div className="pt-8 space-y-4">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-2">Manual Grade Override</p>
              <div className="bg-surface-hover p-6 rounded-3xl border border-border-subtle">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-text-main">{activeSheet.toUpperCase()} GRADE</span>
                    <span className="text-lg font-black text-primary-main">{(scores as any)[activeSheet]}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={(scores as any)[activeSheet]} 
                    onChange={e => {
                      setScoreOverrides(prev => ({ ...prev, [activeSheet]: true }));
                      setScores(prev => ({...prev, [activeSheet]: parseInt(e.target.value)}));
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

      {/* EV Diagnostics Sheet */}
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
            {checklist.ev.map(point => renderPoint('ev', point))}
          </div>

          <button 
            onClick={() => setActiveSheet(null)}
            className="w-full mt-6 py-4 rounded-2xl bg-primary-main text-white font-bold text-sm hover:bg-primary-main/90 active:scale-95 transition-transform"
          >
            Save EV Data
          </button>
        </div>
      </BottomSheet>

      {/* Summary / Finalize Sheet */}
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

      {/* Persistent Navigation Context */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-card/90 backdrop-blur-xl border-t border-border-subtle p-4 z-40 md:hidden flex justify-center gap-10">
         <div className="flex flex-col items-center">
            <Activity size={18} className={activeSheet === 'mechanical' ? 'text-primary-main' : 'text-text-muted'} />
            <span className="text-[8px] font-black uppercase mt-1 text-text-secondary">Score</span>
         </div>
         <div className="flex flex-col items-center">
            <ShieldCheck size={18} className={activeSheet === 'exterior' ? 'text-primary-main' : 'text-text-muted'} />
            <span className="text-[8px] font-black uppercase mt-1 text-text-secondary">Armor</span>
         </div>
         <div className="flex flex-col items-center">
            <Zap size={18} className={activeSheet === 'ev' ? 'text-primary-main' : 'text-text-muted'} />
            <span className="text-[8px] font-black uppercase mt-1 text-text-secondary">Power</span>
         </div>
      </div>

      {/* Dynamic Image Zoom/Detail Modal */}
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

      {/* Select from Appraisal Images Modal */}
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
            {/* Modal Header */}
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

            {/* Photos Grid */}
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

function Badge({ children, variant, className }: any) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
      variant === 'primary' ? 'bg-primary-subtle text-primary-main border border-primary-main/20' : 'bg-surface-hover text-text-secondary border border-border-subtle',
      className
    )}>
      {children}
    </span>
  );
}
