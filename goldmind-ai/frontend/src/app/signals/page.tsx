// Halaman Sinyal Trading — daftar aktif & riwayat
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import { Zap, Copy, Check, Clock, Star, BookOpen } from 'lucide-react';

// ── Tipe data ────────────────────────────────────────────
interface Signal {
  id: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  status: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
  createdAt: string;
  closedAt?: string;
  pnlPips?: number;
  exitPrice?: number;
}

// ── Konstanta estimasi IDR ────────────────────────────────
const USD_TO_IDR = 16300;

// ── Helpers ───────────────────────────────────────────────
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

// ── Komponen kecil ────────────────────────────────────────
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
    <button onClick={copy} className="ml-1.5 text-gray-600 hover:text-white transition-colors flex-shrink-0" title="Salin">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-400' : value >= 60 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : '#f87171';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color: textColor }}>{value}%</span>
    </div>
  );
}

function PriceProgressBar({ signal, livePrice }: { signal: Signal; livePrice: number | null }) {
  if (!livePrice || signal.status !== 'ACTIVE') return null;
  const isBuy = signal.type === 'BUY';
  const low = Math.min(signal.stopLoss, signal.takeProfit);
  const high = Math.max(signal.stopLoss, signal.takeProfit);
  const range = high - low;
  if (range <= 0) return null;
  const pct = Math.max(2, Math.min(98, ((livePrice - low) / range) * 100));
  const tpIsHigher = signal.takeProfit > signal.stopLoss;
  const nearTP = tpIsHigher ? pct > 70 : pct < 30;
  const nearSL = tpIsHigher ? pct < 30 : pct > 70;
  const dotColor = nearTP ? '#34d399' : nearSL ? '#f87171' : '#fbbf24';
  const trackGrad = isBuy
    ? 'from-red-500/30 via-amber-500/20 to-emerald-500/30'
    : 'from-emerald-500/30 via-amber-500/20 to-red-500/30';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-red-400 font-mono">
          {isBuy ? `SL ${signal.stopLoss.toFixed(2)}` : `TP ${signal.takeProfit.toFixed(2)}`}
        </span>
        <span className="text-gray-500">
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
      {nearTP && <p className="text-xs text-emerald-400 mt-1">📈 Mendekati Take Profit</p>}
      {nearSL && <p className="text-xs text-red-400 mt-1">⚠️ Mendekati Stop Loss</p>}
    </div>
  );
}

