'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { BookOpen, Plus, Trash2, BarChart2, X } from 'lucide-react';

// ── Types ────────────────────────────────────────────────
interface JournalEntry {
  id: string;
  instrument: string;
  lotSize: number;
  entryPrice: number;
  takeProfit: number | null;
  stopLoss: number | null;
  result: 'WIN' | 'LOSS' | 'BE';
  pnlUsd: number;
  notes: string | null;
  tradeDate: string;
  createdAt: string;
}

const USD_TO_IDR = 16300;

function formatUSD(v: number) {
  return `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`;
}
function formatIDR(v: number) {
  return `${v >= 0 ? '+' : '-'}Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(v * USD_TO_IDR)))}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── SVG Equity Curve ─────────────────────────────────────
function EquityCurve({ entries }: { entries: JournalEntry[] }) {
  const W = 600;
  const H = 140;
  const PAD = 12;

  if (entries.length < 2) {
    return (
      <div className="h-36 flex items-center justify-center text-gray-600 text-sm">
        Butuh minimal 2 trade untuk menampilkan grafik
      </div>
    );
  }

  // Build cumulative equity series (oldest → newest)
  const sorted = [...entries].sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());
  const points: number[] = [0];
  sorted.forEach((e) => points.push(points[points.length - 1] + e.pnlUsd));

  const minV = Math.min(...points);
  const maxV = Math.max(...points);
  const range = maxV - minV || 1;

  const px = (i: number) => PAD + (i / (points.length - 1)) * (W - 2 * PAD);
  const py = (v: number) => H - PAD - ((v - minV) / range) * (H - 2 * PAD);

  const pathD = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const fillD = `${pathD} L ${px(points.length - 1).toFixed(1)} ${H} L ${px(0).toFixed(1)} ${H} Z`;

  // Per spec: equity curve always Vivid Blue — color conveys ownership, not P&L
  // Dark: #2962FF, Light: #1848CC — controlled via CSS variable --equity-line-color

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36" preserveAspectRatio="none">
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--equity-line-color)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--equity-line-color)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#eq-fill)" />
      <path d={pathD} fill="none" stroke="var(--equity-line-color)" strokeWidth="2" strokeLinejoin="round" />
      {/* Zero line */}
      <line
        x1={PAD} y1={py(0).toFixed(1)}
        x2={W - PAD} y2={py(0).toFixed(1)}
        stroke="#374151" strokeWidth="1" strokeDasharray="4 3"
      />
    </svg>
  );
}

// ── Stats ────────────────────────────────────────────────
function computeStats(entries: JournalEntry[]) {
  const total = entries.length;
  const wins = entries.filter((e) => e.result === 'WIN').length;
  const losses = entries.filter((e) => e.result === 'LOSS').length;
  const winrate = total > 0 ? (wins / total) * 100 : 0;
  const totalPnl = entries.reduce((s, e) => s + e.pnlUsd, 0);
  const winAmounts = entries.filter((e) => e.result === 'WIN').map((e) => e.pnlUsd);
  const lossAmounts = entries.filter((e) => e.result === 'LOSS').map((e) => Math.abs(e.pnlUsd));
  const avgWin = winAmounts.length > 0 ? winAmounts.reduce((s, v) => s + v, 0) / winAmounts.length : 0;
  const avgLoss = lossAmounts.length > 0 ? lossAmounts.reduce((s, v) => s + v, 0) / lossAmounts.length : 0;
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
  return { total, wins, losses, winrate, totalPnl, avgWin, avgLoss, rr };
}

// ── Main Page ────────────────────────────────────────────
export default function JournalPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <JournalContent />
    </Suspense>
  );
}

function JournalContent() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'IDR' | 'BOTH'>('BOTH');

  useEffect(() => {
    const stored = localStorage.getItem('gm_currency') as 'USD' | 'IDR' | 'BOTH' | null;
    if (stored) setCurrency(stored);
    const handler = (e: StorageEvent) => {
      if (e.key === 'gm_currency' && e.newValue) setCurrency(e.newValue as 'USD' | 'IDR' | 'BOTH');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Form state — pre-filled from query params when coming from signals page
  const [form, setForm] = useState({
    lotSize: (typeof window !== 'undefined' ? localStorage.getItem('gm_default_lot') : null) ?? '',
    entryPrice: searchParams.get('entry') ?? '',
    takeProfit: searchParams.get('tp') ?? '',
    stopLoss: searchParams.get('sl') ?? '',
    result: 'WIN' as 'WIN' | 'LOSS' | 'BE',
    notes: '',
    tradeDate: new Date().toISOString().slice(0, 10),
  });

  // Open form automatically if query params supplied
  useEffect(() => {
    if (searchParams.get('entry')) setShowForm(true);
  }, [searchParams]);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await api.get('/journal');
      setEntries(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.lotSize || !form.entryPrice) {
      setError('Lot size dan entry price wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/journal', {
        lotSize: parseFloat(form.lotSize),
        entryPrice: parseFloat(form.entryPrice),
        takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : null,
        stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
        result: form.result,
        notes: form.notes || null,
        tradeDate: form.tradeDate,
      });
      setForm({ lotSize: localStorage.getItem('gm_default_lot') ?? '', entryPrice: '', takeProfit: '', stopLoss: '', result: 'WIN', notes: '', tradeDate: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      fetchEntries();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus entri ini?')) return;
    try {
      await api.delete(`/journal/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Gagal menghapus entri.');
    }
  };

  const stats = computeStats(entries);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-400" />
          Trading Journal
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-brand-dark font-semibold text-sm hover:bg-amber-400 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Batal' : 'Catat Trade'}
        </button>
      </div>

      {/* ── Form Input ── */}
      {showForm && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold mb-4 text-amber-400">Log Trade Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Instrument (read-only) */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Instrument</label>
                <input value="XAUUSD" readOnly
                  className="w-full bg-gray-800/50 border border-brand-border rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed" />
              </div>

              {/* Lot Size */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Lot Size <span className="text-red-400">*</span></label>
                <input
                  type="number" step="0.01" min="0.01" placeholder="0.10"
                  value={form.lotSize}
                  onChange={(e) => setForm((f) => ({ ...f, lotSize: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              {/* Trade Date */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tanggal Trade</label>
                <input
                  type="date"
                  value={form.tradeDate}
                  onChange={(e) => setForm((f) => ({ ...f, tradeDate: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Entry Price */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Entry Price <span className="text-red-400">*</span></label>
                <input
                  type="number" step="0.01" placeholder="2650.00"
                  value={form.entryPrice}
                  onChange={(e) => setForm((f) => ({ ...f, entryPrice: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              {/* Take Profit */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Take Profit</label>
                <input
                  type="number" step="0.01" placeholder="2670.00"
                  value={form.takeProfit}
                  onChange={(e) => setForm((f) => ({ ...f, takeProfit: e.target.value }))}
                  className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Stop Loss */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Stop Loss</label>
                <input
                  type="number" step="0.01" placeholder="2640.00"
                  value={form.stopLoss}
                  onChange={(e) => setForm((f) => ({ ...f, stopLoss: e.target.value }))}
                  className="w-full bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>

            {/* Result */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Result <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {(['WIN', 'LOSS', 'BE'] as const).map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => setForm((f) => ({ ...f, result: r }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      form.result === r
                        ? r === 'WIN' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : r === 'LOSS' ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-gray-500/20 border-gray-500/50 text-gray-300'
                        : 'bg-transparent border-brand-border text-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {r === 'WIN' ? 'WIN' : r === 'LOSS' ? 'LOSS' : 'BE (Breakeven)'}
                  </button>
                ))}
              </div>
            </div>

            {/* P&L Preview */}
            {form.entryPrice && form.lotSize && (
              <div className="bg-gray-800/30 rounded-lg p-3 text-sm">
                {(() => {
                  const entry = parseFloat(form.entryPrice);
                  const lot = parseFloat(form.lotSize);
                  const tp = form.takeProfit ? parseFloat(form.takeProfit) : null;
                  const sl = form.stopLoss ? parseFloat(form.stopLoss) : null;
                  let pnl = 0;
                  if (form.result === 'WIN' && tp != null) pnl = Math.abs(tp - entry) * lot * 100;
                  else if (form.result === 'LOSS' && sl != null) pnl = -Math.abs(entry - sl) * lot * 100;
                  return (
                    <span className="flex items-center gap-2">
                      <span className="text-gray-500">Estimasi P&L:</span>
                      <span className={`font-mono font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {currency === 'IDR' ? formatIDR(pnl) : formatUSD(pnl)}
                      </span>
                      {currency === 'BOTH' && (
                        <span className={`text-xs ${pnl >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                          ({formatIDR(pnl)})
                        </span>
                      )}
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Catatan / Psikologi</label>
              {/* Mood chips */}
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { label: '😊 Senang', value: 'Senang' },
                  { label: '😢 Sedih', value: 'Sedih' },
                  { label: '😞 Kecewa', value: 'Kecewa' },
                  { label: '😐 Biasa', value: 'Biasa' },
                ].map((mood) => {
                  const active = form.notes === mood.value || form.notes.startsWith(mood.value + ' — ');
                  return (
                    <button
                      key={mood.value} type="button"
                      onClick={() => {
                        const custom = form.notes.includes(' — ') ? form.notes.split(' — ').slice(1).join(' — ') : '';
                        if (active && !custom) {
                          setForm((f) => ({ ...f, notes: '' }));
                        } else if (active) {
                          setForm((f) => ({ ...f, notes: custom }));
                        } else {
                          setForm((f) => ({ ...f, notes: custom ? `${mood.value} — ${custom}` : mood.value }));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-gray-800/50 border-brand-border text-gray-500 hover:border-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {mood.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={2} placeholder="Catatan tambahan (opsional)..."
                value={form.notes.includes(' — ') ? form.notes.split(' — ').slice(1).join(' — ') : form.notes.match(/^(Senang|Sedih|Kecewa|Biasa)$/) ? '' : form.notes}
                onChange={(e) => {
                  const currentMood = ['Senang', 'Sedih', 'Kecewa', 'Biasa'].find((m) => form.notes === m || form.notes.startsWith(m + ' — '));
                  const newText = e.target.value;
                  setForm((f) => ({ ...f, notes: currentMood && newText ? `${currentMood} — ${newText}` : currentMood || newText }));
                }}
                className="w-full bg-gray-800/50 border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit" disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-brand-dark font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Trade'}
            </button>
          </form>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1">Total P/L</p>
          <p className={`text-lg font-bold font-mono ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {currency === 'IDR' ? formatIDR(stats.totalPnl) : formatUSD(stats.totalPnl)}
          </p>
          {currency === 'BOTH' && (
            <p className={`text-xs mt-0.5 ${stats.totalPnl >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
              {stats.totalPnl !== 0 ? formatIDR(stats.totalPnl) : 'Rp 0'}
            </p>
          )}
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1">Total Trade</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            <span className="text-emerald-400">{stats.wins}W</span>
            {' · '}
            <span className="text-red-400">{stats.losses}L</span>
            {' · '}
            <span className="text-gray-500">{stats.total - stats.wins - stats.losses}BE</span>
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1">Winrate</p>
          <p className={`text-lg font-bold ${stats.winrate >= 60 ? 'text-emerald-400' : stats.winrate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {stats.winrate.toFixed(1)}%
          </p>
          <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${stats.winrate >= 60 ? 'bg-emerald-400' : stats.winrate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${stats.winrate}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1">Risk Reward Real</p>
          <p className={`text-lg font-bold ${stats.rr >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {stats.rr > 0 ? `1:${stats.rr.toFixed(2)}` : '—'}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Avg Win ${stats.avgWin.toFixed(2)} · Avg Loss ${stats.avgLoss.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ── Equity Curve ── */}
      {entries.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            Equity Curve
          </h2>
          <EquityCurve entries={entries} />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Trade pertama</span>
            <span>Terbaru</span>
          </div>
        </div>
      )}

      {/* ── History Table ── */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Riwayat Trade
          {entries.length > 0 && <span className="text-gray-600 font-normal">({entries.length} entri)</span>}
        </h2>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada trade yang dicatat.</p>
            <p className="text-gray-600 text-xs mt-1">Klik "Catat Trade" untuk mulai jurnal trading kamu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-gray-600 border-b border-brand-border">
                  <th className="pb-2 pr-4 font-medium">Tanggal</th>
                  <th className="pb-2 pr-4 font-medium">Lot</th>
                  <th className="pb-2 pr-4 font-medium">Entry</th>
                  <th className="pb-2 pr-4 font-medium">TP</th>
                  <th className="pb-2 pr-4 font-medium">SL</th>
                  <th className="pb-2 pr-4 font-medium">Result</th>
                  <th className="pb-2 pr-4 font-medium">P&L (USD)</th>
                  <th className="pb-2 pr-4 font-medium">P&L (IDR)</th>
                  <th className="pb-2 font-medium">Catatan</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {entries.map((e) => (
                  <tr key={e.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(e.tradeDate)}</td>
                    <td className="py-3 pr-4 text-white font-mono">{e.lotSize}</td>
                    <td className="py-3 pr-4 text-white font-mono">{e.entryPrice.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-emerald-400 font-mono">{e.takeProfit != null ? e.takeProfit.toFixed(2) : '—'}</td>
                    <td className="py-3 pr-4 text-red-400 font-mono">{e.stopLoss != null ? e.stopLoss.toFixed(2) : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        e.result === 'WIN' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : e.result === 'LOSS' ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                        : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                      }`}>{e.result}</span>
                    </td>
                    <td className={`py-3 pr-4 font-mono font-semibold text-sm ${e.pnlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {e.pnlUsd !== 0 ? formatUSD(e.pnlUsd) : '$0.00'}
                    </td>
                    <td className={`py-3 pr-4 font-mono text-xs ${e.pnlUsd >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                      {e.pnlUsd !== 0 ? formatIDR(e.pnlUsd) : 'Rp 0'}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs max-w-[140px] truncate" title={e.notes ?? ''}>
                      {e.notes || '—'}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
