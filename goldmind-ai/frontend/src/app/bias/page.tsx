// TAHAP 3 — Halaman Daily Bias
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Newspaper } from 'lucide-react';

export default function BiasPage() {
  const [todayBias, setTodayBias] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayRes, historyRes] = await Promise.all([
          api.get('/bias/today'),
          api.get('/bias/history'),
        ]);
        setTodayBias(todayRes.data.data);
        setHistory(historyRes.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Newspaper className="w-6 h-6 text-amber-400" /> Daily Market Bias</h1>

      {/* Today's Bias */}
      {todayBias ? (
        <div className="glass-card p-6 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Bias Hari Ini</h2>
            <span className={todayBias.direction === 'BUY' ? 'badge-buy' : todayBias.direction === 'SELL' ? 'badge-sell' : 'badge-wait'}>
              {todayBias.direction} — {todayBias.confidence}%
            </span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{todayBias.reasoning}</p>
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-gray-500">
          Daily Bias belum tersedia hari ini. Akan dipublish pukul 07.00 WIB.
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Riwayat 30 Hari</h2>
        <div className="grid gap-3">
          {history.map((b: any) => (
            <div key={b.id} className="glass-card p-4 flex items-center justify-between hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 font-mono w-28">
                  {new Date(b.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={b.direction === 'BUY' ? 'badge-buy' : b.direction === 'SELL' ? 'badge-sell' : 'badge-wait'}>
                  {b.direction}
                </span>
              </div>
              <span className="text-sm text-gray-500">{b.confidence}% confidence</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
