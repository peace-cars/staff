import { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, 
  Zap, Fuel, Activity, 
  ShieldCheck, DollarSign, X, Save, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import ImageUpload from './ImageUpload';

export default function InventoryModule() {
  const { session } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    make: '', model: '', year: new Date().getFullYear(),
    retailPrice: '', fuelType: 'ELECTRIC', dutyStatus: 'DUTY_PAID',
    vin: '', plate: '',
    gallery: [] as string[],
    internalDocuments: [] as string[]
  });

  useEffect(() => {
    fetchInventory();
  }, [session]);

  const fetchInventory = async () => {
    if (!session) return;
    try {
      // Leveraging backend scoping: Staff token returns only their branch
      const res = await fetch('http://localhost:3000/vehicles', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !session.profile?.location_id) {
      alert('Branch context missing. Contact administrator.');
      return;
    }
    
    try {
      const payload = {
        ...formData,
        branchId: session.profile.location_id // Automated scoping injection
      };

      const res = await fetch('http://localhost:3000/vehicles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowAddForm(false);
        fetchInventory();
        setFormData({
          make: '', model: '', year: new Date().getFullYear(),
          retailPrice: '', fuelType: 'ELECTRIC', dutyStatus: 'DUTY_PAID',
          vin: '', plate: '', gallery: [], internalDocuments: []
        });
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to create listing');
      }
    } catch (err) {
      console.error('Network Error', err);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    `${v.make} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vin_chassis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const InputField = ({ label, ...props }: any) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        {...props}
        className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Node Inventory</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none flex items-center gap-2">
            <Building2 size={14} className="text-indigo-500" /> Regional Assets Control
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search & Stats */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text"
            placeholder="Search regional units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-200 transition-all placeholder:text-slate-300"
          />
        </div>
        <div className="ios-card p-4 flex items-center justify-between border-indigo-100/50 bg-indigo-50/30">
          <div>
            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Branch Visibility</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{vehicles.length} Units</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Syncing Matrix...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="py-20 text-center ios-card bg-slate-50/50 border-dashed">
            <Package className="mx-auto mb-3 text-slate-200" size={32} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No units at this coordinate</p>
          </div>
        ) : (
          filteredVehicles.map(vehicle => (
            <div 
              key={vehicle.id}
              className="ios-card ios-shadow p-5 group transition-all hover:scale-[1.01]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                    {vehicle.fuel === 'ELECTRIC' ? <Zap size={18} /> : <Fuel size={18} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{vehicle.year}</span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-indigo-500 text-[9px] font-bold uppercase tracking-wider">{vehicle.duty?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-slate-900 tracking-tight">{(vehicle.retail_price_etb || 0).toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span></p>
                  <span className={cn(
                    "text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                    vehicle.status === 'SHOWROOM' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  )}>
                    {vehicle.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-slate-300" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">VIN: {vehicle.vin_chassis || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Building2 size={12} className="text-indigo-400" />
                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">{vehicle.branches?.name || 'Local'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-[2rem] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Asset Registration</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Automated Branch Injection Enabled</p>
                </div>
                <button onClick={() => setShowAddForm(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 transition-all">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Make" value={formData.make} onChange={(e: any) => setFormData({...formData, make: e.target.value})} placeholder="BYD" required />
                  <InputField label="Model" value={formData.model} onChange={(e: any) => setFormData({...formData, model: e.target.value})} placeholder="Seal" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Year" type="number" value={formData.year} onChange={(e: any) => setFormData({...formData, year: Number(e.target.value)})} required />
                  <InputField label="Price (ETB)" type="number" value={formData.retailPrice} onChange={(e: any) => setFormData({...formData, retailPrice: e.target.value})} placeholder="5,500,000" required />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fuel Type</label>
                  <select 
                    value={formData.fuelType} 
                    onChange={e => setFormData({...formData, fuelType: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-300 transition-all"
                  >
                    <option value="ELECTRIC">Electric</option>
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duty Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['DUTY_PAID', 'DUTY_FREE'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({...formData, dutyStatus: status})}
                        className={cn(
                          "py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                          formData.dutyStatus === status 
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                            : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <InputField label="VIN / Chassis" value={formData.vin} onChange={(e: any) => setFormData({...formData, vin: e.target.value})} placeholder="Optional" />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vehicle Photos</label>
                  <ImageUpload 
                    bucket="vehicles" 
                    folder="gallery" 
                    maxFiles={6} 
                    label="Add Photos" 
                    onUploadComplete={(urls: string[]) => setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...urls] }))} 
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full kinetic-gradient text-white py-4 font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest italic"
                >
                  <Save size={16} /> Push to Local Node
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
