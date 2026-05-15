'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Send,
  CheckCircle,
  XCircle,
  ExternalLink,
  Bell,
  BellOff,
  Loader2,
  LogOut,
  Users,
  MessageSquare,
  BarChart2,
} from 'lucide-react';

interface TelegramStatus {
  connected: boolean;
  username: string | null;
  id: string | null;
  settings: {
    receiveSignal: boolean;
    receiveDailyBias: boolean;
    receiveWeeklyReport: boolean;
  };
}

const defaultSettings = {
  receiveSignal: true,
  receiveDailyBias: true,
  receiveWeeklyReport: true,
};

export default function TelegramPage() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/telegram/status');
      setStatus({
        connected: res.data.data.connected,
        username: res.data.data.username,
        id: res.data.data.id,
        settings: res.data.data.settings ?? defaultSettings,
      });
    } catch {
      setStatus({ connected: false, username: null, id: null, settings: defaultSettings });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleConnect = async () => {
    setActionLoading('connect');
    try {
      const res = await api.post('/telegram/magic-link');
      window.open(res.data.link, '_blank');
      showToast('Link berhasil dibuat! Klik "Start" di bot Telegram.', true);
      setTimeout(fetchStatus, 5000);
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Gagal membuat link.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTest = async () => {
    setActionLoading('test');
    try {
      const res = await api.post('/telegram/test');
      showToast(res.data.message, true);
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Gagal mengirim notifikasi.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Putuskan koneksi Telegram dari akun ini?')) return;
    setActionLoading('disconnect');
    try {
      await api.post('/telegram/disconnect');
      showToast('Telegram berhasil diputuskan.', true);
      await fetchStatus();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Gagal memutuskan koneksi.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChannelInvite = async () => {
    setActionLoading('channel');
    try {
      const res = await api.post('/telegram/channel-invite');
      window.open(res.data.link, '_blank');
      showToast('Link undangan channel berhasil dibuat!', true);
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Gagal membuat link channel.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrefChange = async (key: keyof TelegramStatus['settings']) => {
    if (!status) return;
    const updated = { ...status.settings, [key]: !status.settings[key] };
    setStatus((s) => s ? { ...s, settings: updated } : s);
    try {
      await api.put('/telegram/preferences', updated);
    } catch {
      setStatus((s) => s ? { ...s, settings: status.settings } : s);
      showToast('Gagal menyimpan preferensi.', false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const isConnected = status?.connected ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          toast.ok
            ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300'
            : 'bg-red-900/90 border-red-500/30 text-red-300'
        }`}>
          {toast.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 flex items-center justify-center">
            <Send className="w-5 h-5 text-[#229ED9]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Integrasi Telegram</h1>
            <p className="text-sm text-gray-400">Terima sinyal langsung di Telegram</p>
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl border p-5 ${
        isConnected
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-brand-card border-brand-border'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <div>
              <p className="text-sm font-semibold text-white">
                {isConnected ? 'Terhubung' : 'Belum Terhubung'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isConnected && status?.username
                  ? `@${status.username}`
                  : 'Hubungkan akun Telegram Anda untuk menerima notifikasi'}
              </p>
            </div>
          </div>

          {isConnected ? (
            <div className="flex gap-2">
              <button
                onClick={handleTest}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-xs font-medium hover:bg-[#229ED9]/20 transition-all disabled:opacity-50"
              >
                {actionLoading === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                Test
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {actionLoading === 'disconnect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Putuskan
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={!!actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#229ED9] hover:bg-[#1a8bbf] text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-[0_0_16px_rgba(34,158,217,0.25)]"
            >
              {actionLoading === 'connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Hubungkan Sekarang
            </button>
          )}
        </div>
      </div>

      {/* Notification preferences */}
      {isConnected && status && (
        <div className="rounded-2xl border border-brand-border bg-brand-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Preferensi Notifikasi</h2>
          <div className="space-y-3">
            <PrefRow
              icon={<Loader2 className="w-4 h-4 text-amber-400" />}
              iconBg="bg-amber-500/10"
              label="Sinyal Trading (BUY/SELL)"
              desc="Notifikasi setiap ada sinyal baru masuk"
              active={status.settings.receiveSignal}
              onToggle={() => handlePrefChange('receiveSignal')}
            />
            <PrefRow
              icon={<BarChart2 className="w-4 h-4 text-sky-400" />}
              iconBg="bg-sky-500/10"
              label="Daily Market Bias"
              desc="Analisa fundamental harian pukul 07.00 WIB"
              active={status.settings.receiveDailyBias}
              onToggle={() => handlePrefChange('receiveDailyBias')}
            />
            <PrefRow
              icon={<MessageSquare className="w-4 h-4 text-violet-400" />}
              iconBg="bg-violet-500/10"
              label="Laporan P/L Mingguan"
              desc="Rekap performa trading setiap akhir pekan"
              active={status.settings.receiveWeeklyReport}
              onToggle={() => handlePrefChange('receiveWeeklyReport')}
            />
          </div>
        </div>
      )}

      {/* Channel VIP */}
      {isConnected && (
        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-[#229ED9]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Channel VIP</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Gabung ke channel eksklusif khusus member aktif. Link hanya berlaku 5 menit dan satu kali pakai.
                </p>
              </div>
            </div>
            <button
              onClick={handleChannelInvite}
              disabled={!!actionLoading}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-xs font-medium hover:bg-[#229ED9]/20 transition-all disabled:opacity-50"
            >
              {actionLoading === 'channel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              Gabung Channel
            </button>
          </div>
        </div>
      )}

      {/* Bot commands info */}
      <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Perintah Bot Telegram</h2>
        <div className="space-y-2">
          {[
            { cmd: '/status', desc: 'Cek status langganan & info akun' },
            { cmd: '/signal', desc: 'Lihat sinyal aktif terbaru' },
            { cmd: '/help',   desc: 'Panduan cara membaca sinyal' },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex items-center gap-3">
              <code className="text-xs bg-white/5 border border-white/10 rounded px-2 py-0.5 text-amber-400 font-mono w-20 text-center flex-shrink-0">
                {cmd}
              </code>
              <span className="text-xs text-gray-400">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrefRow({
  icon,
  iconBg,
  label,
  desc,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-white font-medium">{label}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none ${
          active ? 'bg-emerald-500' : 'bg-white/10'
        }`}
        style={{ height: '22px', width: '40px' }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${
            active ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
          style={{ width: '18px', height: '18px' }}
        />
      </button>
    </div>
  );
}
