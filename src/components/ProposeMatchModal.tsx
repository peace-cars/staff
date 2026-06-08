import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Car, DollarSign, Camera, FileText, Upload, Trash2, Image } from 'lucide-react';
import { api } from '../lib/api';

interface ProposeMatchModalProps {
  request: any;
  onClose: () => void;
  onSuccess: (match: any) => void;
}

export default function ProposeMatchModal({ request, onClose, onSuccess }: ProposeMatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    make: request.make,
    model: request.model,
    year: request.max_year || 2022,
    match_score: 95,
    agent_note: '',
    budget_note: '',
    mileage_note: '',
    color_note: '',
    purchase_price: 0,
    sourcing_fee: 50000,
    logistics_cost: 0,
    video_url: ''
  });

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Multi-image: convert File[] to base64 URLs for preview, then upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingPhotos(true);
    try {
      const previews = await Promise.all(
        files.map(f => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(f);
        }))
      );
      setPhotos(prev => [...prev, ...previews].slice(0, 10)); // max 10
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        year: parseInt(formData.year.toString(), 10),
        match_score: parseInt(formData.match_score.toString(), 10),
        purchase_price: parseFloat(formData.purchase_price.toString()),
        sourcing_fee: parseFloat(formData.sourcing_fee.toString()),
        logistics_cost: parseFloat(formData.logistics_cost.toString()),
        total_otd_cost: parseFloat(formData.purchase_price.toString()) + parseFloat(formData.sourcing_fee.toString()) + parseFloat(formData.logistics_cost.toString()),
        photos,
        imperfections: [],
        diagnostic_checklist: { "Engine": "Passed", "Transmission": "Passed", "Brakes": "Passed", "Suspension": "Passed" }
      };

      const res = await api.post(`/sourcing-requests/${request.id}/matches`, payload);
      onSuccess(res);
    } catch (err) {
      console.error(err);
      alert('Failed to propose match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
      />

      {/* Bottom Drawer */}
      <motion.div
        key="drawer"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 35, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[210] bg-surface-card border-t border-border-subtle rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>

        {/* Sticky Header */}
        <div className="flex justify-between items-center px-5 pb-4 pt-2 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Car size={18} className="text-primary-main" /> Propose Curated Match
            </h2>
            <p className="text-[12px] text-text-muted mt-0.5">
              For {request.customer?.full_name || request.contact_name}'s {request.make} {request.model}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-bg-secondary text-text-muted hover:bg-border-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-7 pb-8">

            {/* Section 1: Vehicle Specs */}
            <div>
              <h3 className="text-[13px] font-bold text-text-main mb-3 flex items-center gap-2 border-b border-border-subtle pb-2">
                <FileText size={14} /> Base Vehicle Data
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Make</label>
                  <input required name="make" value={formData.make} onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Model</label>
                  <input required name="model" value={formData.model} onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Year</label>
                  <input required type="number" name="year" value={formData.year} onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Match Score (0-100%)</label>
                  <input required type="number" name="match_score" min="0" max="100" value={formData.match_score} onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
                </div>
              </div>
            </div>

            {/* Section 2: Photos Upload */}
            <div>
              <h3 className="text-[13px] font-bold text-text-main mb-3 flex items-center gap-2 border-b border-border-subtle pb-2">
                <Camera size={14} /> Vehicle Photos ({photos.length}/10)
              </h3>

              {/* Upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhotos || photos.length >= 10}
                className="w-full border-2 border-dashed border-border-subtle rounded-xl p-4 flex flex-col items-center gap-2 text-text-muted hover:border-primary-main hover:text-primary-main transition-all disabled:opacity-50"
              >
                {uploadingPhotos
                  ? <div className="w-5 h-5 border-2 border-primary-main/30 border-t-primary-main rounded-full animate-spin" />
                  : <Upload size={20} />
                }
                <span className="text-[12px] font-semibold">
                  {uploadingPhotos ? 'Processing...' : 'Tap to attach photos (multiple allowed)'}
                </span>
              </button>

              {/* Photo previews */}
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border-subtle shadow-sm group">
                      <img src={p} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center font-bold py-0.5">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-border-subtle flex items-center justify-center text-text-muted hover:border-primary-main hover:text-primary-main transition-all"
                    >
                      <Image size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Agent Notes */}
            <div>
              <h3 className="text-[13px] font-bold text-text-main mb-3 flex items-center gap-2 border-b border-border-subtle pb-2">
                <FileText size={14} /> Sales Pitch & Notes
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Overall Agent Note (The Pitch)*</label>
                  <textarea required name="agent_note" value={formData.agent_note} onChange={handleChange}
                    rows={3} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main resize-none"
                    placeholder="e.g. This car is exceptionally clean and fits 95% of your criteria..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">Budget Note</label>
                    <input name="budget_note" value={formData.budget_note} onChange={handleChange}
                      className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main"
                      placeholder="e.g. Under budget by 50K" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">Mileage Note</label>
                    <input name="mileage_note" value={formData.mileage_note} onChange={handleChange}
                      className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main"
                      placeholder="e.g. Well maintained" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Video URL (optional)</label>
                  <input type="url" name="video_url" value={formData.video_url} onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main"
                    placeholder="https://youtube.com/..." />
                </div>
              </div>
            </div>

            {/* Section 4: Financials */}
            <div>
              <h3 className="text-[13px] font-bold text-text-main mb-3 flex items-center gap-2 border-b border-border-subtle pb-2">
                <DollarSign size={14} /> Transparent Financials
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Purchase Price</label>
                  <input required type="number" name="purchase_price" value={formData.purchase_price} onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Sourcing Fee</label>
                  <input required type="number" name="sourcing_fee" value={formData.sourcing_fee} onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Logistics</label>
                  <input required type="number" name="logistics_cost" value={formData.logistics_cost} onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
                </div>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-primary-main/10 border border-primary-main/20 flex justify-between items-center">
                <span className="text-[12px] font-bold text-text-main">Total OTD Cost</span>
                <span className="text-base font-black text-primary-main">
                  {(Number(formData.purchase_price || 0) + Number(formData.sourcing_fee || 0) + Number(formData.logistics_cost || 0)).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          <div 
            className="sticky bottom-0 bg-surface-card border-t border-border-subtle px-5 pt-4 flex gap-3"
            style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-[13px] text-text-main bg-bg-secondary hover:bg-border-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 rounded-xl font-bold text-[13px] text-white bg-primary-main hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                : <><Save size={15} /> Send Curated Match</>
              }
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
