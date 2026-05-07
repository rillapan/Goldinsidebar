// FITUR 7 — Admin Dashboard Overview
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">🛡️ Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-gray-500 text-sm">Total Member</span>
          <span className="text-3xl font-bold text-white">{stats?.totalMembers || 0}</span>
        </div>
        <div className="stat-card">
          <span className="text-gray-500 text-sm">Member Aktif</span>
          <span className="text-3xl font-bold text-emerald-400">{stats?.activeMembers || 0}</span>
        </div>
        <div className="stat-card">
          <span className="text-gray-500 text-sm">Total Revenue</span>
          <span className="text-3xl font-bold text-amber-400">Rp {((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M</span>
        </div>
        <div className="stat-card">
          <span className="text-gray-500 text-sm">Win Rate Sinyal</span>
          <span className="text-3xl font-bold text-white">{stats?.winRate || 0}%</span>
          <span className="text-xs text-gray-600">{stats?.totalSignals || 0} total sinyal</span>
        </div>
      </div>
    </div>
  );
}
