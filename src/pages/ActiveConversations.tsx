import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Search, Send, User, History, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function ActiveConversations() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const token = session?.access_token || '';
  const staffId = session?.user?.id || '';

  useEffect(() => {
    if (selectedConv) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedConv]);

  useEffect(() => {
    fetchConversations();
    
    const channel = supabase.channel('staff_convs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      
      const channel = supabase.channel(`staff_msgs_${selectedConv.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`
        }, () => {
          fetchMessages(selectedConv.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConv]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          text: inputText
        })
      });
      const msg = await res.json();
      setMessages([...messages, msg]);
      setInputText('');
      fetchConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredConvs = conversations.filter(c => 
    !searchTerm || c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile: show list or chat, not both
  if (selectedConv) {
    return (
      <div className="flex flex-col h-[calc(100vh-210px)] max-h-[calc(100vh-210px)] animate-in fade-in duration-300">
        {/* Chat Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
          <button 
            onClick={() => setSelectedConv(null)} 
            className="p-2 rounded-xl bg-surface-hover text-text-secondary hover:bg-surface-hover/80 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary-main flex items-center justify-center text-xs font-bold">
            {selectedConv.profiles?.full_name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-text-main tracking-tight truncate">
              {selectedConv.profiles?.full_name || 'Customer'}
            </h3>
            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest truncate">
              {selectedConv.vehicles?.make} {selectedConv.vehicles?.model}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={24} className="mx-auto text-text-muted/30 mb-2" />
              <p className="text-text-muted text-[10px] font-bold">Start the conversation</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isStaffMsg = msg.sender_id === staffId;
            const senderName = isStaffMsg ? 'You' : (msg.profiles?.full_name || 'Customer');
            return (
            <div key={i} className={`flex ${isStaffMsg ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex flex-col ${isStaffMsg ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-bold text-text-secondary mb-1 px-1">
                  {senderName}
                </span>
                <div className={`px-4 py-3 rounded-2xl text-[13px] font-medium ${
                  isStaffMsg
                    ? 'bg-primary-main text-white rounded-br-md shadow-md shadow-primary-main/15'
                    : 'bg-surface-hover text-text-main border border-border-subtle rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
                <p className="text-[8px] font-bold text-text-muted uppercase tracking-wider px-1 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="pt-3 border-t border-border-subtle">
          <form onSubmit={handleSend} className="relative">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-surface-card border border-border-subtle rounded-2xl py-3.5 pl-4 pr-14 text-sm font-medium text-text-main focus:outline-none focus:border-primary-main transition-all placeholder:text-text-muted"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary-main text-white rounded-xl hover:bg-primary-main/90 transition-all shadow-sm active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Conversation List View
  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Messages</h1>
        <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest leading-none">
          Client Communications
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-surface-card border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-text-main focus:outline-none focus:border-primary-main transition-all placeholder:text-text-muted"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-2 border-primary-subtle border-t-primary-main rounded-full animate-spin" />
          <p className="text-text-muted font-bold uppercase tracking-widest text-[9px]">Loading...</p>
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
  );
}
