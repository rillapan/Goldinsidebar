"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown, Rocket } from "lucide-react";

// ─── Data statistik utama ─────────────────────────────────
const stats = [
  { value: "87%",    label: "Win Rate" },
  { value: "1.240+", label: "Total Sinyal" },
  { value: "850+",   label: "Member Aktif" },
  { value: "+2.340", label: "Pips/Bulan" },
];

// ─── Mock signal card untuk preview di atas dashboard ────
const mockSignal = {
  type:       "BUY",
  entry:      "3,248.50",
  confidence: 91,
  timeframe:  "M15",
};

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden pb-16 pt-28 font-light text-white antialiased md:pb-20 md:pt-24"
      style={{
        background: "linear-gradient(135deg, #060911 0%, #0a0e17 60%, #0d1120 100%)",
      }}
    >
      {/* ── Ambient glow kanan atas ── */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-2/3 w-1/2"
        style={{
          background:
            "radial-gradient(circle at 70% 20%, rgba(245,158,11,0.10) 0%, rgba(10,14,23,0) 65%)",
        }}
      />
      {/* ── Ambient glow kiri atas ── */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-2/3 w-1/2 -scale-x-100"
        style={{
          background:
            "radial-gradient(circle at 70% 20%, rgba(245,158,11,0.10) 0%, rgba(10,14,23,0) 65%)",
        }}
      />
      {/* ── Grid pattern overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10 mx-auto max-w-2xl px-4 text-center md:max-w-4xl md:px-6 lg:max-w-7xl">

        {/* ════════════════════════════════════════════════
            TEXT + CTA SECTION
            ════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge live status */}
          <div className="mb-7 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/8 px-4 py-1.5 text-xs font-medium tracking-widest text-amber-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bot Aktif — Monitoring XAUUSD 24/5
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-light leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
            Sinyal Trading Emas{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)",
              }}
            >
              Berbasis AI
            </span>
            {" "}Terpercaya
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/55 md:text-xl">
            SINYAL COHIBA menganalisa XAUUSD setiap 5 menit menggunakan 7+ indikator
            teknikal dan berita fundamental — hasilkan sinyal BUY/SELL dengan win rate
            tertinggi untuk trader Indonesia.
          </p>

          {/* CTA buttons */}
          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="neumorphic-button-gold relative w-full overflow-hidden rounded-full border border-amber-500/20 bg-gradient-to-b from-amber-500/15 to-amber-600/8 px-8 py-4 text-amber-300 shadow-lg transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_0_28px_rgba(245,158,11,0.35)] hover:text-amber-200 sm:w-auto"
            >
              <span className="flex items-center justify-center gap-2"><Rocket className="h-4 w-4" /> Bergabung Sekarang — Rp 299K/bulan</span>
            </Link>
            <a
              href="#how-it-works"
              className="flex w-full items-center justify-center gap-2 text-white/50 transition-colors hover:text-white/80 sm:w-auto"
            >
              <span className="text-sm">Lihat cara kerja</span>
              <ChevronDown size={15} strokeWidth={1.5} />
            </a>
          </div>

          {/* Stats row */}
          <motion.div
            className="mb-4 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                className="text-center"
              >
                <p className="text-2xl font-semibold tracking-tight text-amber-400">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-white/40">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ════════════════════════════════════════════════
            VISUAL SECTION — Globe + Dashboard mockup
            ════════════════════════════════════════════════ */}
        <motion.div
          className="relative mt-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
        >
          {/* Globe image — pasar emas global */}
          <div className="relative flex h-36 w-full overflow-hidden md:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://blocks.mvp-subha.me/assets/earth.png"
              alt="Pasar emas global"
              className="absolute left-1/2 top-0 mx-auto -z-10 -translate-x-1/2 px-4 opacity-55"
              style={{
                filter:
                  "sepia(80%) saturate(250%) hue-rotate(8deg) brightness(0.65)",
              }}
            />
          </div>

          {/* Dashboard mockup */}
          <div className="relative z-10 mx-auto max-w-5xl overflow-hidden rounded-2xl border border-amber-500/10 shadow-[0_0_70px_rgba(245,158,11,0.12),0_0_120px_rgba(245,158,11,0.06)]">
            {/* Top bar chrome */}
            <div className="flex items-center gap-1.5 bg-[#0d1120]/90 px-4 py-3 border-b border-white/5">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-amber-500/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-3 text-xs text-white/30 font-mono">goldmind.ai/dashboard</span>
            </div>

            <Image
              src="https://blocks.mvp-subha.me/assets/lunexa-db.png"
              alt="SINYAL COHIBA Dashboard — sinyal XAUUSD real-time"
              width={1920}
              height={1080}
              className="h-auto w-full"
              priority
            />

            {/* ── Floating signal card — pojok kanan atas ── */}
            <motion.div
              className="absolute right-4 top-14 sm:right-6 sm:top-16"
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <div className="min-w-[150px] rounded-xl border border-emerald-500/25 bg-black/75 p-3 text-left backdrop-blur-md sm:min-w-[190px] sm:p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {mockSignal.type} AKTIF
                  </span>
                  <span className="text-[10px] text-white/40">{mockSignal.timeframe}</span>
                </div>
                <p className="font-mono text-base font-bold text-white sm:text-lg">
                  ${mockSignal.entry}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${mockSignal.confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {mockSignal.confidence}%
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Floating live price — pojok kiri atas ── */}
            <motion.div
              className="absolute left-4 top-14 sm:left-6 sm:top-16"
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.05 }}
            >
              <div className="rounded-xl border border-amber-500/20 bg-black/75 p-3 text-left backdrop-blur-md sm:p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                  XAUUSD Spot
                </p>
                <p className="font-mono text-base font-bold text-amber-400 sm:text-lg">
                  $3,248.50
                </p>
                <p className="text-[10px] text-emerald-400">▲ +0.42%</p>
              </div>
            </motion.div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0e17] to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
