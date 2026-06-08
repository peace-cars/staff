import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { API_URL } from '../lib/api';

interface ImageUploadProps {
  bucket: string;
  folder?: string;
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  label?: string;
}

export default function ImageUpload({ 
  bucket, 
  folder = 'uploads', 
  onUploadComplete, 
  maxFiles = 1,
  label = 'Upload'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
const compressImage = (file: File, maxWidth = 1280): Promise<File> => {
  return new Promise<File>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        resolve(file);
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
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' }));
            } else {
              resolve(file);
            }
          }, 'image/webp', 0.85);
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (previews.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    setUploading(true);
    setError(null);
    const uploadedUrls: string[] = [];

    for (let file of files) {
      file = await compressImage(file);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        if (folder) formData.append('folder', folder);

        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Upload failed');
        }

        const data = await res.json();
        const publicUrl = data.data.url;

        uploadedUrls.push(publicUrl);
        setPreviews(prev => [...prev, publicUrl]);
      } catch (err: any) {
        console.error('Upload error:', err);
        setError(`Upload failed: ${err.message}`);
      }
    }

    onUploadComplete(uploadedUrls);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = async (url: string) => {
    setPreviews(prev => prev.filter(p => p !== url));
    onUploadComplete(previews.filter(p => p !== url));
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-xl flex items-center gap-2 text-red-500 text-[10px] font-semibold">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {previews.map((url, idx) => (
          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-50">
            <img src={url} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => removeImage(url)}
              type="button"
              className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        
        {previews.length < maxFiles && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            type="button"
            className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-1 group"
          >
            {uploading ? (
              <Loader2 size={18} className="text-indigo-500 animate-spin" />
            ) : (
              <>
                <Upload size={14} className="text-slate-400 group-hover:text-indigo-500" />
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple={maxFiles > 1}
              accept="image/*,application/pdf" 
              className="hidden" 
            />
          </button>
        )}
      </div>
    </div>
  );
}

