import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, ChevronLeft, Save, AlertTriangle, Activity, 
  Phone, User, DollarSign, Image as ImageIcon, Shield, ArrowRight, CheckCircle2,
  XCircle, CarFront, Zap, FileText, Camera, Clock, Loader2, Trash2, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import { BottomSheet } from '../components/ui/BottomSheet';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    if (!session) return;
    
    const headers = { 'Authorization': `Bearer ${session.access_token}` };

    // Fetch Staff Profile
    fetch('http://localhost:3000/staff-performance/me', { headers })
      .then(r => r.json())
      .then(setProfile)
      .catch(console.error);

    // Fetch Lead Details
    fetch(`http://localhost:3000/trade-in-requests/${leadId}`, { headers })
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
    fetch('http://localhost:3000/settings', { headers })
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
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'vehicles');
      fd.append('folder', `inspections/${leadId}`);
      const res = await fetch('http://localhost:3000/storage/upload', {
        method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: fd
      });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      updatePoint(category, pointId, { photo: url });
    } catch (e) { console.error(e); alert('Photo upload failed'); }
    finally { setUploadingPointId(null); }
  };

  const handleSubmit = async (statusOverride?: string) => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/trade-in-requests/inspection', {
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
    <div className="min-h-screen bg-white flex items-center justify-center gap-3">
      <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Synchronizing...</span>
    </div>
  );

  if (fetchError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
        <p className="text-slate-400 text-sm mb-6">{fetchError}</p>
        <button onClick={() => navigate('/')} className="bg-slate-50 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm border border-slate-100">Back</button>
      </div>
    );
  }

  const isAssigned = lead?.assigned_staff_id === session?.user?.id;
  if (!lead || (!profile?.is_inspector_verified && !isDM && !isAssigned)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Registry Lock</h1>
        <p className="text-slate-400 text-sm mb-6">Unauthorized access detected. You are not assigned to this vehicle evaluation.</p>
        <button onClick={() => navigate('/')} className="bg-slate-50 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm border border-slate-100">Back</button>
      </div>
    );
  }

  const avg = (scores.mechanical + scores.exterior + scores.interior) / 3;
  const isHighRisk = avg < 40 || scores.mechanical < 50;

  const renderPoint = (category: string, point: InspectionPoint) => (
    <div key={point.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{point.label}</p>
        <div className="flex bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
          <button 
            onClick={() => updatePoint(category, point.id, { status: 'pass' })}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all",
              point.status === 'pass' ? "bg-emerald-500 text-white" : "text-slate-300 hover:bg-slate-50"
            )}
          >
            <CheckCircle2 size={16} />
          </button>
          <button 
            onClick={() => updatePoint(category, point.id, { status: 'fail' })}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all",
              point.status === 'fail' ? "bg-red-500 text-white" : "text-slate-300 hover:bg-slate-50"
            )}
          >
            <XCircle size={16} />
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <input 
          placeholder="Observation notes..."
          value={point.notes}
          onChange={(e) => updatePoint(category, point.id, { notes: e.target.value })}
          className="flex-1 bg-white/80 border border-slate-100 rounded-lg p-2 text-[10px] font-medium focus:outline-none focus:border-indigo-300"
        />
        <div className="w-14 h-10 shrink-0">
          {point.photo ? (
            <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-200 group">
              <img src={point.photo} className="w-full h-full object-cover" />
              <button onClick={() => updatePoint(category, point.id, { photo: undefined })} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"><Trash2 size={12} /></button>
            </div>
          ) : (
            <div className="flex gap-0.5 h-full">
              <label className="flex-1 h-full rounded-l-lg border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:text-indigo-500 cursor-pointer bg-white">
                {uploadingPointId === point.id ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={e => { const f=e.target.files?.[0]; if(f) handlePhotoUpload(category, point.id, f); }} disabled={!!uploadingPointId} />
              </label>
              <label className="flex-1 h-full rounded-r-lg border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:text-indigo-500 cursor-pointer bg-white">
                {uploadingPointId === point.id ? <Loader2 size={10} className="animate-spin" /> : <ImageIcon size={10} />}
                <input type="file" className="hidden" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f) handlePhotoUpload(category, point.id, f); }} disabled={!!uploadingPointId} />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col pb-24 relative font-sans">
      {/* Dynamic Mobile Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50 px-5 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em]">{lead.vehicle}</h1>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Live Appraisal • {lead.location}</p>
          </div>
        </div>
      </header>

      {/* Category Summary Cards - Mobile First Layout */}
      <main className="flex-1 p-5 w-full max-w-lg mx-auto space-y-4">
        
        {/* Intel Card */}
        <div className="bg-white p-0 overflow-hidden rounded-3xl shadow-lg border border-slate-100">
           <div className="h-40 bg-slate-100 relative">
              {lead.photos?.[0] ? (
                <img src={lead.photos[0]} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageIcon size={48} />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[8px] font-bold px-2 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                #{leadId?.substring(0,6)}
              </div>
           </div>
           <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                 <div>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mb-0.5">Asset Registry</p>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">{lead.vehicle}</h2>
                 </div>
                 <div className="text-right">
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mb-0.5">Asking Price</p>
                    <p className="text-base font-black text-indigo-600 tracking-tight">{lead.user_asking_price_etb?.toLocaleString()} <span className="text-[8px]">ETB</span></p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                       <User size={14} />
                    </div>
                    <div>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
                       <p className="text-[10px] font-bold text-slate-900">{lead.customer}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                       <Phone size={14} />
                    </div>
                    <div>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Contact</p>
                       <p className="text-[10px] font-bold text-slate-900">{lead.phone}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Estimated Commission */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-6 text-center text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign size={64} />
           </div>
           <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1 relative z-10">Est. Evaluation Commission</p>
           <h3 className="text-3xl font-black tracking-tighter relative z-10">
             {Math.floor((lead.user_asking_price_etb || 0) * commRate).toLocaleString()}
             <span className="text-xs font-bold ml-1 opacity-60">ETB</span>
           </h3>
        </div>

        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pt-4 pl-2">Inspection Categories</h3>

        {/* Category Cards */}
        {[
          { id: 'exterior', label: 'Exterior', icon: <CarFront size={20} />, score: scores.exterior, total: checklist.exterior.length },
          { id: 'interior', label: 'Interior', icon: <ShieldCheck size={20} />, score: scores.interior, total: checklist.interior.length },
          { id: 'mechanical', label: 'Mechanical', icon: <Activity size={20} />, score: scores.mechanical, total: checklist.mechanical.length },
          { id: 'ev', label: 'EV Diagnostics', icon: <Zap size={20} />, score: null, total: checklist.ev.length },
        ].map(cat => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSheet(cat.id as any)}
            className="w-full bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                {cat.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">{cat.label}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{cat.total} Points to verify</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {cat.score !== null && (
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  cat.score > 70 ? "bg-emerald-50 text-emerald-600" : cat.score > 40 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                )}>
                  {cat.score}%
                </div>
              )}
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveSheet('summary')}
          className="w-full bg-slate-900 p-4 rounded-3xl shadow-lg flex items-center justify-between text-left mt-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Finalize Report</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Submit for Review</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-white" />
        </motion.button>
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
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-6">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-white shadow-sm",
                (scores as any)[activeSheet] > 70 ? "text-emerald-600" : (scores as any)[activeSheet] > 40 ? "text-amber-600" : "text-red-600"
              )}>{(scores as any)[activeSheet]}%</div>
              <div>
                <p className="text-[10px] font-bold text-slate-900">Computed Score</p>
                <p className="text-[9px] text-slate-400">
                  {checklist[activeSheet].filter(p=>p.status==='pass').length} pass / {checklist[activeSheet].filter(p=>p.status==='fail').length} fail
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {checklist[activeSheet].map(point => renderPoint(activeSheet, point))}
            </div>
            
            <div className="pt-8 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Manual Grade Override</p>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-900">{activeSheet.toUpperCase()} GRADE</span>
                    <span className="text-lg font-black text-indigo-600">{(scores as any)[activeSheet]}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={(scores as any)[activeSheet]} 
                    onChange={e => {
                      setScoreOverrides(prev => ({ ...prev, [activeSheet]: true }));
                      setScores(prev => ({...prev, [activeSheet]: parseInt(e.target.value)}));
                    }}
                    className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
                  />
              </div>
            </div>

            <button 
              onClick={() => setActiveSheet(null)}
              className="w-full mt-6 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm active:scale-95 transition-transform"
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
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-6">
              <div className="flex items-center gap-4 border-b border-indigo-100/50 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-indigo-900 tracking-tight">Battery Telemetry</h3>
                  <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">State of Health Verification</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest ml-1">Battery State of Health (%)</label>
                  <input 
                    type="number" 
                    value={evData.batterySoh}
                    onChange={e => setEvData({...evData, batterySoh: e.target.value})}
                    placeholder="e.g. 98.5"
                    className="w-full bg-white border border-indigo-100 rounded-2xl py-4 px-5 text-slate-900 font-bold text-lg focus:outline-none focus:border-indigo-400 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest ml-1">Verified Range (KM)</label>
                  <input 
                    type="number" 
                    value={evData.range}
                    onChange={e => setEvData({...evData, range: e.target.value})}
                    placeholder="e.g. 420"
                    className="w-full bg-white border border-indigo-100 rounded-2xl py-4 px-5 text-slate-900 font-bold text-lg focus:outline-none focus:border-indigo-400 transition-all shadow-sm"
                  />
                </div>
              </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {checklist.ev.map(point => renderPoint('ev', point))}
          </div>

          <button 
            onClick={() => setActiveSheet(null)}
            className="w-full mt-6 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm active:scale-95 transition-transform"
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
                avg > 70 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : avg > 40 ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-red-50 border-red-100 text-red-600"
              )}>
                <p className="text-3xl font-black">{Math.round(avg)}%</p>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Total Health Score</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Calculated from all categories</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inspector's Final Summary</label>
              <textarea 
                value={finalNotes}
                onChange={e => setFinalNotes(e.target.value)}
                placeholder="Detailed summary of vehicle condition, required immediate maintenance, and pricing recommendations..."
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 text-sm min-h-[120px] focus:outline-none focus:border-indigo-300 transition-all resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
                <button
                  onClick={() => handleSubmit('review_pending')}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
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
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 z-40 md:hidden flex justify-center gap-10">
         <div className="flex flex-col items-center">
            <Activity size={18} className={activeSheet === 'mechanical' ? 'text-indigo-600' : 'text-slate-300'} />
            <span className="text-[8px] font-black uppercase mt-1 text-slate-400">Score</span>
         </div>
         <div className="flex flex-col items-center">
            <ShieldCheck size={18} className={activeSheet === 'exterior' ? 'text-indigo-600' : 'text-slate-300'} />
            <span className="text-[8px] font-black uppercase mt-1 text-slate-400">Armor</span>
         </div>
         <div className="flex flex-col items-center">
            <Zap size={18} className={activeSheet === 'ev' ? 'text-indigo-600' : 'text-slate-300'} />
            <span className="text-[8px] font-black uppercase mt-1 text-slate-400">Power</span>
         </div>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
      variant === 'primary' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100',
      className
    )}>
      {children}
    </span>
  );
}
