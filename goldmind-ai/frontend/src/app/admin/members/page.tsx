// Admin — Members Management
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users } from 'lucide-react';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/members');
        setMembers(res.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-amber-400" /> Manajemen Member</h1>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-dark/50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Nama</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">WhatsApp</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Expired</th>
                <th className="text-left px-4 py-3">Login Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {members.map((m: any) => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-400">{m.email}</td>
                  <td className="px-4 py-3 text-gray-400">{m.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                      m.status === 'EXPIRED' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {m.memberships?.[0]?.endDate ? new Date(m.memberships[0].endDate).toLocaleDateString('id-ID') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString('id-ID') : 'Belum login'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {members.length === 0 && <div className="p-8 text-center text-gray-500">Belum ada member.</div>}
      </div>
    </div>
  );
}
