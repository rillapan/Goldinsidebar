// Halaman Profil User + Riwayat Pembayaran
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { UserCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/payments/history');
        setTransactions(res.data.data || []);
      } catch (err) { console.error(err); }
    };
    fetchHistory();
  }, []);

  if (!user) return null;

  const membership = user.activeMembership;
  const daysLeft = membership
    ? Math.max(0, Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><UserCircle className="w-6 h-6 text-amber-400" /> Profil</h1>

      {/* User Info */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Informasi Akun</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500 block">Nama</span><span className="text-white">{user.name}</span></div>
          <div><span className="text-gray-500 block">Email</span><span className="text-white">{user.email}</span></div>
          <div><span className="text-gray-500 block">WhatsApp</span><span className="text-white">{user.phone}</span></div>
          <div>
            <span className="text-gray-500 block">Status</span>
            <span className={user.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}>{user.status}</span>
          </div>
        </div>
      </div>

      {/* Membership */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Membership</h2>
        {membership ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Mulai</span>
              <span className="text-white">{new Date(membership.startDate).toLocaleDateString('id-ID')}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Berakhir</span>
              <span className="text-white">{new Date(membership.endDate).toLocaleDateString('id-ID')}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Sisa</span>
              <span className={daysLeft <= 7 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{daysLeft} hari</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Tidak ada membership aktif.</p>
        )}
      </div>

      {/* Transaction History */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Riwayat Transaksi</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada transaksi.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0 text-sm">
                <div>
                  <span className="text-white">{t.description || 'Premium Membership'}</span>
                  <span className="text-gray-600 text-xs block">{new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-mono">Rp {t.amount?.toLocaleString('id-ID')}</span>
                  <span className={`text-xs block ${
                    t.status === 'PAID' ? 'text-emerald-400' : t.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'
                  }`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
