import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, ChevronLeft, CheckCircle2, AlertTriangle, 
  Info, MessageSquare, Check
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { fetchWithCache, apiCache } from '../lib/cache';

export default function Notifications() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = session ? `/notifications?recipientId=${session.user.id}_GET_""` : '';

  useEffect(() => {
    if (!session) return;
    
    fetchWithCache(
      `/notifications?recipientId=${session.user.id}`,
      { headers: { 'Authorization': `Bearer ${session.access_token}` } },
      (data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      },
      300000 // 5 minutes TTL
    ).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [session]);

  const markRead = async (id: string) => {
    if (!session) return;
    // Optimistic UI + Cache update
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    if (cacheKey) apiCache.set(cacheKey, updated);

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    if (!session) return;
    // Optimistic UI + Cache update
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    if (cacheKey) apiCache.set(cacheKey, updated);

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'INSPECTION_ALERT': return <AlertTriangle className="text-amber-500" size={16} />;
      case 'APPROVAL': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'MESSAGE': return <MessageSquare className="text-primary-main" size={16} />;
      default: return <Info className="text-text-muted" size={16} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'INSPECTION_ALERT': return 'bg-amber-500/10';
      case 'APPROVAL': return 'bg-emerald-500/10';
      case 'MESSAGE': return 'bg-primary-subtle';
      default: return 'bg-surface-hover';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="shrink-0 pb-5 z-40 bg-bg-base/90 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-surface-hover hover:bg-surface-hover/80 text-text-secondary transition-all">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-[32px] sm:text-[36px] font-black text-text-main tracking-tight leading-none mb-1">Notifications</h1>
            <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5 opacity-70">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-subtle text-primary-main rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary-subtle/80 transition-all"
          >
            <Check size={12} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-6">

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-2 border-primary-subtle border-t-primary-main rounded-full animate-spin" />
          <p className="text-text-muted font-bold uppercase tracking-widest text-[9px]">Loading...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-24 text-center native-card bg-surface-card border-dashed">
          <Bell size={32} className="mx-auto text-text-muted/30 mb-4" />
          <p className="text-text-secondary font-bold text-[11px]">No notifications yet</p>
          <p className="text-text-muted text-[10px] mt-1">You'll be notified about important updates here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full text-left native-card p-5 group transition-all relative overflow-hidden bg-surface-card ${
                n.isRead ? 'opacity-60' : 'shadow-lg shadow-black/5'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getBgColor(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`text-sm font-bold tracking-tight ${n.isRead ? 'text-text-muted' : 'text-text-main'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[9px] font-bold text-text-muted uppercase shrink-0">
                      {new Date(n.createdAt || n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-relaxed ${n.isRead ? 'text-text-muted' : 'text-text-secondary'}`}>
                    {n.message}
                  </p>
                </div>
              </div>

              {/* Unread indicator */}
              {!n.isRead && (
                <div className="absolute left-0 top-0 w-1 h-full bg-primary-main rounded-r" />
              )}
            </button>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
