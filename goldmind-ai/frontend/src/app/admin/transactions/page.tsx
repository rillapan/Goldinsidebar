// Admin — Transactions Log
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/transactions');
        setTransactions(res.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">💳 Log Transaksi</h1>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-dark/50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Member</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Metode</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white">{t.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-amber-400 font-mono">Rp {t.amount?.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-gray-400">{t.paymentMethod || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                      t.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && <div className="p-8 text-center text-gray-500">Belum ada transaksi.</div>}
      </div>
    </div>
  );
}
