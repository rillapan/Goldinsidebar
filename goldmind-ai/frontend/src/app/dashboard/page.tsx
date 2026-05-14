'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket, reconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/lib/i18n';
import {
  Lock,
  Zap,
  Newspaper,
  Bot,
  Search,
  Clock,
  ChevronRight,
  Copy,
  Check,
  Star,
} from 'lucide-react';

interface Signal {
  id: string;
  type: 'BUY' | 'SELL';
  status: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
  createdAt: string;
}

interface Bias {
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  reasoning: string;
  date: string;
}

// Estimasi untuk 0.01 lot XAUUSD (1 oz). Kurs USD/IDR adalah pendekatan —
// angka ini tidak dipakai untuk keputusan trading, hanya ilustrasi.
const USD_TO_IDR = 16300;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

function useNextSignalCountdown(): string {
  const [countdown, setCountdown] = useState('--:--');
  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const next = Math.ceil(now / 300000) * 300000;
      const diff = next - now;
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return countdown;
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    } else {
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="ml-1.5 text-gray-600 hover:text-white transition-colors flex-shrink-0"
      title="Salin ke clipboard"
    >
      {copied
        ? <Check className="w-3 h-3 text-emerald-400" />
        : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  if (value >= 85) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/20">
      <Star className="w-3 h-3 fill-current" />
      <Star className="w-3 h-3 fill-current" />
      <Star className="w-3 h-3 fill-current" />
      Sangat Yakin
    </span>
  );
  if (value >= 75) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-medium border border-amber-500/20">
      <Star className="w-3 h-3 fill-current" />
      <Star className="w-3 h-3 fill-current" />
      <Star className="w-3 h-3 stroke-current opacity-30" />
      Yakin
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 font-medium border border-gray-500/20">
      <Star className="w-3 h-3 fill-current" />
      <Star className="w-3 h-3 stroke-current opacity-30" />
      <Star className="w-3 h-3 stroke-current opacity-30" />
      Cukup Yakin
    </span>
  );
}

function PriceProgressBar({ signal, livePrice }: { signal: Signal; livePrice: number | null }) {
  if (!livePrice || signal.status !== 'ACTIVE') return null;
  const isBuy = signal.type === 'BUY';
  // Selalu SL di kiri, TP di kanan untuk visual konsisten
  const [leftVal, rightVal] = isBuy
    ? [signal.stopLoss, signal.takeProfit]
    : [signal.takeProfit, signal.stopLoss];
  const low = Math.min(leftVal, rightVal);
  const high = Math.max(leftVal, rightVal);
  const range = high - low;
  if (range <= 0) return null;
  const pct = Math.max(2, Math.min(98, ((livePrice - low) / range) * 100));
  // Untuk BUY: kanan = TP. Untuk SELL: kanan = SL.
  const nearProfit = isBuy ? pct > 70 : pct < 30;
  const nearLoss   = isBuy ? pct < 30 : pct > 70;
  const dotColor = nearProfit ? '#34d399' : nearLoss ? '#f87171' : '#fbbf24';
  const trackGrad = isBuy
    ? 'from-red-500/30 via-amber-500/20 to-emerald-500/30'
    : 'from-emerald-500/30 via-amber-500/20 to-red-500/30';

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-red-400 font-mono">
          {isBuy ? `SL ${signal.stopLoss.toFixed(2)}` : `TP ${signal.takeProfit.toFixed(2)}`}
        </span>
        <span className="text-gray-500 text-center">
          Harga: <span className="text-white font-mono">{livePrice.toFixed(2)}</span>
        </span>
        <span className="text-emerald-400 font-mono">
          {isBuy ? `TP ${signal.takeProfit.toFixed(2)}` : `SL ${signal.stopLoss.toFixed(2)}`}
        </span>
      </div>
      <div className={`h-2 bg-gradient-to-r ${trackGrad} rounded-full relative`}>
        <div
          className="absolute top-1/2 w-3.5 h-3.5 rounded-full shadow-lg border-2 border-gray-900 transition-all duration-700 z-10"
          style={{
            left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: dotColor,
            boxShadow: `0 0 8px ${dotColor}60`,
          }}
        />
      </div>
      {nearProfit && (
        <p className="text-xs text-emerald-400 mt-1">📈 Mendekati Take Profit</p>
      )}
      {nearLoss && (
        <p className="text-xs text-red-400 mt-1">⚠️ Mendekati Stop Loss — perhatikan manajemen risiko</p>
      )}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-400' : value >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-brand-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : '#f87171' }}
      >
        {value}%
      </span>
    </div>
  );
}

