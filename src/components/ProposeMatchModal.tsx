import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Car, DollarSign, Camera, FileText } from 'lucide-react';
import { api } from '../lib/api';

export default function ProposeMatchModal({ request, onClose, onSuccess }: { request: any, onClose: () => void, onSuccess: (match: any) => void }) {
  const [loading, setLoading] = useState(false);
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
        photos: [], // Simplify for now
        imperfections: [], // Simplify
        diagnostic_checklist: { "Engine": "Passed", "Transmission": "Passed", "Brakes": "Passed", "Suspension": "Passed" }
      };

      const res = await api.post(`/sourcing-requests/${request.id}/matches`, payload);
      onSuccess(res);
    } catch (err) {
      console.error(err);
      alert('Failed to propose match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-3xl bg-surface-card rounded-2xl shadow-xl border border-border-subtle my-8 relative overflow-hidden">
        
        <div className="sticky top-0 z-10 flex justify-between items-center p-5 border-b bg-surface-card border-border-subtle">
          <div>
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2"><Car className="text-primary-main" /> Propose Curated Match</h2>
            <p className="text-[12px] text-text-muted mt-0.5">For {request.customer?.full_name}'s {request.make} {request.model} request</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-bg-secondary text-text-muted hover:bg-border-subtle transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Section 1: Vehicle Specs */}
          <div>
            <h3 className="text-[14px] font-bold text-text-main mb-4 flex items-center gap-2 border-b border-border-subtle pb-2"><FileText size={16} /> Base Vehicle Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Make</label>
                <input required name="make" value={formData.make} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Model</label>
                <input required name="model" value={formData.model} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Year</label>
                <input required type="number" name="year" value={formData.year} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
              </div>
            </div>
            
            <div className="mt-4">
               <label className="block text-[12px] font-semibold text-text-secondary mb-1">Match Score (0-100%)</label>
               <input required type="number" name="match_score" min="0" max="100" value={formData.match_score} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
            </div>
          </div>

          {/* Section 2: Agent Notes (Brutal Honesty) */}
          <div>
            <h3 className="text-[14px] font-bold text-text-main mb-4 flex items-center gap-2 border-b border-border-subtle pb-2"><FileText size={16} /> Sales Pitch & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Overall Agent Note (The Pitch)</label>
                <textarea required name="agent_note" value={formData.agent_note} onChange={handleChange} rows={2} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main resize-none" placeholder="e.g. This car is exceptionally clean and fits 95% of your criteria..." />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Budget Note</label>
                <input name="budget_note" value={formData.budget_note} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" placeholder="e.g. Under budget by 50K ETB" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Mileage Note</label>
                <input name="mileage_note" value={formData.mileage_note} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" placeholder="e.g. Slightly higher mileage, but well maintained" />
              </div>
            </div>
          </div>

          {/* Section 3: Financials */}
          <div>
            <h3 className="text-[14px] font-bold text-text-main mb-4 flex items-center gap-2 border-b border-border-subtle pb-2"><DollarSign size={16} /> Transparent Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Purchase Price</label>
                <input required type="number" name="purchase_price" value={formData.purchase_price} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Sourcing Fee</label>
                <input required type="number" name="sourcing_fee" value={formData.sourcing_fee} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Logistics / Transport</label>
                <input required type="number" name="logistics_cost" value={formData.logistics_cost} onChange={handleChange} className="w-full p-2.5 rounded-xl bg-bg-base border border-border-subtle text-[13px] outline-none focus:border-primary-main" />
              </div>
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-primary-main/10 border border-primary-main/20 flex justify-between items-center">
              <span className="text-[13px] font-bold text-text-main">Total Out-The-Door Cost to Client</span>
              <span className="text-lg font-black text-primary-main">
                {(Number(formData.purchase_price || 0) + Number(formData.sourcing_fee || 0) + Number(formData.logistics_cost || 0)).toLocaleString()} ETB
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-text-main bg-bg-secondary hover:bg-border-subtle transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white bg-primary-main hover:bg-primary-hover transition-colors flex items-center gap-2">
              {loading ? 'Submitting...' : 'Send Curated Match'} <Save size={16} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
