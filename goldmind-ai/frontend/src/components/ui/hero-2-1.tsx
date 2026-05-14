"use client";

import { ArrowRight, Rocket, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { useI18n } from "@/lib/i18n";

export const HeroSection = () => {
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden" style={{ background: "#0a0e17" }}>

      {/* ── Gold/Charcoal gradient blobs ── */}
      <div className="pointer-events-none absolute -right-60 -top-10 z-0 flex flex-col items-end blur-xl">
        <div className="h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-amber-500/30 to-yellow-700/10 blur-[6rem]" />
        <div className="h-[10rem] w-[90rem] rounded-full bg-gradient-to-b from-amber-600/20 to-amber-900/5 blur-[6rem]" />
        <div className="h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-yellow-500/15 to-amber-500/5 blur-[6rem]" />
      </div>
      <div className="pointer-events-none absolute -left-40 top-1/3 z-0 blur-xl">
        <div className="h-[8rem] w-[50rem] rounded-full bg-gradient-to-b from-amber-600/15 to-transparent blur-[6rem]" />
      </div>

      {/* ── Subtle grid overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ════════════ SCROLL HERO ════════════ */}
      <div className="relative z-10">
        <ContainerScroll
          titleComponent={
            <div className="px-4 text-center">
              {/* Live badge */}
              <motion.div
                className="mt-6 md:mt-0 flex justify-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t.hero.badge}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className="mx-auto mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl font-display"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              >
                {t.hero.headline1}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #FFD700 0%, #f59e0b 50%, #d97706 100%)",
                  }}
                >
                  {t.hero.headlineGold}
                </span>
                {t.hero.headline2}
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
              >
                {t.hero.subheadline}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.38 }}
              >
                <Link
                  href="/register"
                  className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 text-base font-bold text-black shadow-[0_0_40px_rgba(245,158,11,0.35)] transition-all hover:from-amber-400 hover:to-amber-500 hover:shadow-[0_0_60px_rgba(245,158,11,0.55)] active:scale-95 sm:w-auto"
                >
                  <Rocket className="h-5 w-5" strokeWidth={2} />
                  {t.hero.cta}
                </Link>
                <a
                  href="#how-it-works"
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-gray-700 px-8 text-base font-medium text-gray-300 transition-all hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-white sm:w-auto"
                >
                  {t.hero.howItWorks}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            </div>
          }
        >
          {/* ─ Dashboard Image inside 3D Card ─ */}
          <div className="relative h-full w-full">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-1.5 border-b border-white/5 bg-[#0d1120]/90 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-amber-500/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-3 font-mono text-xs text-white/25">goldmind.ai/dashboard</span>
            </div>

            {/* Hero image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80"
              alt="SINYAL COHIBA — Platform Sinyal Trading XAUUSD"
              className="h-full w-full object-cover object-top"
              style={{ filter: "brightness(0.75) saturate(1.1) sepia(15%)" }}
            />

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d1120] to-transparent" />

            {/* ── Floating signal card — top right ── */}
            <motion.div
              className="absolute right-4 top-12 sm:right-6 sm:top-14"
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
            >
              <div className="min-w-[140px] rounded-xl border border-emerald-500/25 bg-black/80 p-3 text-left backdrop-blur-md sm:min-w-[160px]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t.hero.buyActive}
                  </span>
                  <span className="text-[10px] text-white/35">M15</span>
                </div>
                <p className="font-mono text-base font-bold text-white sm:text-lg">$3,248.50</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[78%] rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400">AI</span>
                </div>
              </div>
            </motion.div>

            {/* ── Floating price card — top left ── */}
            <motion.div
              className="absolute left-4 top-12 sm:left-6 sm:top-14"
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <div className="rounded-xl border border-amber-500/20 bg-black/80 p-3 text-left backdrop-blur-md">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-white/35">XAUUSD Spot</p>
                <p className="font-mono text-base font-bold text-amber-400 sm:text-lg">$3,248.50</p>
                <p className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                  <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                  +0.42%
                </p>
              </div>
            </motion.div>
          </div>
        </ContainerScroll>
      </div>
    </div>
  );
};

export default HeroSection;
