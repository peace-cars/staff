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
import { fetchWithCache } from '../lib/cache';
import { unwrapApiResponse } from '../lib/api';
import { SkeletonCard } from './ui/Skeleton';

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
      await fetchWithCache(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/vehicles`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      }, (data) => {
        setVehicles(Array.isArray(data) ? data : []);
        setIsLoading(false);
      });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const updateVehicleStatus = async (vehicleId: string, newStatus: string) => {
    if (!session) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, status: newStatus } : v));
      } else {
        const error = unwrapApiResponse(await res.json());
        alert(error?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update vehicle status', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !session.profile?.branch_id) {
      alert('Branch context missing. Contact administrator.');
      return;
    }
    
    try {
      const payload = {
        ...formData,
        branchId: session.profile.branch_id // Automated scoping injection
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/vehicles`, {
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
        const error = unwrapApiResponse(await res.json());
        alert(error?.message || 'Failed to create listing');
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
      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">{label}</label>
      <input
        {...props}
        className="w-full bg-bg-base border border-border-subtle px-4 py-3.5 rounded-xl text-sm text-text-main font-medium focus:outline-none focus:border-primary-main focus:ring-1 focus:ring-primary-main/20 transition-all placeholder:text-text-muted/30"
      />
    </div>
  );

    return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="shrink-0 pb-5 z-40 bg-bg-base/90 backdrop-blur-xl flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] sm:text-[36px] font-black text-text-main tracking-tight leading-none mb-1">Node Inventory</h1>
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest leading-none flex items-center gap-2 opacity-70">
            <Building2 size={14} className="text-primary-main" /> Regional Assets Control
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-11 h-11 bg-primary-main text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-main/20 hover:bg-primary-main/90 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-6">

      {/* Search & Stats */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text"
            placeholder="Search regional units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-card border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-text-main focus:outline-none focus:border-primary-main transition-all placeholder:text-text-muted"
          />
        </div>
        <div className="native-card p-4 flex items-center justify-between border-border-subtle bg-surface-card shadow-sm">
          <div>
            <p className="text-[9px] font-bold text-primary-main uppercase tracking-widest">Branch Visibility</p>
            <p className="text-2xl font-bold text-text-main tracking-tight mt-0.5">{vehicles.length} Units</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-subtle flex items-center justify-center text-primary-main">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredVehicles.length === 0 ? (
          <div className="col-span-full py-20 text-center native-card bg-surface-card border-dashed border-border-subtle">
            <Package className="mx-auto mb-3 text-text-muted/30" size={32} />
            <p className="text-text-muted font-bold uppercase tracking-widest text-[9px]">No units at this coordinate</p>
          </div>
        ) : (
          filteredVehicles.map(vehicle => (
            <div 
              key={vehicle.id}
              className="native-card p-3 sm:p-5 group transition-all hover:scale-[1.01] bg-surface-card shadow-lg shadow-black/5 flex flex-col h-full"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4 gap-2 flex-1">
                <div className="flex gap-2 sm:gap-3 w-full">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-surface-hover rounded-xl flex items-center justify-center text-primary-main group-hover:scale-105 transition-transform shrink-0">
                    {vehicle.fuel === 'ELECTRIC' ? <Zap size={14} className="sm:w-[18px] sm:h-[18px]" /> : <Fuel size={14} className="sm:w-[18px] sm:h-[18px]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12px] sm:text-base font-bold text-text-main tracking-tight leading-tight group-hover:text-primary-main transition-colors truncate">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                      <span className="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase tracking-widest truncate">{vehicle.year}</span>
                      <span className="w-1 h-1 bg-border-subtle rounded-full shrink-0" />
                      <span className="text-primary-main text-[8px] sm:text-[9px] font-bold uppercase tracking-wider truncate">
                        {vehicle.duty === 'DUTY_PAID' ? 'Tax Paid' : vehicle.duty === 'DUTY_FREE' ? 'Tax Exempt' : vehicle.duty?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-1 sm:mt-0 gap-2 sm:gap-1.5 shrink-0">
                  <p className="text-[13px] sm:text-base font-bold text-text-main tracking-tight whitespace-nowrap">{(vehicle.retail_price_etb || 0).toLocaleString()} <span className="text-[8px] sm:text-[9px] text-text-muted">ETB</span></p>
                  <select
                    value={vehicle.status}
                    onChange={(e) => updateVehicleStatus(vehicle.id, e.target.value)}
                    className={cn(
                      "text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border appearance-none cursor-pointer outline-none",
                      vehicle.status === 'SHOWROOM' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    )}
                  >
                    <option value="SOURCING">Sourcing</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="CUSTOMS">Customs</option>
                    <option value="SHOWROOM">Showroom</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 sm:pt-3 mt-auto border-t border-border-subtle">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                  <Activity size={10} className="text-text-muted/50 sm:w-[12px] sm:h-[12px] shrink-0" />
                  <span className="text-[8px] sm:text-[9px] font-bold text-text-secondary uppercase tracking-wider truncate">VIN: {vehicle.vin_chassis || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-2">
                   <Building2 size={10} className="text-primary-main/60 sm:w-[12px] sm:h-[12px]" />
                   <span className="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase tracking-wider truncate">{vehicle.branches?.name || 'Local'}</span>
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
              className="bg-surface-card w-full sm:max-w-md sm:rounded-2xl rounded-t-[2rem] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-border-subtle"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-main tracking-tight">Asset Registration</h2>
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mt-0.5">Automated Branch Injection Enabled</p>
                </div>
                <button onClick={() => setShowAddForm(false)} className="p-2 bg-surface-hover rounded-xl text-text-secondary hover:bg-surface-hover/80 transition-all">
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
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Fuel Type</label>
                  <select 
                    value={formData.fuelType} 
                    onChange={e => setFormData({...formData, fuelType: e.target.value})}
                    className="w-full bg-bg-base border border-border-subtle px-4 py-3.5 rounded-xl text-sm text-text-main font-medium focus:outline-none focus:border-primary-main transition-all"
                  >
                    <option value="ELECTRIC">Electric</option>
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Tax Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['DUTY_PAID', 'DUTY_FREE'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({...formData, dutyStatus: status})}
                        className={cn(
                          "py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                          formData.dutyStatus === status 
                            ? "bg-primary-main border-primary-main text-white shadow-lg shadow-primary-main/20" 
                            : "bg-bg-base border-border-subtle text-text-secondary hover:bg-surface-hover"
                        )}
                      >
                        {status === 'DUTY_PAID' ? 'Tax Paid' : 'Tax Exempt'}
                      </button>
                    ))}
                  </div>
                </div>

                <InputField label="VIN / Chassis" value={formData.vin} onChange={(e: any) => setFormData({...formData, vin: e.target.value})} placeholder="Optional" />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Vehicle Photos</label>
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
                  className="w-full bg-primary-main text-white py-4 font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-primary-main/20 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Save size={16} /> Push to Local Node
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
