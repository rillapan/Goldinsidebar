// Admin — Daily Bias Management (edit/approve/publish)
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminBiasPage() {
  const [biases, setBiases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/bias/history');
        setBiases(res.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const publishBias = async (biasId: string) => {
    try {
      await api.post(`/admin/bias/${biasId}/publish`);
      setBiases((prev) => prev.map((b) => b.id === biasId ? { ...b, isPublished: true } : b));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">📰 Manajemen Daily Bias</h1>
      <div className="grid gap-4">
        {biases.map((b: any) => (
          <div key={b.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 font-mono">
                  {new Date(b.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className={b.direction === 'BUY' ? 'badge-buy' : b.direction === 'SELL' ? 'badge-sell' : 'badge-wait'}>
                  {b.direction}
                </span>
                <span className="text-xs text-gray-500">{b.confidence}%</span>
              </div>
              <div className="flex items-center gap-2">
                {b.isPublished ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Published</span>
                ) : (
                  <button onClick={() => publishBias(b.id)}
                    className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">
                    Publish
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{b.reasoning}</p>
          </div>
        ))}
        {biases.length === 0 && <div className="glass-card p-8 text-center text-gray-500">Belum ada data Daily Bias.</div>}
      </div>
    </div>
  );
}
