import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Search, Send, User, History,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { fetchWithCache, apiCache } from '../lib/cache';
import { unwrapApiResponse } from '../lib/api';
import { SkeletonCard } from '../components/ui/Skeleton';

// ── Matches bottom-nav pill ────────────────────────────────────────────────────
const GLASS =
  'rounded-[30px] border border-white/25 bg-white/70 backdrop-blur-2xl shadow-[0_18px_45px_-18px_rgba(15,23,42,0.75)] dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_18px_45px_-18px_rgba(0,0,0,0.92)]';

interface OptimisticMessage {
  _optimistic?: boolean;
  _failed?: boolean;
  id: string;
  text: string;
  created_at: string;
  sender_id: string;
  profiles?: { full_name?: string };
}

export default function ActiveConversations() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = session?.access_token || '';
  const staffId = session?.user?.id || '';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Lock body scroll when in chat view
  useEffect(() => {
    if (selectedConv) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('chat-active');
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('chat-active');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('chat-active');
    };
  }, [selectedConv]);

  // Real-time conversations
  useEffect(() => {
    fetchConversations();

    const channel = supabase.channel('staff_convs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        apiCache.clear(`/messages/conversations_GET_""`);
        if (payload.eventType === 'INSERT' && payload.new) {
          setConversations((prev) => [payload.new, ...prev.filter((c) => c.id !== payload.new.id)]);
          return;
        }
        if (payload.eventType === 'UPDATE' && payload.new) {
          setConversations((prev) => prev.map((c) => c.id === payload.new.id ? payload.new : c));
          return;
        }
        if (payload.eventType === 'DELETE' && payload.old) {
          setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
          return;
        }
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Real-time messages for selected conv
  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);

      const channel = supabase.channel(`staff_msgs_${selectedConv.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`
        }, (payload: any) => {
          if (payload.new && payload.new.sender_id !== staffId) {
            const incoming: OptimisticMessage = {
              ...payload.new,
              profiles: payload.new.profiles || { full_name: payload.new.sender_name },
            };
            setMessages((prev) => [...prev, incoming]);
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedConv]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      await fetchWithCache(
        `/messages/conversations`,
        { headers: { Authorization: `Bearer ${token}` } },
        (data) => { setConversations(Array.isArray(data) ? data : []); },
        60000,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      await fetchWithCache(
        `/messages/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
        (data) => { setMessages(Array.isArray(data) ? data : []); },
        30000,
      );
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedConv || isSending) return;

    // ── Optimistic update ────────────────────────────────────────────────────
    const tempId = `optimistic_${Date.now()}`;
    const optimisticMsg: OptimisticMessage = {
      _optimistic: true,
      id: tempId,
      text,
      created_at: new Date().toISOString(),
      sender_id: staffId,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: selectedConv.id, text }),
      });
      const newMsg = unwrapApiResponse(await res.json());

      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...newMsg, _optimistic: false } : m),
      );

      // Update cache
      const msgsKey = `/messages/${selectedConv.id}_GET_""`;
      const convsKey = `/messages/conversations_GET_""`;
      apiCache.clear(msgsKey);
      apiCache.clear(convsKey);
      fetchConversations();
    } catch (e) {
      console.error(e);
      // Mark as failed
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, _failed: true, _optimistic: false } : m),
      );
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConvs = conversations.filter((c) =>
    !searchTerm || c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ── CHAT VIEW ─────────────────────────────────────────────────────────────
  if (selectedConv) {
    return (
      <div
        className="flex flex-col fixed inset-0 z-[200] bg-bg-base animate-in fade-in duration-300"
      >
        {/* Hide both top header AND bottom nav while in chat */}
        <style>{`
          header.fixed, #bottom-nav { display: none !important; }
        `}</style>

        {/* ── Floating glass header ────────────────────────────────── */}
        <div className="px-3 pt-[calc(0.75rem+env(safe-area-inset-top,16px))] pb-2 shrink-0">
          <div className={`flex items-center gap-3 px-3 py-2.5 ${GLASS}`}>
            <button
              onClick={() => setSelectedConv(null)}
              className="p-1.5 -ml-1 rounded-full bg-white/30 text-text-secondary hover:bg-white/50 transition-all active:scale-90 shrink-0 dark:bg-white/10"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary-subtle text-primary-main flex items-center justify-center text-xs font-bold shrink-0 border border-primary-main/20">
              {selectedConv.profiles?.full_name?.substring(0, 2).toUpperCase() || <User size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-text-main tracking-tight truncate leading-tight">
                {selectedConv.profiles?.full_name || 'Customer'}
              </h3>
              {(selectedConv.vehicles?.make || selectedConv.vehicles?.model) && (
                <p className="text-[10px] text-primary-main font-bold uppercase tracking-wider truncate leading-none mt-0.5">
                  {selectedConv.vehicles?.make} {selectedConv.vehicles?.model}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Messages ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-3 px-4 space-y-3 no-scrollbar min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare size={24} className="mx-auto text-text-muted/30 mb-2" />
              <p className="text-text-muted text-[10px] font-bold">Start the conversation</p>
            </div>
          )}
          {messages.map((msg) => {
            const isStaffMsg = msg.sender_id === staffId;
            const senderName = isStaffMsg ? 'You' : (msg.profiles?.full_name || 'Customer');
            return (
              <div key={msg.id} className={`flex ${isStaffMsg ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex flex-col ${isStaffMsg ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold text-text-secondary mb-1 px-1">{senderName}</span>
                  <div
                    className={`px-4 py-3 rounded-2xl text-[13px] font-medium transition-opacity ${
                      isStaffMsg
                        ? 'bg-primary-main text-white rounded-br-md shadow-md shadow-primary-main/15'
                        : 'bg-surface-hover text-text-main border border-border-subtle rounded-bl-md'
                    } ${msg._optimistic ? 'opacity-60' : ''} ${msg._failed ? 'opacity-60 !border-error' : ''}`}
                  >
                    {msg.text}
                    {msg._optimistic && <Loader2 size={10} className="inline ml-1.5 animate-spin opacity-60" />}
                    {msg._failed && (
                      <span className="inline-flex items-center gap-1 ml-1.5 text-error text-[10px]">
                        <AlertCircle size={10} /> Failed
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider px-1 mt-1">
                    {msg._optimistic
                      ? 'Sending…'
                      : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* ── Floating glass input ────────────────────────────────────── */}
        <div className="px-3 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 12px)' }}>
          <form onSubmit={sendMessage} className={`flex items-center gap-2.5 px-4 py-2 ${GLASS}`}>
            <input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message…"
              disabled={isSending}
              inputMode="text"
              aria-label="Type a message"
              className="flex-1 bg-transparent text-[13px] font-medium text-text-main placeholder:text-text-muted/50 focus:outline-none min-w-0 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="shrink-0 w-10 h-10 rounded-full bg-primary-main text-white flex items-center justify-center shadow-md shadow-primary-main/20 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── CONVERSATION LIST VIEW ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="shrink-0 pb-5 z-40 bg-bg-base/90 backdrop-blur-xl flex flex-col gap-1">
        <h1 className="text-[32px] sm:text-[36px] font-black text-text-main tracking-tight leading-none mb-1">
          Messages
        </h1>
        <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest leading-none opacity-70">
          Client Communications
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-5">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations…"
              className="w-full bg-surface-card border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-text-main focus:outline-none focus:border-primary-main transition-all placeholder:text-text-muted"
            />
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="py-24 text-center native-card bg-surface-card border-dashed">
              <History size={28} className="mx-auto text-text-muted/30 mb-3" />
              <p className="text-text-secondary font-bold text-[11px]">No conversations</p>
              <p className="text-text-muted text-[10px] mt-1">Client chats will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className="w-full native-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] group bg-surface-card"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-subtle text-primary-main flex items-center justify-center text-sm font-bold shrink-0">
                    {conv.profiles?.full_name?.substring(0, 2).toUpperCase() || <User size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-text-main tracking-tight truncate">
                        {conv.profiles?.full_name || 'Customer'}
                      </h3>
                      <span className="text-[8px] font-bold text-text-muted uppercase shrink-0 ml-2">
                        {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary font-medium truncate mt-0.5">
                      {conv.last_message || 'No messages yet'}
                    </p>
                    <p className="text-[9px] text-primary-main font-bold mt-1">
                      {conv.vehicles?.make} {conv.vehicles?.model}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted shrink-0 group-hover:text-text-secondary transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
