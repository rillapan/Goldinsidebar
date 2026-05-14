"use client";

import * as React from 'react';
import Link from 'next/link';
import { Check, Zap, Shield, Clock, Headphones } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '@/lib/i18n';

// ─── Trust icons (static) ────────────────────────────────────
const TRUST_ICONS = [Shield, Clock, Headphones];

// ─── PricingSection ──────────────────────────────────────────
export function PricingSection() {
  const { t } = useI18n();

  return (
    <section id="pricing" className="relative overflow-hidden py-24 px-4">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-5xl">
        {/* ── Heading ── */}
        <div className="mb-16 text-center">
          <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-amber-400">
            {t.pricing.tagline}
          </span>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl font-display">
            {t.pricing.title1}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #f59e0b 50%, #d97706 100%)' }}
            >
              {t.pricing.titleGold}
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-gray-400">
            {t.pricing.subtitle}
          </p>
        </div>

        {/* ── Pricing card + aside ── */}
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-stretch lg:justify-center">

          {/* ── Main pricing card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#111827] to-[#0a0e17] p-8 shadow-2xl shadow-amber-900/20 lg:w-auto lg:flex-shrink-0"
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-amber-500/12 blur-3xl" />

            {/* Popular badge */}
            <div className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-xs font-black text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <Zap className="h-3 w-3" strokeWidth={3} />
              {t.pricing.popular}
            </div>

            {/* Plan */}
            <div className="relative mb-6">
              <h3 className="text-xl font-bold text-white">{t.pricing.planName}</h3>
              <p className="mt-1 text-sm text-gray-400">{t.pricing.planDesc}</p>
            </div>

            {/* Price */}
            <div className="relative mb-2 flex items-end gap-2">
              <span className="text-5xl font-black text-white">{t.pricing.price}</span>
              <span className="mb-2 text-gray-400">{t.pricing.period}</span>
            </div>
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t.pricing.trialBadge}
              </span>
              <span className="text-xs text-gray-600">{t.pricing.cancelAnytime}</span>
            </div>

            {/* Divider */}
            <div className="mb-6 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

            {/* Feature list */}
            <ul className="relative mb-8 space-y-3">
              {t.pricing.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/register"
              className="relative block w-full rounded-xl py-4 text-center text-base font-bold text-black shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:shadow-[0_0_50px_rgba(245,158,11,0.55)] active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FFD700 0%, #f59e0b 60%, #d97706 100%)' }}
            >
              {t.pricing.ctaButton}
            </Link>

            <p className="mt-4 text-center text-xs text-gray-600">
              {t.pricing.paymentNote}
            </p>
          </motion.div>

          {/* ── Side info panel ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex w-full max-w-md flex-col gap-4 lg:w-72 lg:flex-shrink-0"
          >
            {/* AI engine highlight */}
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-transparent p-6 text-center">
              <div className="mb-1 text-4xl font-black text-amber-400">Claude</div>
              <div className="text-sm font-semibold text-white">{t.pricing.poweredBy}</div>
              <div className="mt-1 text-xs text-gray-500">{t.pricing.aiModel}</div>
            </div>

            {/* Real-time monitoring */}
            <div className="rounded-2xl border border-brand-border bg-brand-card/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">{t.pricing.monitoring}</span>
              </div>
              <div className="text-2xl font-black text-white">24/5</div>
              <div className="text-sm text-gray-400">{t.pricing.monitoringDetail}</div>
            </div>

            {/* Guarantee */}
            <div className="rounded-2xl border border-brand-border bg-brand-card/50 p-5">
              <div className="mb-2 text-sm font-semibold text-white">{t.pricing.transparency}</div>
              <p className="text-xs leading-relaxed text-gray-400">
                {t.pricing.transparencyDetail}
              </p>
            </div>

            {/* FAQ teaser */}
            <div className="rounded-2xl border border-brand-border bg-brand-card/50 p-5">
              <div className="mb-2 text-sm font-semibold text-white">{t.pricing.faqTeaser}</div>
              <p className="text-xs text-gray-400">
                {t.pricing.faqTeaserDetail}{' '}
                <span className="text-amber-400">{t.pricing.telegramSupport}</span>.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Trust signals ── */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {t.pricing.trust.map((item, i) => {
            const TrustIcon = TRUST_ICONS[i];
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-card/40 px-5 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
                  <TrustIcon className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
