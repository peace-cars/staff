import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { 
  DollarSign, Send, History, Clock, CheckCircle, AlertCircle, Activity, FileText
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import { cn } from '../lib/utils';
import { fetchWithCache } from '../lib/cache';
import { SkeletonCard } from './ui/Skeleton';

export default function BudgetRequests() {
  const { session, logout } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBudgets = async () => {
    if (!session) return;
    try {
      await fetchWithCache(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-budgets`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }, (data) => {
        setBudgets(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    } catch (e: any) {
      if (e.status === 401) logout();
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [session]);

  const requestBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          purpose,
          receiptUrl
        })
      });
      setAmount('');
      setPurpose('');
      setReceiptUrl('');
      fetchBudgets();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadReceipt = async (id: string, url: string) => {
    if (!session) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/staff-budgets/${id}/receipt`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ receiptUrl: url })
      });
      fetchBudgets();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', dot: 'bg-amber-500' };
      case 'DISBURSED': return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500' };
      case 'REJECTED': return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', dot: 'bg-red-500' };
      default: return { bg: 'bg-surface-hover', text: 'text-text-secondary', border: 'border-border-subtle', dot: 'bg-text-muted' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle size={16} />;
      case 'DISBURSED': return <DollarSign size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) return (
    <div className="flex flex-col h-full space-y-6 pt-6">
      <div className="flex flex-col gap-1 mb-8">
         <div className="h-10 w-64 rounded bg-border-subtle/40 animate-pulse" />
         <div className="h-4 w-48 rounded bg-border-subtle/40 animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-5 z-40 bg-bg-base/90 backdrop-blur-xl">
        <h1 className="text-[32px] sm:text-[36px] font-black text-text-main tracking-tight leading-none mb-1">Finance Requests</h1>
        <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider leading-none flex items-center gap-2 mt-1 opacity-70">
          <DollarSign size={14} /> Operational Funding
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-6">

      <div className="native-card p-6 space-y-6 bg-surface-card">
        <h4 className="text-sm font-bold text-text-main tracking-tight uppercase tracking-wider">New Funding Request</h4>
        <form onSubmit={requestBudget} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Amount (ETB)</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40" />
              <input 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                type="number" 
                step="0.01" 
                required 
                placeholder="0.00"
                className="w-full bg-bg-base border border-border-subtle pl-10 pr-4 py-4 rounded-xl text-sm text-text-main font-bold focus:outline-none focus:border-primary-main focus:ring-1 focus:ring-primary-main/20 transition-all placeholder:text-text-muted/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Purpose</label>
            <textarea 
              value={purpose} 
              onChange={e => setPurpose(e.target.value)} 
              required 
              placeholder="Describe the operational need..."
              className="w-full bg-bg-base border border-border-subtle px-4 py-4 rounded-xl text-sm text-text-main font-medium focus:outline-none focus:border-primary-main focus:ring-1 focus:ring-primary-main/20 transition-all placeholder:text-text-muted/30 min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Receipt Image (Optional)</label>
            <ImageUpload 
              bucket="documents" 
              folder={`budgets/${session?.user.id || 'anonymous'}`} 
              onUploadComplete={(urls: string[]) => setReceiptUrl(urls[0] || '')} 
              maxFiles={1}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary-main text-white py-4 font-bold rounded-xl text-[11px] uppercase tracking-wider hover:bg-primary-main/90 transition-all disabled:opacity-50 shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : (
              <><Send size={16} /> Submit Request</>
            )}
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <History size={14} /> Request History
        </h2>
        <div className="flex items-center gap-3 text-[8px] font-bold text-text-muted uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-text-muted" /> Pending</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Approved</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Disbursed</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {budgets.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border-subtle rounded-3xl bg-bg-base/50">
            <Clock size={28} className="mx-auto text-text-muted/20 mb-3" />
            <p className="text-text-muted font-bold uppercase tracking-wider text-[9px]">No funding requests yet</p>
          </div>
        ) : budgets.map(b => {
          const colors = getStatusColor(b.status);
          return (
            <div key={b.id} className={cn(
              "native-card p-3 sm:p-5 transition-all relative overflow-hidden bg-surface-card flex flex-col h-full",
              b.status === 'DISBURSED' ? 'opacity-60 grayscale-[0.2]' : ''
            )}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 flex-1">
                <div className="flex items-center gap-2.5 sm:gap-4 w-full">
                  <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border", colors.bg, colors.text, colors.border)}>
                    {getStatusIcon(b.status)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[12px] sm:text-sm font-bold text-text-main tracking-tight truncate">{b.purpose}</h4>
                    <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1">
                      <p className="text-primary-main font-bold text-[11px] sm:text-[12px] truncate">
                        {(b.amount_approved || b.amount_requested || 0).toLocaleString()} <span className="text-[7px] sm:text-[8px] text-text-muted font-bold uppercase">ETB</span>
                      </p>
                      <span className="hidden sm:block w-1 h-1 bg-border-subtle rounded-full shrink-0" />
                      <p className="text-[7px] sm:text-[8px] text-text-muted font-bold uppercase tracking-wider truncate">ID: {b.id?.substring(0,6)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/50">
                  <div className="flex items-center gap-2">
                    {!b.receipt_url && b.status === 'DISBURSED' && (
                      <ImageUpload 
                        bucket="documents" 
                        folder={`receipts/${session?.user.id}`} 
                        onUploadComplete={(urls: string[]) => handleUploadReceipt(b.id, urls[0])} 
                        maxFiles={1}
                        label="Receipt"
                      />
                    )}
                    {b.receipt_url && (
                      <button 
                        onClick={() => window.open(b.receipt_url, '_blank')}
                        className="p-1.5 sm:p-2 bg-bg-base rounded-lg text-text-muted hover:text-primary-main transition-colors border border-border-subtle"
                      >
                        <FileText size={12} className="sm:w-[14px] sm:h-[14px]" />
                      </button>
                    )}
                  </div>
                  <span className={cn("text-[7px] sm:text-[8px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border whitespace-nowrap", colors.bg, colors.text, colors.border)}>
                    {b.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface-card border border-border-subtle p-5 rounded-3xl flex items-start gap-4">
        <div className="bg-bg-base p-2 rounded-xl text-text-muted shrink-0">
          <AlertCircle size={16} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-text-main uppercase tracking-wider mb-1">Financial Compliance</p>
          <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
            All disbursed funds require receipt documentation within 48 hours. Please ensure accuracy in all submissions.
          </p>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
