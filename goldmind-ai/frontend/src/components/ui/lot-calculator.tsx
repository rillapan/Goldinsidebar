"use client";

import * as React from 'react';
import { motion } from 'motion/react';
import { Calculator, TrendingUp, TrendingDown, RefreshCw, Info } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface CalcResult {
  pipValueUSD: number;
  modalUSD: number;
  profitPerTradeUSD: number;
  riskPerTradeUSD: number;
  rrRatio: number;
  profitPerDayUSD: number;
  profitPerMonthUSD: number;
  profitPerYearUSD: number;
  profitPerDayIDR: number;
  profitPerMonthIDR: number;
  profitPerYearIDR: number;
  riskPerTradeIDR: number;
}

interface ApiResponse {
  success: boolean;
  input: { modal: number; lot: number; targetPips: number; slPips: number };
  rate: { usdIdr: number; symbol: string };
  result: CalcResult;
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRate(rate: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rate);
}

// ─── LotCalculator ────────────────────────────────────────────
export function LotCalculator() {
  const [modal, setModal]           = React.useState('5000000');
  const [lot, setLot]               = React.useState('0.01');
  const [targetPips, setTargetPips] = React.useState('20');
  const [slPips, setSlPips]         = React.useState('20');

  const [result, setResult]     = React.useState<CalcResult | null>(null);
  const [usdIdr, setUsdIdr]     = React.useState<number | null>(null);
  const [loading, setLoading]   = React.useState(false);
  const [rateStale, setRateStale] = React.useState(false);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculate = React.useCallback(async (
    m: string, l: string, tp: string, sl: string
  ) => {
    const mNum  = parseFloat(m);
    const lNum  = parseFloat(l);
    const tpNum = parseFloat(tp);
    const slNum = parseFloat(sl);

    if (isNaN(mNum) || isNaN(lNum) || isNaN(tpNum) || isNaN(slNum)) return;
    if (lNum <= 0 || tpNum <= 0 || slNum <= 0) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        modal: String(mNum),
        lot: String(lNum),
        targetPips: String(tpNum),
        slPips: String(slNum),
      });
      const res = await fetch(`${API_URL}/api/market/calculator?${params}`);
      const data: ApiResponse = await res.json();
      if (data.success) {
        setResult(data.result);
        setUsdIdr(data.rate.usdIdr);
        setRateStale(false);
      }
    } catch {
      setRateStale(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce setiap perubahan input selama 400ms
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      calculate(modal, lot, targetPips, slPips);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [modal, lot, targetPips, slPips, calculate]);

  // Fetch awal saat komponen mount
  React.useEffect(() => {
    calculate(modal, lot, targetPips, slPips);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rrColor = result
    ? result.rrRatio >= 1.5 ? 'text-emerald-400' : result.rrRatio >= 1 ? 'text-amber-400' : 'text-red-400'
    : 'text-gray-400';

  return (
    <section id="kalkulator" className="relative py-24 px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-brand-card/20 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 65%)' }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* ── Heading ── */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3 block">
            Rencanakan Profit Kamu
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display">
            Kalkulator Lot &amp;{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #f59e0b 50%, #d97706 100%)' }}
            >
              Estimasi Profit
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Hitung estimasi profit harian, bulanan, dan tahunan berdasarkan modal dan ukuran lot kamu.
            Kalkulator ini menggunakan kurs USD/IDR <strong className="text-white">real-time</strong>.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── INPUT FORM ── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 rounded-2xl border border-white/8"
          >
            {/* Live rate badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
                <span className="font-bold text-white">Parameter Trading</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                {loading
                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                  : <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                }
                {usdIdr && !rateStale
                  ? `Kurs Live: 1 USD = Rp${formatRate(usdIdr)}`
                  : 'Memuat kurs...'}
              </div>
            </div>

            <div className="space-y-5">
              {/* Modal */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Modal Awal <span className="text-gray-500 font-mono">(IDR)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={modal}
                    onChange={(e) => setModal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    placeholder="5000000"
                  />
                </div>
              </div>

              {/* Ukuran Lot */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Ukuran Lot{' '}
                  <span className="text-gray-600 text-xs ml-1">
                    (0.01 = micro lot)
                  </span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
                {/* Lot shortcuts */}
                <div className="flex gap-2 mt-2">
                  {['0.01', '0.05', '0.1', '0.5', '1.0'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLot(v)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        lot === v
                          ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-amber-500/30'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Pips */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Target Pips per Hari
                  <span className="text-gray-600 text-xs ml-1">(Take Profit)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={targetPips}
                    onChange={(e) => setTargetPips(e.target.value)}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-16 text-right text-white font-mono font-bold text-sm">
                    {targetPips} pip
                  </span>
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Stop Loss <span className="text-gray-600 text-xs ml-1">(Pips)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={slPips}
                    onChange={(e) => setSlPips(e.target.value)}
                    className="flex-1 accent-red-500"
                  />
                  <span className="w-16 text-right text-white font-mono font-bold text-sm">
                    {slPips} pip
                  </span>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="mt-5 flex items-start gap-2 text-xs text-gray-500 bg-white/3 rounded-xl p-3 border border-white/5">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-600" />
              <span>
                1 pip XAUUSD = $0.10 pada 0.01 lot. Estimasi profit dihitung dari{' '}
                <strong className="text-gray-400">20 hari kerja</strong> per bulan.
                Ini proyeksi ideal — hasil aktual bergantung pada win rate dan eksekusi.
              </span>
            </div>
          </motion.div>

          {/* ── RESULT CARDS ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            {/* Pip Value + RR */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-white/8">
                <p className="text-xs text-gray-500 mb-1">Nilai per Pip</p>
                <p className="text-xl font-black text-amber-400 font-mono">
                  {result ? formatUSD(result.pipValueUSD) : '—'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">per pip / lot {lot}</p>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-white/8">
                <p className="text-xs text-gray-500 mb-1">Risk/Reward Ratio</p>
                <p className={`text-xl font-black font-mono ${rrColor}`}>
                  {result ? `1 : ${result.rrRatio}` : '—'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {result && result.rrRatio >= 1.5 ? 'Sangat baik' : result && result.rrRatio >= 1 ? 'Cukup' : 'Perlu diperbaiki'}
                </p>
              </div>
            </div>

            {/* Profit Table */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 to-transparent flex-1">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={2} />
                <span className="font-bold text-white text-sm">Estimasi Profit</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-auto">
                  Target {targetPips} pip/hari
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: 'Per Hari',
                    usd: result?.profitPerDayUSD,
                    idr: result?.profitPerDayIDR,
                  },
                  {
                    label: 'Per Bulan',
                    usd: result?.profitPerMonthUSD,
                    idr: result?.profitPerMonthIDR,
                    highlight: true,
                  },
                  {
                    label: 'Per Tahun',
                    usd: result?.profitPerYearUSD,
                    idr: result?.profitPerYearIDR,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                      row.highlight
                        ? 'bg-emerald-500/12 border border-emerald-500/20'
                        : 'bg-white/4'
                    }`}
                  >
                    <span className={`text-sm ${row.highlight ? 'text-emerald-300 font-semibold' : 'text-gray-400'}`}>
                      {row.label}
                    </span>
                    <div className="text-right">
                      <div className={`font-black font-mono ${row.highlight ? 'text-emerald-400 text-base' : 'text-white text-sm'}`}>
                        {row.idr !== undefined ? formatIDR(row.idr) : <span className="text-gray-600">—</span>}
                      </div>
                      <div className="text-xs text-gray-600 font-mono">
                        {row.usd !== undefined ? `≈ ${formatUSD(row.usd)}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Card */}
            <div className="glass-card p-5 rounded-2xl border border-red-500/15 bg-gradient-to-br from-red-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-red-400" strokeWidth={2} />
                <span className="font-bold text-white text-sm">Risiko per Trade</span>
                <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full ml-auto">
                  SL {slPips} pip
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-red-400 font-mono">
                    {result ? formatIDR(result.riskPerTradeIDR) : '—'}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 font-mono">
                    {result ? `≈ ${formatUSD(result.riskPerTradeUSD)}` : ''}
                  </p>
                </div>
                {result && (
                  <div className="text-right text-xs text-gray-500">
                    <p>{((result.riskPerTradeUSD / result.modalUSD) * 100).toFixed(2)}% dari modal</p>
                    <p className={`font-semibold mt-0.5 ${
                      (result.riskPerTradeUSD / result.modalUSD) * 100 <= 2
                        ? 'text-emerald-400'
                        : (result.riskPerTradeUSD / result.modalUSD) * 100 <= 5
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}>
                      {(result.riskPerTradeUSD / result.modalUSD) * 100 <= 2
                        ? 'Aman'
                        : (result.riskPerTradeUSD / result.modalUSD) * 100 <= 5
                        ? 'Moderat'
                        : 'Terlalu besar'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Disclaimer ── */}
        <p className="text-center text-xs text-gray-600 mt-8 max-w-2xl mx-auto">
          * Estimasi profit bersifat ilustrasi dan tidak menjamin hasil aktual. Trading mengandung risiko kerugian.
          Selalu kelola risiko dengan bijak dan gunakan modal yang siap Anda tanggung kerugiannya.
        </p>
      </div>
    </section>
  );
}
