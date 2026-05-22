import { useState } from 'react';
import { CheckCircle2, XCircle, Camera, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { compressAndGetBase64 } from './useInspectionState';
import type { InspectionPoint } from './useInspectionState';
import { useAuth } from '../../lib/auth';
import { unwrapApiResponse } from '../../lib/api';

interface InspectionPointItemProps {
  category: string;
  point: InspectionPoint;
  leadId: string;
  updatePoint: (category: string, id: string, updates: Partial<InspectionPoint>) => void;
  setUploadError: (err: string | null) => void;
}

export function InspectionPointItem({ category, point, leadId, updatePoint, setUploadError }: InspectionPointItemProps) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    if (!session) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { base64, dataUrl } = await compressAndGetBase64(file);

      if (!navigator.onLine) {
        updatePoint(category, point.id, { photo: dataUrl });
        setUploadError("Offline! Photo saved locally. It will upload when you submit/sync.");
        setTimeout(() => setUploadError(null), 4000);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/storage/upload-base64`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          base64: base64,
          filename: file.name ? file.name.replace(/\.[^/.]+$/, '.jpg') : 'image.jpg',
          folder: `inspections/${leadId}`,
          bucket: 'vehicles'
        })
      });
      
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { url } = unwrapApiResponse(await res.json());
      updatePoint(category, point.id, { photo: url });
    } catch (e: any) {
      console.error('[Upload]', e);
      setUploadError(e?.message || 'Photo upload failed. Please try again.');
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-surface-card border border-border-subtle/50 overflow-hidden shadow-sm">
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

      <div className="px-4 py-3">
        <input 
          placeholder="Observation notes..."
          value={point.notes}
          onChange={(e) => updatePoint(category, point.id, { notes: e.target.value })}
          className="w-full bg-bg-secondary border border-border-subtle/40 rounded-xl px-3 py-2.5 text-[12px] text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary-main/60 transition-all"
        />
      </div>

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
            <label className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-border-subtle bg-surface-hover text-text-muted text-[11px] font-bold transition-all cursor-pointer",
              uploading ? "opacity-50 pointer-events-none" : "hover:border-primary-main/50 hover:text-primary-main active:scale-95"
            )}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              <span>Camera</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
                disabled={uploading}
              />
            </label>

            <label className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-border-subtle bg-surface-hover text-text-muted text-[11px] font-bold transition-all cursor-pointer",
              uploading ? "opacity-50 pointer-events-none" : "hover:border-primary-main/50 hover:text-primary-main active:scale-95"
            )}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              <span>Gallery</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
