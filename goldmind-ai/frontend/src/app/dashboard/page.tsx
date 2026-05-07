'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface Signal {
  id: string;
  type: 'BUY' | 'SELL';
  status: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
  createdAt: string;
}

interface Bias {
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  reasoning: string;
  date: string;
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-400' : value >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-brand-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color: value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : '#f87171' }}>
        {value}%
      </span>
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const isBuy = signal.type === 'BUY';
  const rr = Math.abs(signal.takeProfit - signal.entryPrice) / Math.abs(signal.entryPrice - signal.stopLoss);

  return (
    <div className="glass-card p-5 hover:border-amber-500/25 transition-all duration-300 hover:-translate-y-px">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className={isBuy ? 'badge-buy' : 'badge-sell'}>{signal.type}</span>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <span className="font-mono">{signal.timeframe}</span>
            <span>·</span>
            <span>XAUUSD</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-medium">AKTIF</span>
        </div>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-brand-dark/50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">Entry</span>
          <span className="font-mono font-bold text-white">{signal.entryPrice.toFixed(2)}</span>
        </div>
        <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
          <span className="text-xs text-gray-500 block mb-1">Stop Loss</span>
          <span className="font-mono font-bold text-red-400">{signal.stopLoss.toFixed(2)}</span>
        </div>
        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
          <span className="text-xs text-gray-500 block mb-1">Take Profit</span>
          <span className="font-mono font-bold text-emerald-400">{signal.takeProfit.toFixed(2)}</span>
        </div>
      </div>

      {/* Confidence + R:R */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1.5">Confidence AI</p>
          <ConfidenceBar value={signal.confidence} />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500 mb-0.5">Risk/Reward</p>
          <p className="text-sm font-bold text-amber-400">1:{rr.toFixed(1)}</p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="border-t border-brand-border pt-3">
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{signal.reasoning}</p>
      </div>

      <div className="flex justify-end mt-2">
        <span className="text-gray-600 text-xs">
          {new Date(signal.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeSignals, setActiveSignals] = useState<Signal[]>([]);
  const [todayBias, setTodayBias] = useState<Bias | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [signalRes, biasRes] = await Promise.all([
          api.get('/signals/active'),
          api.get('/bias/today'),
        ]);
        setActiveSignals(signalRes.data.data || []);
        setTodayBias(biasRes.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const socket = getSocket();
    socket.on('new_signal', (signal: Signal) => {
      setActiveSignals((prev) => [signal, ...prev]);
    });
    socket.on('price_update', (data: { price: number }) => {
      setLivePrice(data.price);
    });
    socket.on('signal_update', (update: Partial<Signal> & { id: string }) => {
      setActiveSignals((prev) => prev.map((s) => (s.id === update.id ? { ...s, ...update } : s)));
    });

    return () => {
      socket.off('new_signal');
      socket.off('price_update');
      socket.off('signal_update');
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse bg-brand-card/60" />
          ))}
        </div>
        <div className="glass-card p-6 h-40 animate-pulse bg-brand-card/60" />
        <div className="glass-card p-6 h-32 animate-pulse bg-brand-card/60" />
      </div>
    );
  }

  const biasColorClass = {
    BUY: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', badge: 'badge-buy' },
    SELL: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', badge: 'badge-sell' },
    WAIT: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', badge: 'badge-wait' },
  };
  const biasStyle = todayBias ? biasColorClass[todayBias.direction] : null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live data
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Live Price */}
        <div className="stat-card col-span-2 sm:col-span-1 bg-gradient-to-br from-amber-500/8 to-transparent border-amber-500/15">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-500 text-xs">XAUUSD Spot</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
            {livePrice ? `$${livePrice.toFixed(2)}` : <span className="text-gray-600">—</span>}
          </span>
          <span className="text-xs text-gray-600">Real-time via WebSocket</span>
        </div>

        {/* Active signals */}
        <div className="stat-card">
          <span className="text-gray-500 text-xs">Sinyal Aktif</span>
          <span className="text-3xl font-black text-white">{activeSignals.length}</span>
          <span className="text-xs text-gray-600">Posisi terbuka</span>
        </div>

        {/* Market bias */}
        <div className={`stat-card ${biasStyle ? `${biasStyle.bg} ${biasStyle.border}` : ''}`}>
          <span className="text-gray-500 text-xs">Market Bias</span>
          <span className={`text-2xl font-black ${biasStyle?.text ?? 'text-gray-600'}`}>
            {todayBias?.direction ?? '—'}
          </span>
          <span className="text-xs text-gray-600">Hari ini</span>
        </div>

        {/* Bias confidence */}
        <div className="stat-card">
          <span className="text-gray-500 text-xs">Confidence</span>
          <span className="text-3xl font-black text-white">{todayBias?.confidence ?? 0}%</span>
          <ConfidenceBar value={todayBias?.confidence ?? 0} />
        </div>
      </div>

      {/* ── DAILY BIAS ── */}
      {todayBias ? (
        <div className={`glass-card p-6 ${biasStyle?.border} bg-gradient-to-br ${biasStyle?.bg} to-transparent`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${biasStyle?.bg} ${biasStyle?.border} border flex items-center justify-center text-xl flex-shrink-0`}>
                📰
              </div>
              <div>
                <h2 className="font-bold text-white text-base">Daily Market Bias</h2>
                <p className="text-gray-500 text-xs">
                  {new Date(todayBias.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            <span className={biasStyle?.badge}>{todayBias.direction}</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{todayBias.reasoning}</p>
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-gray-400 text-sm">Daily Bias belum tersedia. Dirilis setiap hari pukul 07.00 WIB.</p>
        </div>
      )}

      {/* ── ACTIVE SIGNALS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="font-bold text-white">Sinyal Aktif</h2>
            {activeSignals.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                {activeSignals.length}
              </span>
            )}
          </div>
          <a href="/signals" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            Lihat semua →
          </a>
        </div>

        {activeSignals.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-white font-semibold mb-2">Tidak ada sinyal aktif</p>
            <p className="text-gray-500 text-sm">AI sedang menganalisa pasar... Sinyal baru akan muncul otomatis.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/signals', icon: '⚡', label: 'Riwayat Sinyal', desc: 'Lihat semua sinyal & statistik', color: 'amber' },
          { href: '/bias', icon: '📰', label: 'Arsip Daily Bias', desc: 'Riwayat analisa fundamental', color: 'blue' },
          { href: '/chat', icon: '🤖', label: 'Tanya AI', desc: 'Chat dengan AI analyst', color: 'emerald' },
        ].map((action) => {
          const colorMap: Record<string, string> = {
            amber: 'hover:border-amber-500/30 hover:bg-amber-500/5',
            blue: 'hover:border-blue-500/30 hover:bg-blue-500/5',
            emerald: 'hover:border-emerald-500/30 hover:bg-emerald-500/5',
          };
          return (
            <a key={action.href} href={action.href}
              className={`glass-card p-5 flex items-center gap-4 transition-all duration-200 group ${colorMap[action.color]}`}
            >
              <span className="text-2xl">{action.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">{action.label}</p>
                <p className="text-gray-500 text-xs">{action.desc}</p>
              </div>
              <span className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors">→</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
