'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/lib/i18n';
import { getStoredTheme, setTheme } from '@/lib/theme';
import {
  UserCircle, Shield, Bell, Settings2, HelpCircle,
  Monitor, Sun, Moon, Globe, DollarSign,
  Lock, ChevronRight, ExternalLink, Info,
  Eye, EyeOff, CheckCircle2, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────

type Tab = 'akun' | 'tampilan' | 'notifikasi' | 'trading' | 'bantuan';
type Currency = 'USD' | 'IDR' | 'BOTH';
type ThemeOption = 'dark' | 'light' | 'system';

interface NotifPrefs {
  signalBaru: boolean;
  dailyBias: boolean;
  channelBrowser: boolean;
  channelWA: boolean;
  channelTelegram: boolean;
}

// ─── Helpers ──────────────────────────────────────────────

function getNotifPrefs(): NotifPrefs {
  if (typeof window === 'undefined') return { signalBaru: true, dailyBias: true, channelBrowser: false, channelWA: true, channelTelegram: true };
  try { return JSON.parse(localStorage.getItem('gm_notif_prefs') || '{}'); } catch { return {} as NotifPrefs; }
}

function saveNotifPrefs(prefs: NotifPrefs) {
  localStorage.setItem('gm_notif_prefs', JSON.stringify(prefs));
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Tab navigation icons + labels ───────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'akun',       label: 'Akun',        icon: <UserCircle className="w-4 h-4" /> },
  { id: 'tampilan',   label: 'Tampilan',     icon: <Monitor className="w-4 h-4" /> },
  { id: 'notifikasi', label: 'Notifikasi',   icon: <Bell className="w-4 h-4" /> },
  { id: 'trading',    label: 'Trading',      icon: <Settings2 className="w-4 h-4" /> },
  { id: 'bantuan',    label: 'Bantuan',      icon: <HelpCircle className="w-4 h-4" /> },
];

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('akun');

  if (!user) return null;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <UserCircle className="w-6 h-6 text-amber-400" />
        Profil & Pengaturan
      </h1>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'akun'       && <TabAkun user={user} setUser={setUser} />}
      {activeTab === 'tampilan'   && <TabTampilan />}
      {activeTab === 'notifikasi' && <TabNotifikasi />}
      {activeTab === 'trading'    && <TabTrading />}
      {activeTab === 'bantuan'    && <TabBantuan />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1 — AKUN
// ═══════════════════════════════════════════════════════════

function TabAkun({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const [name, setName]   = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [pwNew, setPwNew]     = useState('');
  const [pwConf, setPwConf]   = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwMsg, setPwMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);

  const membership = user.activeMembership;
  const daysLeft   = membership
    ? Math.max(0, Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  useEffect(() => {
    api.get('/payments/history').then(r => setTransactions(r.data.data?.slice(0, 20) || [])).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await api.patch('/auth/me', { name: name.trim(), phone: phone.trim() });
      setUser({ ...user, name: res.data.user.name, phone: res.data.user.phone });
      setSaveMsg({ type: 'ok', text: 'Profil berhasil diperbarui.' });
    } catch (err: any) {
      const code = err.response?.data?.error;
      const msg = code === 'NAME_TOO_SHORT' ? 'Nama minimal 2 karakter.'
                : code === 'PHONE_INVALID' ? 'Format nomor WA tidak valid (08xx atau 628xx).'
                : 'Gagal menyimpan. Coba lagi.';
      setSaveMsg({ type: 'err', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (pwNew.length < 8) { setPwMsg({ type: 'err', text: 'Password minimal 8 karakter.' }); return; }
    if (pwNew !== pwConf) { setPwMsg({ type: 'err', text: 'Konfirmasi password tidak sama.' }); return; }
    setPwSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw error;
      setPwMsg({ type: 'ok', text: 'Password berhasil diubah.' });
      setPwNew(''); setPwConf('');
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.message || 'Gagal mengubah password.' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Avatar + Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-gold flex items-center justify-center text-brand-dark font-bold text-lg flex-shrink-0">
            {initials(user.name)}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nama Lengkap</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-brand-darker border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email (tidak dapat diubah)</label>
            <div className="flex items-center gap-2 bg-brand-darker border border-brand-border rounded-lg px-3 py-2">
              <Lock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <span className="text-sm text-gray-400">{user.email}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nomor WhatsApp</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="08xx atau 628xx"
              className="w-full bg-brand-darker border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {saveMsg && (
            <div className={`flex items-center gap-2 text-sm ${saveMsg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              {saveMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {saveMsg.text}
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn-gold text-sm py-2 px-4 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Membership */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3">Membership</h3>
        {membership ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="badge-buy text-xs">AKTIF</span>
              <p className="text-xs text-gray-500 mt-1">
                Berakhir {new Date(membership.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${daysLeft <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>{daysLeft} hari</p>
              <a href="/checkout" className="text-xs text-amber-400 hover:underline flex items-center gap-1 justify-end mt-1">
                Perpanjang <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">Tidak ada membership aktif.</p>
            <a href="/checkout" className="btn-gold text-xs py-1.5 px-3">Langganan</a>
          </div>
        )}
      </div>

      {/* Keamanan */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" /> Keamanan
        </h3>

        {/* Ganti Password */}
        <div className="mb-4">
          <p className="text-sm font-medium text-white mb-2">Ganti Password</p>
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwNew}
                onChange={e => setPwNew(e.target.value)}
                placeholder="Password baru (min. 8 karakter)"
                className="w-full bg-brand-darker border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 pr-9"
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input
              type={showPw ? 'text' : 'password'}
              value={pwConf}
              onChange={e => setPwConf(e.target.value)}
              placeholder="Konfirmasi password baru"
              className="w-full bg-brand-darker border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {pwMsg && (
            <div className={`flex items-center gap-2 text-sm mt-2 ${pwMsg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              {pwMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pwMsg.text}
            </div>
          )}

          <button
            onClick={changePassword}
            disabled={pwSaving || !pwNew}
            className="mt-3 text-sm bg-brand-card border border-brand-border hover:border-amber-500/40 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {pwSaving ? 'Memproses...' : 'Ubah Password'}
          </button>
        </div>

        {/* 2FA */}
        <div className="border-t border-brand-border pt-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-gray-500 mt-0.5">Lapisan keamanan ekstra dengan kode OTP saat login</p>
            </div>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Segera Hadir</span>
          </div>
        </div>

        {/* KYC */}
        <div className="border-t border-brand-border pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Verifikasi Akun (KYC)</p>
              <p className="text-xs text-gray-500 mt-0.5">Diperlukan untuk fitur transaksi di masa depan</p>
            </div>
            <span className="text-xs bg-brand-card border border-brand-border text-gray-400 px-2 py-0.5 rounded-full">Belum Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3">Riwayat Transaksi</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada transaksi.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0 text-sm">
                <div>
                  <span className="text-white">{t.description || 'Premium Membership'}</span>
                  <span className="text-gray-600 text-xs block">{new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-mono text-xs">Rp {t.amount?.toLocaleString('id-ID')}</span>
                  <span className={`text-xs block ${t.status === 'PAID' ? 'text-emerald-400' : t.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2 — TAMPILAN
// ═══════════════════════════════════════════════════════════

function TabTampilan() {
  const { locale, setLocale } = useI18n();
  const [themeOpt, setThemeOpt] = useState<ThemeOption>('dark');
  const [currency, setCurrency] = useState<Currency>('USD');

  useEffect(() => {
    const stored = localStorage.getItem('gm_theme') as ThemeOption || 'dark';
    setThemeOpt(stored);
    setCurrency((localStorage.getItem('gm_currency') as Currency) || 'USD');
  }, []);

  const applyTheme = (opt: ThemeOption) => {
    setThemeOpt(opt);
    if (opt === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      localStorage.setItem('gm_theme', 'system');
    } else {
      setTheme(opt);
    }
  };

  const applyCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('gm_currency', c);
  };

  return (
    <div className="space-y-4">
      {/* Mode Tampilan */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Monitor className="w-4 h-4 text-amber-400" /> Mode Tampilan</h3>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'dark',   label: 'Malam',  icon: <Moon className="w-5 h-5" /> },
            { id: 'light',  label: 'Terang', icon: <Sun className="w-5 h-5" /> },
            { id: 'system', label: 'Sistem', icon: <Monitor className="w-5 h-5" /> },
          ] as { id: ThemeOption; label: string; icon: React.ReactNode }[]).map(opt => (
            <button
              key={opt.id}
              onClick={() => applyTheme(opt.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-sm ${
                themeOpt === opt.id
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-brand-border text-gray-400 hover:border-brand-accent/30 hover:text-white'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bahasa */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-amber-400" /> Bahasa</h3>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'id', label: '🇮🇩 Indonesia' },
            { id: 'en', label: '🇬🇧 English' },
          ] as { id: 'id' | 'en'; label: string }[]).map(opt => (
            <button
              key={opt.id}
              onClick={() => setLocale(opt.id)}
              className={`py-2.5 rounded-xl border text-sm transition-all ${
                locale === opt.id
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-brand-border text-gray-400 hover:border-brand-accent/30 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Format Mata Uang */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-400" /> Format Mata Uang</h3>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'USD',  label: 'USD saja' },
            { id: 'IDR',  label: 'IDR saja' },
            { id: 'BOTH', label: 'USD & IDR' },
          ] as { id: Currency; label: string }[]).map(opt => (
            <button
              key={opt.id}
              onClick={() => applyCurrency(opt.id)}
              className={`py-2.5 rounded-xl border text-sm transition-all ${
                currency === opt.id
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-brand-border text-gray-400 hover:border-brand-accent/30 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">Berlaku di halaman Jurnal dan Statistik.</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 3 — NOTIFIKASI
// ═══════════════════════════════════════════════════════════

function TabNotifikasi() {
  const { user } = useAuthStore();
  const defaultPrefs: NotifPrefs = { signalBaru: true, dailyBias: true, channelBrowser: false, channelWA: true, channelTelegram: true };
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);

  useEffect(() => {
    const stored = getNotifPrefs();
    setPrefs({ ...defaultPrefs, ...stored });
  }, []);

  const toggle = (key: keyof NotifPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    saveNotifPrefs(next);
  };

  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      const next = { ...prefs, channelBrowser: true };
      setPrefs(next);
      saveNotifPrefs(next);
    }
  };

  const Switch = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-amber-500' : 'bg-brand-border'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Jenis Notifikasi */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400" /> Jenis Notifikasi</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">⚡ Sinyal Baru</p>
              <p className="text-xs text-gray-500">Notifikasi saat ada sinyal BUY/SELL baru</p>
            </div>
            <Switch on={prefs.signalBaru} onChange={() => toggle('signalBaru')} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">📰 Daily Market Bias</p>
              <p className="text-xs text-gray-500">Notifikasi setiap pukul 07.00 WIB</p>
            </div>
            <Switch on={prefs.dailyBias} onChange={() => toggle('dailyBias')} />
          </div>
        </div>
      </div>

      {/* Saluran */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4">Saluran Notifikasi</h3>
        <div className="space-y-4">
          {/* Browser */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">🌐 Browser Push</p>
              <p className="text-xs text-gray-500">Notifikasi langsung di browser (perlu izin)</p>
            </div>
            <button
              onClick={prefs.channelBrowser ? () => toggle('channelBrowser') : requestBrowserPermission}
              className={`relative w-11 h-6 rounded-full transition-colors ${prefs.channelBrowser ? 'bg-amber-500' : 'bg-brand-border'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${prefs.channelBrowser ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* WA */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">📱 WhatsApp</p>
              <p className="text-xs text-gray-500">Ke nomor {user?.phone || '—'} — dikelola backend</p>
            </div>
            <span className="text-xs text-gray-500 bg-brand-card border border-brand-border px-2 py-0.5 rounded">Info</span>
          </div>

          {/* Telegram */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">✈️ Telegram</p>
              <p className="text-xs text-gray-500">
                Channel <a href="https://t.me/Sinyal_cohiba_bot" target="_blank" rel="noopener" className="text-amber-400 hover:underline">@SinyalCohiba</a>
              </p>
            </div>
            <span className="text-xs text-gray-500 bg-brand-card border border-brand-border px-2 py-0.5 rounded">Info</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 4 — TRADING
// ═══════════════════════════════════════════════════════════

function TabTrading() {
  const [defaultLot, setDefaultLot] = useState('0.01');

  useEffect(() => {
    const stored = localStorage.getItem('gm_default_lot');
    if (stored) setDefaultLot(stored);
  }, []);

  const saveLot = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0.01 || n > 10) return;
    setDefaultLot(val);
    localStorage.setItem('gm_default_lot', val);
  };

  return (
    <div className="space-y-4">
      {/* Default Lot */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Settings2 className="w-4 h-4 text-amber-400" /> Default Lot Size</h3>
        <p className="text-xs text-gray-500 mb-3">Ukuran lot default yang muncul saat mencatat trade di Jurnal.</p>
        <div className="flex items-center gap-2">
          <button onClick={() => saveLot((Math.max(0.01, parseFloat(defaultLot) - 0.01)).toFixed(2))}
            className="w-9 h-9 rounded-lg border border-brand-border hover:border-amber-500/40 text-gray-400 hover:text-white transition-colors text-lg font-bold">−</button>
          <input
            type="number"
            min={0.01} max={10} step={0.01}
            value={defaultLot}
            onChange={e => saveLot(e.target.value)}
            className="w-24 text-center bg-brand-darker border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50"
          />
          <button onClick={() => saveLot((Math.min(10, parseFloat(defaultLot) + 0.01)).toFixed(2))}
            className="w-9 h-9 rounded-lg border border-brand-border hover:border-amber-500/40 text-gray-400 hover:text-white transition-colors text-lg font-bold">+</button>
          <span className="text-gray-500 text-sm">lot</span>
        </div>
      </div>

      {/* Broker Placeholder */}
      <div className="glass-card p-5 opacity-70">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-500" /> Koneksi Broker
            </h3>
            <p className="text-xs text-gray-500">Sinkronisasi otomatis trade dari MetaTrader ke Jurnal.</p>
          </div>
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">🚧 Coming Soon</span>
        </div>
        <a
          href="https://wa.me/6281234567890"
          target="_blank" rel="noopener"
          className="mt-3 text-xs text-amber-400 hover:underline inline-flex items-center gap-1"
        >
          Ingin fitur ini? Beritahu kami <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 5 — BANTUAN
// ═══════════════════════════════════════════════════════════

function TabBantuan() {
  return (
    <div className="space-y-4">
      {/* Support */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-amber-400" /> Bantuan & Support</h3>
        <div className="space-y-2">
          <a
            href="https://wa.me/6281234567890?text=Halo%20CS%20SINYAL%20COHIBA"
            target="_blank" rel="noopener"
            className="flex items-center justify-between p-3 rounded-xl border border-brand-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
          >
            <span className="text-sm text-white">📱 Hubungi CS via WhatsApp</span>
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </a>
          <a
            href="/#faq"
            className="flex items-center justify-between p-3 rounded-xl border border-brand-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
          >
            <span className="text-sm text-white">❓ FAQ</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </a>
        </div>
      </div>

      {/* Tentang */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-amber-400" /> Tentang GoldMind AI</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Nama Platform</span><span className="text-white">SINYAL COHIBA</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Versi</span><span className="text-white">v1.0.0</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Developer</span><span className="text-white">Rillapan Code</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Powered by</span><span className="text-white">Claude AI (Anthropic)</span></div>
        </div>
      </div>

      {/* Legal */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3">Dokumen Legal</h3>
        <div className="space-y-2">
          {[
            { label: '📋 Kebijakan Privasi', href: '/privacy' },
            { label: '📜 Syarat & Ketentuan', href: '/terms' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center justify-between p-3 rounded-xl border border-brand-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
            >
              <span className="text-sm text-white">{link.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </a>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-600 text-center">
        ⚠️ Trading mengandung risiko tinggi. Past performance bukan jaminan profit.
      </p>
    </div>
  );
}