// ── Kartu Sinyal ──────────────────────────────────────────
function ActiveSignalCard({ signal, livePrice }: { signal: Signal; livePrice: number | null }) {
  const isBuy = signal.type === 'BUY';
  const rr = Math.abs(signal.takeProfit - signal.entryPrice) / Math.abs(signal.entryPrice - signal.stopLoss);
  const countdown = useNextSignalCountdown();
  const profitIDR = Math.abs(signal.takeProfit - signal.entryPrice) * USD_TO_IDR;
  const riskIDR   = Math.abs(signal.entryPrice - signal.stopLoss) * USD_TO_IDR;
  const router = useRouter();

  return (
    <div className="glass-card p-5 hover:border-amber-500/30 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={isBuy ? 'badge-buy' : 'badge-sell'}>{signal.type}</span>
          <span className="text-gray-500 text-xs font-mono">{signal.timeframe}</span>
          <span className="text-gray-600 text-xs">· XAUUSD</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <ConfidenceBadge value={signal.confidence} />
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">AKTIF</span>
          </div>
        </div>
      </div>

      {/* Level harga + copy + estimasi IDR */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-gray-900/50 rounded-lg p-3">
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

      {/* Progress bar */}
      <PriceProgressBar signal={signal} livePrice={livePrice} />

      {/* Confidence */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1.5">Keyakinan AI</p>
          <ConfidenceBar value={signal.confidence} />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500 mb-0.5">Risk/Reward</p>
          <p className="text-sm font-bold text-amber-400">1:{rr.toFixed(1)}</p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="border-t border-gray-800 pt-3">
        <p className="text-xs text-gray-500 font-medium mb-1.5">💡 Kenapa AI memilih ini?</p>
        <p className="text-gray-400 text-xs leading-relaxed">{signal.reasoning}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60">
        <span className="text-gray-600 text-xs">Dibuat {timeAgo(signal.createdAt)}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/journal?entry=${signal.entryPrice}&tp=${signal.takeProfit}&sl=${signal.stopLoss}`)}
            className="flex items-center gap-1.5 text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
            title="Salin ke Jurnal"
          >
            <BookOpen className="w-3 h-3" />
            Salin ke Jurnal
          </button>
          <span className="text-gray-600 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Update dalam {countdown}
          </span>
        </div>
      </div>
    </div>
  );
}

function HistorySignalCard({ signal }: { signal: Signal }) {
  const isBuy = signal.type === 'BUY';
  const isWin = signal.status === 'TP_HIT' || signal.status === 'PARTIAL_TP';
  const pnlIDR = signal.pnlPips != null ? Math.abs(signal.pnlPips) * 10 * USD_TO_IDR / 100 : null;

  return (
    <div className="glass-card p-5 hover:border-gray-700/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={isBuy ? 'badge-buy' : 'badge-sell'}>{signal.type}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            signal.status === 'TP_HIT'  ? 'bg-emerald-500/20 text-emerald-400' :
            signal.status === 'SL_HIT'  ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>{signal.status}</span>
          <ConfidenceBadge value={signal.confidence} />
        </div>
        {signal.pnlPips != null && (
          <div className="text-right">
            <span className={`font-mono font-bold text-sm ${signal.pnlPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.pnlPips >= 0 ? '+' : ''}{signal.pnlPips.toFixed(1)} pips
            </span>
            {pnlIDR != null && (
              <p className={`text-xs ${isWin ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                {isWin ? '+' : '-'}Rp {formatIDR(pnlIDR)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-gray-900/50 rounded-lg p-2.5">
          <span className="text-xs text-gray-500 block mb-0.5">Entry</span>
          <div className="flex items-center">
            <span className="font-mono font-bold text-white text-sm">{signal.entryPrice.toFixed(2)}</span>
            <CopyValue value={signal.entryPrice.toFixed(2)} />
          </div>
        </div>
        <div className="bg-red-500/5 rounded-lg p-2.5 border border-red-500/10">
          <span className="text-xs text-gray-500 block mb-0.5">SL</span>
          <div className="flex items-center">
            <span className="font-mono font-bold text-red-400 text-sm">{signal.stopLoss.toFixed(2)}</span>
            <CopyValue value={signal.stopLoss.toFixed(2)} />
          </div>
        </div>
        <div className="bg-emerald-500/5 rounded-lg p-2.5 border border-emerald-500/10">
          <span className="text-xs text-gray-500 block mb-0.5">TP</span>
          <div className="flex items-center">
            <span className="font-mono font-bold text-emerald-400 text-sm">{signal.takeProfit.toFixed(2)}</span>
            <CopyValue value={signal.takeProfit.toFixed(2)} />
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="border-t border-gray-800 pt-2.5">
        <p className="text-xs text-gray-500 font-medium mb-1">💡 Alasan AI:</p>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{signal.reasoning}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60">
        <span className="text-gray-600 text-xs">Dibuat {timeAgo(signal.createdAt)}</span>
        {signal.closedAt && (
          <span className="text-gray-600 text-xs">Ditutup {timeAgo(signal.closedAt)}</span>
        )}
      </div>
    </div>
  );
}

// ── Halaman utama ─────────────────────────────────────────
export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [tab, setTab]         = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (tab === 'active') {
          const res = await api.get('/signals/active');
          setSignals(res.data.data || []);
        } else {
          const res = await api.get('/signals/history');
          setSignals(res.data.data?.signals || []);
          setStats(res.data.data?.statistics || null);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    setLoading(true);
    fetchData();
  }, [tab]);

  // Dengarkan harga live dari Socket.IO untuk progress bar
  useEffect(() => {
    const socket = getSocket();
    socket.on('price_update', (data: { price: number }) => setLivePrice(data.price));
    socket.on('new_signal', (signal: Signal) => {
      if (tab === 'active') setSignals((prev) => [signal, ...prev]);
    });
    return () => {
      socket.off('price_update');
      socket.off('new_signal');
    };
  }, [tab]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400" /> Sinyal Trading
        </h1>
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              Win Rate: <span className="text-emerald-400 font-bold">{stats.winRate}%</span>
            </span>
            <span className="text-gray-500">
              Total: <span className="text-white font-bold">{stats.totalSignals}</span>
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['active', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-gray-500 hover:text-white'
            }`}>
            {t === 'active' ? 'Sinyal Aktif' : 'Riwayat'}
          </button>
        ))}
      </div>

      {/* Estimasi disclaimer */}
      {tab === 'active' && signals.length > 0 && (
        <p className="text-xs text-gray-600">
          * Estimasi P/L dalam Rp dihitung untuk <strong className="text-gray-500">0.01 lot (1 oz)</strong> dengan kurs USD/IDR ~{new Intl.NumberFormat('id-ID').format(USD_TO_IDR)}. Bukan rekomendasi lot size.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : signals.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">
          {tab === 'active' ? 'Tidak ada sinyal aktif saat ini.' : 'Belum ada riwayat sinyal.'}
        </div>
      ) : tab === 'active' ? (
        <div className="grid gap-4">
          {signals.map((s) => (
            <ActiveSignalCard key={s.id} signal={s} livePrice={livePrice} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {signals.map((s) => (
            <HistorySignalCard key={s.id} signal={s} />
          ))}
        </div>
      )}
    </div>
  );
}
