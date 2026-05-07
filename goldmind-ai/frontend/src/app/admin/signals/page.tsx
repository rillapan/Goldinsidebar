// Admin — Signal Monitoring
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminSignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/signals/history');
        setSignals(res.data.data?.signals || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">⚡ Monitoring Sinyal</h1>
      <div className="grid gap-3">
        {signals.map((s: any) => (
          <div key={s.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={s.type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{s.type}</span>
              <span className="font-mono text-white text-sm">${s.entryPrice?.toFixed(2)}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                s.status === 'TP_HIT' ? 'bg-emerald-500/20 text-emerald-400' :
                s.status === 'SL_HIT' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>{s.status}</span>
            </div>
            <div className="text-right">
              {s.pnlPips != null && (
                <span className={`font-mono font-bold text-sm ${s.pnlPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.pnlPips >= 0 ? '+' : ''}{s.pnlPips.toFixed(1)} pips
                </span>
              )}
              <span className="text-gray-600 text-xs block">{new Date(s.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        ))}
        {signals.length === 0 && <div className="glass-card p-8 text-center text-gray-500">Belum ada riwayat sinyal.</div>}
      </div>
    </div>
  );
}
