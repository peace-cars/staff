import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { unwrapApiResponse } from '../../lib/api';
import confetti from 'canvas-confetti';
import localforage from 'localforage';
import { fetchWithCache } from '../../lib/cache';

export interface InspectionPoint {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'pending';
  notes: string;
  photo?: string;
  weight?: number;
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
    { id: 'paint', label: 'Paint & Body Panels', status: 'pending', notes: '', weight: 4 },
    { id: 'glass', label: 'Windshield & Glass', status: 'pending', notes: '', weight: 2 },
    { id: 'lights', label: 'Headlights, Taillights & Indicators', status: 'pending', notes: '', weight: 2 },
    { id: 'tires', label: 'Tire Tread Depth & Sidewalls', status: 'pending', notes: '', weight: 3 },
    { id: 'wheels', label: 'Wheels & Rims Condition', status: 'pending', notes: '', weight: 2 },
    { id: 'bumpers', label: 'Bumpers & Fenders', status: 'pending', notes: '', weight: 2 },
    { id: 'mirrors', label: 'Side Mirrors & Antenna', status: 'pending', notes: '', weight: 1 },
    { id: 'undercarriage', label: 'Undercarriage & Rust Check', status: 'pending', notes: '', weight: 4 },
    { id: 'wipers', label: 'Wiper Blades & Washer System', status: 'pending', notes: '', weight: 1 },
    { id: 'exhaust', label: 'Exhaust Pipe & Emissions', status: 'pending', notes: '', weight: 3 },
  ],
  interior: [
    { id: 'seats', label: 'Seats & Upholstery', status: 'pending', notes: '', weight: 3 },
    { id: 'dashboard', label: 'Dashboard & Instrument Cluster', status: 'pending', notes: '', weight: 2 },
    { id: 'ac', label: 'Climate Control / AC & Heating', status: 'pending', notes: '', weight: 3 },
    { id: 'odometer', label: 'Odometer Verification & Mileage', status: 'pending', notes: '', weight: 4 },
    { id: 'infotainment', label: 'Infotainment & Audio System', status: 'pending', notes: '', weight: 2 },
    { id: 'windows', label: 'Power Windows & Locks', status: 'pending', notes: '', weight: 1 },
    { id: 'airbags', label: 'Airbag Indicators & Safety', status: 'pending', notes: '', weight: 5 },
    { id: 'carpet', label: 'Carpet, Headliner & Trim', status: 'pending', notes: '', weight: 1 },
    { id: 'seatbelts', label: 'Seatbelt Function & Condition', status: 'pending', notes: '', weight: 5 },
    { id: 'steering_wheel', label: 'Steering Wheel & Column', status: 'pending', notes: '', weight: 2 },
  ],
  mechanical: [
    { id: 'engine', label: 'Engine Performance & Sound', status: 'pending', notes: '', weight: 5 },
    { id: 'braking', label: 'Brake Pads, Discs & Lines', status: 'pending', notes: '', weight: 5 },
    { id: 'steering', label: 'Steering Response & Alignment', status: 'pending', notes: '', weight: 4 },
    { id: 'suspension', label: 'Suspension & Shock Absorbers', status: 'pending', notes: '', weight: 3 },
    { id: 'transmission', label: 'Transmission / Gearbox Shift', status: 'pending', notes: '', weight: 5 },
    { id: 'fluids', label: 'Oil, Coolant & Fluid Levels', status: 'pending', notes: '', weight: 2 },
    { id: 'leaks', label: 'Leak Inspection (Engine Bay & Under)', status: 'pending', notes: '', weight: 4 },
    { id: 'battery_mech', label: 'Battery Health & Terminals', status: 'pending', notes: '', weight: 3 },
    { id: 'clutch', label: 'Clutch / Torque Converter', status: 'pending', notes: '', weight: 4 },
    { id: 'drivetrain', label: 'Drivetrain & CV Joints', status: 'pending', notes: '', weight: 4 },
  ],
  ev: [
    { id: 'battery', label: 'High Voltage Battery Health (SOH)', status: 'pending', notes: '', weight: 5 },
    { id: 'charging', label: 'Charging Port & Cable', status: 'pending', notes: '', weight: 3 },
    { id: 'thermal', label: 'Battery Thermal Management', status: 'pending', notes: '', weight: 4 },
    { id: 'motor', label: 'Electric Motor & Inverter', status: 'pending', notes: '', weight: 5 },
    { id: 'regen', label: 'Regenerative Braking System', status: 'pending', notes: '', weight: 4 },
    { id: 'range', label: 'Range Test & Verification', status: 'pending', notes: '', weight: 4 },
    { id: 'onboard_charger', label: 'Onboard Charger Unit', status: 'pending', notes: '', weight: 4 },
    { id: 'hv_wiring', label: 'High Voltage Wiring Insulation', status: 'pending', notes: '', weight: 5 },
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
    
    let totalWeight = 0;
    let earnedWeight = 0;
    
    evaluated.forEach(p => {
      const weight = p.weight || 1;
      totalWeight += weight;
      if (p.status === 'pass') {
        earnedWeight += weight;
      }
    });
    
    return totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);
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
    localforage.getItem(draftKey).then((saved: any) => {
      if (saved) {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        if (parsed.checklist) setChecklist(parsed.checklist);
        if (parsed.evData) setEvData(parsed.evData);
        if (parsed.finalNotes) setFinalNotes(parsed.finalNotes);
        if (parsed.scores) setScores(parsed.scores);
        if (parsed.scoreOverrides) setScoreOverrides(parsed.scoreOverrides);
        setRestoredDraft(true);
        setTimeout(() => setRestoredDraft(false), 5000);
      }
    }).catch(e => {
      console.error('Failed to load local draft:', e);
    }).finally(() => {
      setHasLoadedDraft(true);
    });
  }, [leadId]);

  useEffect(() => {
    if (!leadId || !hasLoadedDraft) return;
    const draftKey = `inspection_draft_${leadId}`;
    localforage.setItem(draftKey, { checklist, evData, finalNotes, scores, scoreOverrides }).catch(e => {
      console.error('Failed to auto-save draft:', e);
    });
  }, [checklist, evData, finalNotes, scores, scoreOverrides, leadId, hasLoadedDraft]);

  const runBackgroundSync = useCallback(async () => {
    if (!navigator.onLine || syncingQueue) return;
    if (!session || !session.access_token) return; // Wait for valid session
    const queueKey = 'peace_sync_queue';
    
    try {
      const rawQueue = await localforage.getItem(queueKey) as any[];
      if (!rawQueue || (Array.isArray(rawQueue) && rawQueue.length === 0)) return;
      const queue = typeof rawQueue === 'string' ? JSON.parse(rawQueue) : rawQueue;
      if (queue.length === 0) return;

      setSyncingQueue(true);
      setSyncStatus(`Syncing ${queue.length} offline report(s)...`);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const remainingQueue = [];

      for (const item of queue) {
        try {
          const authHeader = { 'Authorization': `Bearer ${session.access_token}` };
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

      await localforage.setItem(queueKey, remainingQueue);
      
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
  }, [syncingQueue, session]);

  useEffect(() => {
    runBackgroundSync();
    const handleOnline = () => runBackgroundSync();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [runBackgroundSync]);

  useEffect(() => {
    if (!session) return;
    const headers = { 'Authorization': `Bearer ${session.access_token}` };

    fetchWithCache(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-performance/me`, { headers }, (data) => {
      setProfile(data);
    }).catch(console.error);

    fetchWithCache(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/trade-in-requests/${leadId}`, { headers }, (data) => {
      setLead(data);
    }).catch(err => {
      console.error(err);
      setFetchError(err.message || 'Access denied');
    });

    fetchWithCache(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/settings`, { headers }, (settings) => {
      if (settings.evaluation_commission_percent) {
        setCommRate(parseFloat(settings.evaluation_commission_percent));
      }
    }).catch(console.error);
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
        const rawQueue = await localforage.getItem(queueKey) as any[];
        const queue = (typeof rawQueue === 'string' ? JSON.parse(rawQueue) : rawQueue) || [];
        const updatedQueue = queue.filter((item: any) => item.leadId !== leadId);
        
        updatedQueue.push({
          id: `${leadId}_${Date.now()}`,
          leadId,
          payload,
          timestamp: Date.now(),
          vehicleName: lead?.vehicle || 'Vehicle'
        });
        
        await localforage.setItem(queueKey, updatedQueue);
        await localforage.removeItem(`inspection_draft_${leadId}`);

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

      await localforage.removeItem(`inspection_draft_${leadId}`);
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
