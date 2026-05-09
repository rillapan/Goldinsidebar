"use client";

import * as React from 'react';
import { Zap, TrendingUp, MessageCircle, BarChart2, Bell, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

// ─── Data ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Zap,
    title: 'AI Signal Engine',
    desc: 'Sinyal BUY/SELL real-time dengan Entry, SL, TP. AI kami menganalisa RSI, MACD, EMA, Bollinger Bands, dan 3+ indikator lainnya setiap 5 menit. Setiap sinyal dilengkapi alasan "Kenapa?" yang mudah dipahami.',
    accent: 'border-amber-500/25 from-amber-500/10',
    iconBg: 'bg-amber-500/15 text-amber-400',
    badge: 'Fitur Utama',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    featured: true,
  },
  {
    icon: TrendingUp,
    title: 'Daily Market Bias',
    desc: 'Analisa fundamental harian otomatis pukul 07.00 WIB. NFP, CPI, Fed Rate — semua dirangkum AI.',
    accent: 'border-blue-500/20 from-blue-500/8',
    iconBg: 'bg-blue-500/15 text-blue-400',
    badge: null,
    badgeColor: '',
    featured: false,
  },
  {
    icon: MessageCircle,
    title: 'AI Chat Assistant',
    desc: 'Tanya AI tentang kondisi pasar, level support/resistance, dan strategi trading kapan saja 24/5.',
    accent: 'border-emerald-500/20 from-emerald-500/8',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    badge: null,
    badgeColor: '',
    featured: false,
  },
  {
    icon: BarChart2,
    title: 'Analytics & Win Rate',
    desc: 'Lacak win rate, track record sinyal, dan statistik akurasi real-time. Transparan 100%.',
    accent: 'border-amber-500/20 from-amber-500/8',
    iconBg: 'bg-amber-500/15 text-amber-400',
    badge: null,
    badgeColor: '',
    featured: false,
  },
  {
    icon: Bell,
    title: 'Multi-Channel Alert',
    desc: 'Terima sinyal langsung di WhatsApp, Telegram, dan Email secara bersamaan. Tidak pernah ketinggalan entry.',
    accent: 'border-blue-500/20 from-blue-500/8',
    iconBg: 'bg-blue-500/15 text-blue-400',
    badge: null,
    badgeColor: '',
    featured: false,
  },
  {
    icon: CreditCard,
    title: 'Pembayaran Otomatis',
    desc: 'QRIS, Transfer Bank, atau e-Wallet. Akun aktif otomatis tanpa konfirmasi manual dalam hitungan menit.',
    accent: 'border-emerald-500/20 from-emerald-500/8',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    badge: null,
    badgeColor: '',
    featured: false,
  },
];

// ─── FeaturesSection ─────────────────────────────────────────
export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-4">
      {/* Gradient fade — blends section into brand-dark on both edges */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-brand-card/25 to-transparent" />
      {/* Radial amber glow at top */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.05) 0%, transparent 60%)' }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* ── Heading ── */}
        <div className="mb-14 text-center">
          <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-amber-400">
            Platform Lengkap
          </span>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl font-display">
            Semua yang Kamu{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #f59e0b 50%, #d97706 100%)' }}
            >
              Butuhkan
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            GoldMind AI menggabungkan sinyal AI, analisa fundamental, dan chat assistant dalam satu platform terintegrasi.
          </p>
        </div>

        {/* ── Bento grid ── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* ── Featured card: AI Signal Engine ── */}
          {(() => {
            const FeaturedIcon = FEATURES[0].icon;
            return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={[
              'group relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-6',
              'lg:col-span-2 lg:row-span-2',
              FEATURES[0].accent,
            ].join(' ')}
          >
            {/* Corner glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />

            <div className="relative z-10">
              {/* Badge + icon row */}
              <div className="mb-5 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${FEATURES[0].iconBg}`}>
                  <FeaturedIcon className="h-6 w-6" strokeWidth={2} />
                </div>
                <span className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold ${FEATURES[0].badgeColor}`}>
                  {FEATURES[0].badge}
                </span>
              </div>

              {/* Title + desc */}
              <h3 className="mb-2 text-xl font-bold text-white">{FEATURES[0].title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{FEATURES[0].desc}</p>

              {/* ── Live signal preview mockup ── */}
              <div className="mt-6 overflow-hidden rounded-xl border border-emerald-500/20 bg-black/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SINYAL AKTIF — BUY
                  </span>
                  <span className="text-[10px] text-white/30">XAUUSD · M15</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'ENTRY', value: '$3,248.50', color: 'text-white', bg: 'bg-white/5' },
                    { label: 'TP1', value: '$3,262.00', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'SL', value: '$3,241.00', color: 'text-red-400', bg: 'bg-red-500/10' },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-lg p-2 ${item.bg}`}>
                      <div className="mb-0.5 text-[10px] text-gray-500">{item.label}</div>
                      <div className={`font-mono text-sm font-bold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{ width: '91%', background: 'linear-gradient(90deg, #f59e0b, #10b981)' }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400">91% akurasi</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-4 flex gap-4 text-center">
                {[
                  { label: 'Indikator', value: '7+' },
                  { label: 'Update', value: '5 menit' },
                  { label: 'Win Rate', value: '87%' },
                ].map((s) => (
                  <div key={s.label} className="flex-1 rounded-lg bg-white/5 py-2">
                    <div className="text-base font-black text-amber-400">{s.value}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
            );
          })()}

          {/* ── Smaller cards ── */}
          {FEATURES.slice(1).map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i + 1) * 0.07 }}
              className={[
                'group relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-5',
                'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20',
                f.accent,
              ].join(' ')}
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${f.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mb-1.5 text-base font-bold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