function SignalCard({ signal, livePrice }: { signal: Signal; livePrice?: number | null }) {
  const { t } = useI18n();
  const isBuy = signal.type === 'BUY';
  const rr = Math.abs(signal.takeProfit - signal.entryPrice) / Math.abs(signal.entryPrice - signal.stopLoss);
  const countdown = useNextSignalCountdown();

  // Estimasi P/L untuk 0.01 lot XAUUSD (= 1 oz). Bukan rekomendasi lot size.
  const profitIDR = Math.abs(signal.takeProfit - signal.entryPrice) * USD_TO_IDR;
  const riskIDR   = Math.abs(signal.entryPrice - signal.stopLoss) * USD_TO_IDR;

  return (
    <div className="glass-card p-5 hover:border-amber-500/25 transition-all duration-300 hover:-translate-y-px">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={isBuy ? 'badge-buy' : 'badge-sell'}>{signal.type}</span>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <span className="font-mono">{signal.timeframe}</span>
            <span>·</span>
            <span>XAUUSD</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <ConfidenceBadge value={signal.confidence} />
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">{t.dashboard.active}</span>
          </div>
        </div>
      </div>

      {/* ── Level Harga + Copy + Estimasi IDR ── */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-brand-dark/50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">Entry</span>
          <div className="flex items-center">
            <span className="font-mono font-bold text-white text-sm">{signal.entryPrice.toFixed(2)}</span>
            <CopyValue value={signal.entryPrice.toFixed(2)} />
          </div>
        </div>
        <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
          <span className="text-xs text-gray-500 block mb-1">Stop Loss</span>
          <div className="flex items-center">
            <span className="font-mono font-bold text-red-400 text-sm">{signal.stopLoss.toFixed(2)}</span>
            <CopyValue value={signal.stopLoss.toFixed(2)} />
          </div>
          <span className="text-xs text-red-400/50 mt-0.5 block">~Rp {formatIDR(riskIDR)}</span>
        </div>
        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
          <span className="text-xs text-gray-500 block mb-1">Take Profit</span>
          <div className="flex items-center">
            <span className="font-mono font-bold text-emerald-400 text-sm">{signal.takeProfit.toFixed(2)}</span>
            <CopyValue value={signal.takeProfit.toFixed(2)} />
          </div>
          <span className="text-xs text-emerald-400/50 mt-0.5 block">~Rp {formatIDR(profitIDR)}</span>
        </div>
      </div>

      {/* ── Progress Bar: posisi harga saat ini antara SL dan TP ── */}
      <PriceProgressBar signal={signal} livePrice={livePrice ?? null} />

      {/* ── Confidence + R/R ── */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1.5">{t.dashboard.confidenceAi}</p>
          <ConfidenceBar value={signal.confidence} />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500 mb-0.5">{t.dashboard.riskReward}</p>
          <p className="text-sm font-bold text-amber-400">1:{rr.toFixed(1)}</p>
        </div>
      </div>

      {/* ── Reasoning ("Kenapa AI memilih ini?") ── */}
      <div className="border-t border-brand-border pt-3">
        <p className="text-xs text-gray-500 font-medium mb-1.5">💡 Kenapa AI memilih ini?</p>
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{signal.reasoning}</p>
      </div>

      {/* ── Footer: Waktu rilis + Countdown update berikutnya ── */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border/40">
        <span className="text-gray-600 text-xs">Dibuat {timeAgo(signal.createdAt)}</span>
        <span className="text-gray-600 text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Update dalam {countdown}
        </span>
      </div>
    </div>
  );
}

import { ModalPricing, type PlanOption } from '@/components/ui/modal-pricing';

function UpgradeOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plans: PlanOption[] = t.dashboard.plans.map((p) => ({
    id: 'pro',
    name: p.name,
    price: p.price,
    description: p.description,
    features: [...p.features],
  }));

  return (
    <div className="relative">
      <div className="grid gap-4 md:grid-cols-2 pointer-events-none select-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 h-48 blur-sm opacity-40 bg-brand-card/60" />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center p-6">
          <Lock className="w-10 h-10 text-amber-400" />
          <h3 className="text-xl font-bold text-white mb-2">{t.dashboard.signalsLocked}</h3>
          <p className="text-gray-400 text-sm mb-6">{t.dashboard.signalsLockedDesc}</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-gold rounded-xl px-6 py-3 font-semibold text-base shadow-lg shadow-amber-500/20">
            {t.dashboard.viewPremium}
          </button>
        </div>
      </div>
      <ModalPricing
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={onUpgrade}
        plans={plans}
      />
    </div>
  );
}

function UpgradeBiasCard({ onUpgrade }: { onUpgrade: () => void }) {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plans: PlanOption[] = t.dashboard.plans.map((p) => ({
    id: 'pro',
    name: p.name,
    price: p.price,
    description: p.description,
    features: [...p.features],
  }));

  return (
    <div className="glass-card p-6 text-center border-amber-500/10 relative">
      <Lock className="w-6 h-6 text-amber-400" />
      <p className="text-white font-semibold mb-1">{t.dashboard.dailyBiasProOnly}</p>
      <p className="text-gray-500 text-sm mb-4">{t.dashboard.dailyBiasProDesc}</p>
      <button onClick={() => setIsModalOpen(true)} className="btn-gold rounded-lg px-6 py-2 text-sm font-medium">
        {t.dashboard.upgradeAccess}
      </button>
      <ModalPricing
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={onUpgrade}
        plans={plans}
      />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { fetchUser } = useAuthStore();
  const { t, locale } = useI18n();
  const [activeSignals, setActiveSignals] = useState<Signal[]>([]);
  const [todayBias, setTodayBias]         = useState<Bias | null>(null);
  const [livePrice, setLivePrice]         = useState<number | null>(null);
  const [loading, setLoading]             = useState(true);
  const [isLocked, setIsLocked]           = useState(false);
  const [upgrading, setUpgrading]         = useState(false);

  const handleUpgrade = () => router.push('/checkout');

  const quickActionIcons = [Zap, Newspaper, Bot];
  const quickActionHrefs = ['/signals', '/bias', '/chat'];
  const quickActionColors = ['amber', 'blue', 'emerald'] as const;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [signalRes, biasRes] = await Promise.all([
          api.get('/signals/active'),
          api.get('/bias/today'),
        ]);
        setActiveSignals(signalRes.data.data || []);
        setTodayBias(biasRes.data.data);
        setIsLocked(false);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setIsLocked(true);
        } else {
          console.error('Dashboard fetch error:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const socket = getSocket();

    socket.on('new_signal', (signal: Signal) => {
      setActiveSignals((prev) => [signal, ...prev]);
    });
    socket.on('price_update', (data: { price: number }) => {
      setLivePrice(data.price);
    });
    socket.on('signal_update', (update: Partial<Signal> & { id: string }) => {
      setActiveSignals((prev) => prev.map((s) => (s.id === update.id ? { ...s, ...update } : s)));
    });

    socket.on('user_upgraded', async () => {
      console.log('🎉 user_upgraded received — membuka akses premium...');
      setUpgrading(true);
      await fetchUser();
      try {
        const [signalRes, biasRes] = await Promise.all([
          api.get('/signals/active'),
          api.get('/bias/today'),
        ]);
        setActiveSignals(signalRes.data.data || []);
        setTodayBias(biasRes.data.data);
        setIsLocked(false);
      } catch {}

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        reconnectSocket(session.access_token);
      }
      setUpgrading(false);
    });

    return () => {
      socket.off('new_signal');
      socket.off('price_update');
      socket.off('signal_update');
      socket.off('user_upgraded');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse bg-brand-card/60" />
          ))}
        </div>
        <div className="glass-card p-6 h-40 animate-pulse bg-brand-card/60" />
        <div className="glass-card p-6 h-32 animate-pulse bg-brand-card/60" />
      </div>
    );
  }

  if (upgrading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white font-semibold">{t.dashboard.activating}</p>
          <p className="text-gray-500 text-sm">{t.dashboard.activatingDesc}</p>
        </div>
      </div>
    );
  }

  const biasColorClass = {
    BUY:  { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', badge: 'badge-buy'  },
    SELL: { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     badge: 'badge-sell' },
    WAIT: { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   badge: 'badge-wait' },
  };
  const biasStyle = todayBias ? biasColorClass[todayBias.direction] : null;
  const dateLocale = locale === 'en' ? 'en-US' : 'id-ID';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page Heading ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.dashboard.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLocked && (
            <button
              onClick={handleUpgrade}
              className="btn-gold rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {t.dashboard.upgradePro}
            </button>
          )}
          {!isLocked && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.dashboard.liveData}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card col-span-2 sm:col-span-1 bg-gradient-to-br from-amber-500/8 to-transparent border-amber-500/15">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-500 text-xs">{t.dashboard.xauusd}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.dashboard.live}
            </span>
          </div>
          <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
            {livePrice ? `$${livePrice.toFixed(2)}` : <span className="text-gray-600">—</span>}
          </span>
          <span className="text-xs text-gray-600">{t.dashboard.realtimeSocket}</span>
        </div>

        <div className="stat-card">
          <span className="text-gray-500 text-xs">{t.dashboard.activeSignals}</span>
          <span className="text-3xl font-black text-white">{isLocked ? '—' : activeSignals.length}</span>
          <span className="text-xs text-gray-600">{isLocked ? t.dashboard.upgradeForAccess : t.dashboard.openPositions}</span>
        </div>

        <div className={`stat-card ${biasStyle ? `${biasStyle.bg} ${biasStyle.border}` : ''}`}>
          <span className="text-gray-500 text-xs">{t.dashboard.marketBias}</span>
          <span className={`text-2xl font-black ${biasStyle?.text ?? 'text-gray-600'}`}>
            {isLocked ? '—' : (todayBias?.direction ?? '—')}
          </span>
          <span className="text-xs text-gray-600">{t.dashboard.today}</span>
        </div>

        <div className="stat-card">
          <span className="text-gray-500 text-xs">{t.dashboard.confidence}</span>
          <span className="text-3xl font-black text-white">{isLocked ? '—' : `${todayBias?.confidence ?? 0}%`}</span>
          {!isLocked && <ConfidenceBar value={todayBias?.confidence ?? 0} />}
        </div>
      </div>

      {/* ── Daily Bias ── */}
      {isLocked ? (
        <UpgradeBiasCard onUpgrade={handleUpgrade} />
      ) : todayBias ? (
        <div className={`glass-card p-6 ${biasStyle?.border} bg-gradient-to-br ${biasStyle?.bg} to-transparent`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${biasStyle?.bg} ${biasStyle?.border} border flex items-center justify-center text-xl flex-shrink-0`}>
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">{t.dashboard.dailyBiasTitle}</h2>
                <p className="text-gray-500 text-xs">
                  {new Date(todayBias.date).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            <span className={biasStyle?.badge}>{todayBias.direction}</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{todayBias.reasoning}</p>
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <Clock className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t.dashboard.dailyBiasEmpty}</p>
        </div>
      )}

      {/* ── Active Signals ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white">{t.dashboard.activeSignals}</h2>
            {!isLocked && activeSignals.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                {activeSignals.length}
              </span>
            )}
          </div>
          {!isLocked && (
            <a href="/signals" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
              {t.dashboard.viewAll}
            </a>
          )}
        </div>

        {isLocked ? (
          <UpgradeOverlay onUpgrade={handleUpgrade} />
        ) : activeSignals.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Search className="w-10 h-10 text-gray-500 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">{t.dashboard.noActiveSignals}</p>
            <p className="text-gray-500 text-sm">{t.dashboard.noActiveSignalsDesc}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} livePrice={livePrice} />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      {!isLocked && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {t.dashboard.quickActions.map((action, i) => {
            const Icon = quickActionIcons[i];
            const href = quickActionHrefs[i];
            const color = quickActionColors[i];
            const colorMap: Record<string, string> = {
              amber:   'hover:border-amber-500/30 hover:bg-amber-500/5',
              blue:    'hover:border-blue-500/30 hover:bg-blue-500/5',
              emerald: 'hover:border-emerald-500/30 hover:bg-emerald-500/5',
            };
            const iconColorMap: Record<string, string> = {
              amber:   'text-amber-400',
              blue:    'text-blue-400',
              emerald: 'text-emerald-400',
            };
            return (
              <a key={href} href={href}
                className={`glass-card p-5 flex items-center gap-4 transition-all duration-200 group ${colorMap[color]}`}
              >
                <Icon className={`w-6 h-6 ${iconColorMap[color]}`} />
                <div>
                  <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">{action.label}</p>
                  <p className="text-gray-500 text-xs">{action.desc}</p>
                </div>
                <span className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
