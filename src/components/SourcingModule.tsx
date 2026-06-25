import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { fetchWithCache } from '../lib/cache';
import { 
  Car, Search, CheckCircle2, PlusCircle, Clock, 
  Phone, User, AlertTriangle, ChevronDown, ChevronUp,
  Zap, DollarSign, Calendar, Fuel, Settings2,
  ArrowRight, Loader2, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import ProposeMatchModal from './ProposeMatchModal';
import { SkeletonCard } from './ui/Skeleton';

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  FLEXIBLE:  { label: 'Flexible',   color: 'text-text-muted' },
  MODERATE:  { label: 'Moderate',   color: 'text-warning' },
  URGENT:    { label: 'URGENT',     color: 'text-error font-black' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  SUBMITTED:  { label: 'Submitted',  bg: 'bg-border-subtle/40', text: 'text-text-muted' },
  ASSIGNED:   { label: 'Assigned',   bg: 'bg-primary-main/10',  text: 'text-primary-main' },
  SEARCHING:  { label: 'Searching',  bg: 'bg-warning/10',       text: 'text-warning' },
  MATCH_SENT: { label: 'Match Sent', bg: 'bg-success/10',       text: 'text-success' },
  READY:      { label: 'Ready',      bg: 'bg-success/20',       text: 'text-success' },
};

export default function SourcingModule() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback((silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetchWithCache(`/sourcing-requests/assigned`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    }, (data) => {
      setRequests(Array.isArray(data) ? data : []);
      setLoading(false);
      setRefreshing(false);
    }).catch(err => {
      console.error('[SourcingModule] Failed to fetch:', err);
      setLoading(false);
      setRefreshing(false);
    });
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const handleMatchProposed = (newMatch: any) => {
    setRequests(reqs => reqs.map(r => {
      if (r.id === selectedReq?.id) {
        return { ...r, matches: [...(r.matches || []), newMatch], status: 'MATCH_SENT' };
      }
      return r;
    }));
    setSelectedReq(null);
  };

  if (loading) return (
    <div className="flex flex-col h-full space-y-6 pt-6">
      <div className="flex flex-col gap-1">
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

  const activeRequests = requests.filter(r => !['READY', 'CANCELLED'].includes(r.status));
  const completedRequests = requests.filter(r => ['READY', 'CANCELLED'].includes(r.status));

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-5 z-40 bg-bg-base/90 backdrop-blur-xl flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-[32px] sm:text-[36px] font-black text-text-main tracking-tight leading-none mb-1 flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary-main/10 border border-primary-main/20 flex items-center justify-center">
              <Search size={18} className="text-primary-main" />
            </span>
            Sourcing Hunts
          </h1>
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest opacity-70">
            {activeRequests.length} active assignment{activeRequests.length !== 1 ? 's' : ''} • Find the perfect match
          </p>
        </div>
        <button
          onClick={() => load(true)}
          className={cn(
            'w-9 h-9 rounded-xl border border-border-subtle bg-surface-card flex items-center justify-center text-text-muted hover:text-primary-main transition-all',
            refreshing && 'animate-spin text-primary-main'
          )}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-6">

      {/* Active Requests */}
      {activeRequests.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-border-subtle rounded-3xl bg-surface-card flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center">
            <Search size={28} className="text-text-muted/40" />
          </div>
          <div>
            <p className="text-text-main font-bold text-[15px]">No Active Assignments</p>
            <p className="text-text-muted font-medium text-[13px] mt-1">Your manager will assign sourcing hunts here</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          {activeRequests.map(req => {
            const urgency = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.FLEXIBLE;
            const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.ASSIGNED;
            const matchCount = req.matches?.length || 0;
            const isExpanded = expandedId === req.id;

            return (
              <div
                key={req.id}
                className="bg-surface-card border border-border-subtle/50 rounded-xl overflow-hidden shadow-sm hover:border-border-subtle/80 transition-all flex flex-col"
              >
                <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center flex-1">
                  {/* Left: Icon & Core Details */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:flex-1">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-primary-main/10 border border-primary-main/20 flex items-center justify-center shrink-0">
                      <Car size={16} className="text-primary-main sm:w-[20px] sm:h-[20px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                        <h3 className="font-black text-[12px] sm:text-[14px] text-text-main leading-tight truncate">{req.make} {req.model}</h3>
                        <span className={cn('text-[8px] sm:text-[9px] font-bold px-1.5 h-4 flex items-center rounded-md shrink-0 hidden sm:flex', statusCfg.bg, statusCfg.text)}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[12px] text-text-muted truncate font-medium">
                        {req.min_year} – {req.max_year} • {req.fuel_type || 'Any'} • <span className="text-success font-bold">{Number(req.max_budget).toLocaleString()} ETB</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[9px] sm:text-[11px]">
                        <span className={cn('font-bold shrink-0', urgency.color)}>
                          ⚡ {urgency.label}
                        </span>
                        <span className="text-text-muted/60 flex items-center gap-0.5 sm:gap-1 truncate">
                          <User size={9} className="shrink-0 sm:w-[10px] sm:h-[10px]" /> <span className="truncate">{req.customer?.full_name || req.contact_name || '—'}</span>
                        </span>
                        <span className="text-primary-main font-bold shrink-0">
                          {matchCount} match{matchCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="shrink-0 w-full sm:w-auto flex flex-row sm:flex-col gap-1.5 sm:gap-2 items-center sm:items-end border-t sm:border-t-0 border-border-subtle/30 pt-2 sm:pt-0 mt-auto sm:mt-0">
                    <button
                      onClick={() => setSelectedReq(req)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-main text-white text-[10px] sm:text-[12px] font-bold hover:bg-primary-main/90 transition-all shadow-sm truncate"
                    >
                      <PlusCircle size={12} className="sm:w-[14px] sm:h-[14px]" />
                      Propose
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border-subtle bg-bg-secondary text-text-secondary text-[10px] sm:text-[12px] font-bold hover:bg-bg-base transition-all"
                    >
                      {isExpanded ? <ChevronUp size={12} className="sm:w-[14px] sm:h-[14px]" /> : <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px]" />}
                      {isExpanded ? 'Hide' : 'Specs'}
                    </button>
                  </div>
                </div>

                {/* Expanded: Full Specification */}
                {isExpanded && (
                  <div className="border-t border-border-subtle/50 bg-bg-secondary/50 p-5 space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Full Requirements</p>
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      {req.max_mileage && (
                        <div className="flex items-center gap-2">
                          <Settings2 size={13} className="text-text-muted" />
                          <span className="text-text-muted">Max Mileage:</span>
                          <span className="font-bold text-text-main ml-auto">{Number(req.max_mileage).toLocaleString()} km</span>
                        </div>
                      )}
                      {req.payment_method && (
                        <div className="flex items-center gap-2">
                          <DollarSign size={13} className="text-text-muted" />
                          <span className="text-text-muted">Payment:</span>
                          <span className="font-bold text-text-main ml-auto">{req.payment_method}</span>
                        </div>
                      )}
                      {req.fuel_type && (
                        <div className="flex items-center gap-2">
                          <Fuel size={13} className="text-text-muted" />
                          <span className="text-text-muted">Fuel:</span>
                          <span className="font-bold text-text-main ml-auto">{req.fuel_type}</span>
                        </div>
                      )}
                    </div>

                    {req.must_have_features?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Must-Have Features</p>
                        <div className="flex flex-wrap gap-2">
                          {req.must_have_features.map((f: string) => (
                            <span key={f} className="text-[11px] font-semibold bg-primary-main/10 text-primary-main rounded-lg px-2.5 py-1 border border-primary-main/20">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {req.exterior_colors?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Preferred Colors</p>
                        <div className="flex flex-wrap gap-2">
                          {req.exterior_colors.map((c: string) => (
                            <span key={c} className="text-[11px] font-semibold bg-bg-base text-text-secondary rounded-lg px-2.5 py-1 border border-border-subtle">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {req.photos?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Attached Photos</p>
                        <div className="flex flex-wrap gap-2">
                          {req.photos.map((p: string, idx: number) => (
                            <a key={idx} href={p} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-xl overflow-hidden border border-border-subtle shadow-sm hover:opacity-80 transition-opacity">
                              <img src={p} alt={`Customer attachment ${idx+1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Matches */}
                    {matchCount > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Your Proposals ({matchCount})</p>
                        <div className="space-y-2">
                          {req.matches.slice(0, 3).map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between bg-surface-card rounded-xl p-3 border border-border-subtle/40">
                              <div>
                                <p className="font-bold text-[13px] text-text-main">{m.make} {m.model} ({m.year})</p>
                                <p className="text-[11px] text-text-muted">{Number(m.purchase_price).toLocaleString()} ETB</p>
                              </div>
                              <span className={cn(
                                'text-[10px] font-black px-2 py-1 rounded-lg uppercase',
                                m.status === 'LIKED' ? 'bg-success/10 text-success' :
                                m.status === 'REJECTED' ? 'bg-error/10 text-error' :
                                'bg-warning/10 text-warning'
                              )}>
                                {m.status === 'LIKED' ? '✓ Approved' : m.status === 'REJECTED' ? '✗ Rejected' : '⏳ Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed */}
      {completedRequests.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Completed ({completedRequests.length})</p>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 opacity-60">
            {completedRequests.map(req => (
              <div key={req.id} className="bg-surface-card border border-border-subtle/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 h-full">
                <div className="min-w-0">
                  <p className="font-bold text-[12px] sm:text-[14px] text-text-main truncate">{req.make} {req.model}</p>
                  <p className="text-[10px] sm:text-[12px] text-text-muted truncate">{req.customer?.full_name || req.contact_name}</p>
                </div>
                <span className="text-[9px] sm:text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shrink-0 mt-auto sm:mt-0">CLOSED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedReq && (
        <ProposeMatchModal
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
          onSuccess={handleMatchProposed}
        />
      )}
        </div>
      </div>
    </div>
  );
}
