// TAHAP 4 — Halaman Sinyal Trading
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

import { Zap } from 'lucide-react';

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (tab === 'active') {
          const res = await api.get('/signals/active');
          setSignals(res.data.data || []);
        } else {
          const res = await api.get('/signals/history');
          setSignals(res.data.data?.signals || []);
          setStats(res.data.data?.statistics || null);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    setLoading(true);
    fetchData();
  }, [tab]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="w-6 h-6 text-amber-400" /> Sinyal Trading</h1>
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Win Rate: <span className="text-emerald-400 font-bold">{stats.winRate}%</span></span>
            <span className="text-gray-500">Total: <span className="text-white font-bold">{stats.totalSignals}</span></span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['active', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-gray-500 hover:text-white'
            }`}>
            {t === 'active' ? 'Sinyal Aktif' : 'Riwayat'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : signals.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">
          {tab === 'active' ? 'Tidak ada sinyal aktif saat ini.' : 'Belum ada riwayat sinyal.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {signals.map((s: any) => (
            <div key={s.id} className="glass-card p-5 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={s.type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{s.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    s.status === 'TP_HIT' ? 'bg-emerald-500/20 text-emerald-400' :
                    s.status === 'SL_HIT' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{s.status}</span>
                  <span className="text-gray-600 text-xs">{s.timeframe}</span>
                </div>
                {s.pnlPips != null && (
                  <span className={`font-mono font-bold text-sm ${s.pnlPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.pnlPips >= 0 ? '+' : ''}{s.pnlPips.toFixed(1)} pips
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><span className="text-xs text-gray-500 block">Entry</span><span className="font-mono text-white">${s.entryPrice?.toFixed(2)}</span></div>
                <div><span className="text-xs text-gray-500 block">SL</span><span className="font-mono text-red-400">${s.stopLoss?.toFixed(2)}</span></div>
                <div><span className="text-xs text-gray-500 block">TP</span><span className="font-mono text-emerald-400">${s.takeProfit?.toFixed(2)}</span></div>
              </div>
              <p className="text-gray-500 text-xs mt-3 border-t border-brand-border pt-2">{s.reasoning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
