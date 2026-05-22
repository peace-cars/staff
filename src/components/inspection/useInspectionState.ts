import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { unwrapApiResponse } from '../../lib/api';
import confetti from 'canvas-confetti';

export interface InspectionPoint {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'pending';
  notes: string;
  photo?: string;
}

export const compressAndGetBase64 = (file: File, maxWidth = 1280, quality = 0.8): Promise<{ base64: string, dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error("Failed to read file"));
        return;
      }
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        let width = img.width;
        let height = img.height;
        if (scaleSize < 1) {
          width = maxWidth;
          height = img.height * scaleSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.split(',')[1];
          resolve({ base64, dataUrl });
        } else {
          reject(new Error("Canvas context creation failed"));
        }
      };
      img.onerror = () => reject(new Error("Image loading failed"));
    };
    reader.onerror = () => reject(new Error("File reading failed"));
  });
};

const defaultChecklist: Record<string, InspectionPoint[]> = {
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
};

export function useInspectionState(leadId: string | undefined) {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const isDM = profile?.role === 'DISTRICT_MANAGER' || profile?.role === 'GENERAL_MANAGER';
  
  const [checklist, setChecklist] = useState<Record<string, InspectionPoint[]>>(defaultChecklist);
  const [evData, setEvData] = useState({ batterySoh: '', range: '', chargerIncluded: true });
  const [finalNotes, setFinalNotes] = useState('');
  
  const [scores, setScores] = useState({ mechanical: 0, exterior: 0, interior: 0 });
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, boolean>>({ mechanical: false, exterior: false, interior: false });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lead, setLead] = useState<any>(null);
  const [commRate, setCommRate] = useState(0.01);
  const [fetchError, setFetchError] = useState('');
  
  // Offline & Sync states
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const calcScore = useCallback((cat: string): number => {
    const pts = checklist[cat];
    if (!pts) return 0;
    const evaluated = pts.filter(p => p.status !== 'pending');
    if (evaluated.length === 0) return 0;
    return Math.round((evaluated.filter(p => p.status === 'pass').length / pts.length) * 100);
  }, [checklist]);

  useEffect(() => {
    setScores(prev => ({
      mechanical: scoreOverrides.mechanical ? prev.mechanical : calcScore('mechanical'),
      exterior: scoreOverrides.exterior ? prev.exterior : calcScore('exterior'),
      interior: scoreOverrides.interior ? prev.interior : calcScore('interior'),
    }));
  }, [checklist, calcScore, scoreOverrides]);

  useEffect(() => {
    if (!leadId) {
      setHasLoadedDraft(true);
      return;
    }
    const draftKey = `inspection_draft_${leadId}`;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.checklist) setChecklist(parsed.checklist);
        if (parsed.evData) setEvData(parsed.evData);
        if (parsed.finalNotes) setFinalNotes(parsed.finalNotes);
        if (parsed.scores) setScores(parsed.scores);
        if (parsed.scoreOverrides) setScoreOverrides(parsed.scoreOverrides);
        setRestoredDraft(true);
        setTimeout(() => setRestoredDraft(false), 5000);
      }
    } catch (e) {
      console.error('Failed to load local draft:', e);
    } finally {
      setHasLoadedDraft(true);
    }
  }, [leadId]);

  useEffect(() => {
    if (!leadId || !hasLoadedDraft) return;
    const draftKey = `inspection_draft_${leadId}`;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ checklist, evData, finalNotes, scores, scoreOverrides }));
    } catch (e) {
      console.error('Failed to auto-save draft:', e);
    }
  }, [checklist, evData, finalNotes, scores, scoreOverrides, leadId, hasLoadedDraft]);

  const runBackgroundSync = useCallback(async () => {
    if (!navigator.onLine || syncingQueue) return;
    const queueKey = 'peace_sync_queue';
    const rawQueue = localStorage.getItem(queueKey);
    if (!rawQueue) return;

    try {
      const queue = JSON.parse(rawQueue);
      if (queue.length === 0) return;

      setSyncingQueue(true);
      setSyncStatus(`Syncing ${queue.length} offline report(s)...`);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const remainingQueue = [];

      for (const item of queue) {
        try {
          const authHeader = { 'Authorization': `Bearer ${item.token}` };
          const payload = item.payload;
          const updatedChecklist = { ...payload.checklist };

          for (const category of Object.keys(updatedChecklist)) {
            const points = updatedChecklist[category];
            for (let i = 0; i < points.length; i++) {
              const point = points[i];
              if (point.photo && point.photo.startsWith('data:image/')) {
                const base64 = point.photo.split(',')[1];
                const uploadRes = await fetch(`${apiUrl}/storage/upload-base64`, {
                  method: 'POST',
                  headers: { ...authHeader, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    base64: base64,
                    filename: `inspections-${category}-${point.id}-${Date.now()}.jpg`,
                    folder: `inspections/${item.leadId}`,
                    bucket: 'vehicles'
                  })
                });
                if (uploadRes.ok) {
                  const { url } = unwrapApiResponse(await uploadRes.json());
                  updatedChecklist[category][i] = { ...point, photo: url };
                } else {
                  throw new Error(`Failed to upload photo for ${point.label}`);
                }
              }
            }
          }

          const res = await fetch(`${apiUrl}/trade-in-requests/inspection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body: JSON.stringify({
              leadId: payload.leadId,
              mechanical_score: payload.mechanical_score,
              exterior_score: payload.exterior_score,
              interior_score: payload.interior_score,
              checklist: updatedChecklist,
              ev_data: payload.ev_data,
              final_notes: payload.final_notes
            })
          });

          if (!res.ok) throw new Error(`Inspection submission failed: ${res.status}`);

          if (payload.statusOverride === 'approved') {
            const approveRes = await fetch(`${apiUrl}/trade-in-requests/${item.leadId}/approve`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...authHeader },
              body: JSON.stringify({
                offerPrice: 10000,
                notes: 'Auto-approved by District Manager during offline inspection background sync.'
              })
            });
            if (!approveRes.ok) throw new Error(`Instant acquisition failed`);
          }

        } catch (err: any) {
          console.error(`Failed to sync item ${item.leadId}:`, err);
          remainingQueue.push(item);
        }
      }

      localStorage.setItem(queueKey, JSON.stringify(remainingQueue));
      
      const syncedCount = queue.length - remainingQueue.length;
      if (syncedCount > 0) {
        setSyncStatus(`Successfully synced ${syncedCount} offline report(s)!`);
        setTimeout(() => setSyncStatus(null), 5000);
      } else {
        setSyncStatus(null);
      }
    } catch (e) {
      console.error('Error during background sync runner:', e);
      setSyncStatus(null);
    } finally {
      setSyncingQueue(false);
    }
  }, [syncingQueue]);

  useEffect(() => {
    runBackgroundSync();
    const handleOnline = () => runBackgroundSync();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [runBackgroundSync]);

  useEffect(() => {
    if (!session) return;
    const headers = { 'Authorization': `Bearer ${session.access_token}` };

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-performance/me`, { headers })
      .then(r => r.json())
      .then(setProfile)
      .catch(console.error);

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/trade-in-requests/${leadId}`, { headers })
      .then(r => {
        if (!r.ok) throw new Error(`Access denied (${r.status})`);
        return r.json();
      })
      .then(data => setLead(data))
      .catch(err => {
        console.error(err);
        setFetchError(err.message);
      });

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/settings`, { headers })
      .then(r => r.json())
      .then(settings => {
        if (settings.evaluation_commission_percent) {
          setCommRate(parseFloat(settings.evaluation_commission_percent));
        }
      })
      .catch(console.error);
  }, [session, leadId]);

  const updatePoint = useCallback((category: string, id: string, updates: Partial<InspectionPoint>) => {
    setChecklist(prev => ({
      ...prev,
      [category]: prev[category].map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  }, []);

  const handleSubmit = async (statusOverride?: string) => {
    if (!session) return;
    setIsSubmitting(true);
    
    const payload = {
      leadId,
      mechanical_score: scores.mechanical,
      exterior_score: scores.exterior,
      interior_score: scores.interior,
      checklist,
      ev_data: evData,
      final_notes: finalNotes,
      statusOverride
    };

    if (!navigator.onLine) {
      try {
        const queueKey = 'peace_sync_queue';
        const rawQueue = localStorage.getItem(queueKey) || '[]';
        const queue = JSON.parse(rawQueue);
        const updatedQueue = queue.filter((item: any) => item.leadId !== leadId);
        
        updatedQueue.push({
          id: `${leadId}_${Date.now()}`,
          leadId,
          payload,
          timestamp: Date.now(),
          token: session.access_token,
          vehicleName: lead?.vehicle || 'Vehicle'
        });
        
        localStorage.setItem(queueKey, JSON.stringify(updatedQueue));
        localStorage.removeItem(`inspection_draft_${leadId}`);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#f59e0b', '#10b981'] });
        alert('Offline Mode! Evaluation saved to outbound Sync Queue. It will upload automatically when connection is restored.');
        setTimeout(() => navigate('/'), 2000);
      } catch (err) {
        console.error('Failed to queue offline inspection:', err);
        alert('Failed to save inspection locally. Storage full?');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const authHeader = { 'Authorization': `Bearer ${session.access_token}` };
      const updatedChecklist = { ...checklist };

      for (const category of Object.keys(updatedChecklist)) {
        const points = updatedChecklist[category];
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          if (point.photo && point.photo.startsWith('data:image/')) {
            const base64 = point.photo.split(',')[1];
            const uploadRes = await fetch(`${apiUrl}/storage/upload-base64`, {
              method: 'POST',
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                base64,
                filename: `inspections-${category}-${point.id}-${Date.now()}.jpg`,
                folder: `inspections/${leadId}`,
                bucket: 'vehicles'
              })
            });
            if (uploadRes.ok) {
              const { url } = unwrapApiResponse(await uploadRes.json());
              updatedChecklist[category][i] = { ...point, photo: url };
            } else {
              throw new Error(`Failed to upload local photo for ${point.label}`);
            }
          }
        }
      }

      const res = await fetch(`${apiUrl}/trade-in-requests/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          leadId,
          mechanical_score: scores.mechanical,
          exterior_score: scores.exterior,
          interior_score: scores.interior,
          checklist: updatedChecklist,
          ev_data: evData,
          final_notes: finalNotes
        })
      });

      const result = unwrapApiResponse(await res.json());
      if (!res.ok) {
        alert(result?.message || 'Submission failed');
        return;
      }

      if (statusOverride === 'approved') {
        const approveRes = await fetch(`${apiUrl}/trade-in-requests/${leadId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            offerPrice: lead.user_asking_price_etb || 10000,
            notes: 'Auto-approved by District Manager during inspection.'
          })
        });
        if (!approveRes.ok) {
          const appResult = await approveRes.json();
          alert('Inspection submitted, but instant acquisition failed: ' + (appResult.message || ''));
          return;
        }
      }

      localStorage.removeItem(`inspection_draft_${leadId}`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#f59e0b', '#10b981'] });
      alert('Evaluation submitted successfully. Syncing with registry...');
      setTimeout(() => navigate('/'), 2000);
    } catch (e: any) {
      console.error(e);
      alert('Submission error: ' + (e.message || 'Network Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    profile, isDM, checklist, evData, setEvData, finalNotes, setFinalNotes,
    scores, setScores, scoreOverrides, setScoreOverrides, isSubmitting, lead,
    commRate, fetchError, restoredDraft, setRestoredDraft, syncStatus,
    updatePoint, handleSubmit
  };
}
