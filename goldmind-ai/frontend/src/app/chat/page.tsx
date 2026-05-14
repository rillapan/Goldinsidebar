// TAHAP 5 — AI Chat Assistant
'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Bot, AlertTriangle, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  title?: string;
  createdAt: string;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/chat/sessions');
        setSessions(res.data.data || []);
      } catch (err) { console.error(err); }
    };
    fetchSessions();
  }, []);

  // Scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSession = async () => {
    try {
      const res = await api.post('/chat/sessions');
      const newSession = res.data.data;
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession.id);
      setMessages([]);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession || sendingMsg) return;

    const userMsg = input.trim();
    setInput('');
    setSendingMsg(true);

    // Optimistic update
    const tempUserMsg: Message = { id: `temp-${Date.now()}`, role: 'user', content: userMsg, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post(`/chat/sessions/${activeSession}/messages`, { content: userMsg });
      const { userMessage, aiMessage } = res.data.data;

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        userMessage,
        aiMessage,
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content: 'Gagal mendapatkan respons AI. Coba lagi.', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar Sessions */}
      <div className="w-64 hidden md:flex flex-col glass-card">
        <div className="p-4 border-b border-brand-border">
          <button onClick={createSession} className="w-full btn-gold text-sm rounded-lg py-2">
            + Chat Baru
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => { setActiveSession(s.id); setMessages([]); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                activeSession === s.id ? 'bg-amber-500/10 text-amber-400' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              {s.title || 'Chat baru...'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col glass-card">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <Bot className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">SINYAL COHIBA Chat Assistant</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-md">
                Tanya apa saja tentang analisa XAUUSD. AI akan membaca data harga live dan memberikan analisa teknikal kontekstual.
              </p>
              <button onClick={createSession} className="btn-gold text-sm rounded-lg px-6 py-2">
                Mulai Chat →
              </button>
              <button onClick={createSession} className="md:hidden btn-gold text-sm rounded-lg px-6 py-2 mt-2 block mx-auto">
                + Chat Baru (Mobile)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500/20 text-amber-100 border border-amber-500/20'
                      : 'bg-brand-dark border border-brand-border text-gray-300'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {sendingMsg && (
                <div className="flex justify-start">
                  <div className="bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-gray-500">
                    <span className="animate-pulse">AI sedang menganalisa...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-brand-border">
              <div className="flex gap-2">
                <input
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Tanya tentang XAUUSD..."
                  className="flex-1 bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                  disabled={sendingMsg}
                />
                <button onClick={sendMessage} disabled={sendingMsg || !input.trim()}
                  className="btn-gold rounded-lg px-4 py-3 text-sm disabled:opacity-50">
                  Kirim
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> AI ini bukan rekomendasi investasi. Trading mengandung risiko tinggi.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
