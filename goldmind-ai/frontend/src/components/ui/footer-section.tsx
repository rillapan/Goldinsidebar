'use client';

import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Zap, Send, Instagram, Youtube, Facebook } from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────
interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterCol {
  label: string;
  links: FooterLink[];
}

// ─── GoldMind AI footer nav ───────────────────────────────────
const footerLinks: FooterCol[] = [
  {
    label: 'Platform',
    links: [
      { title: 'AI Signal Engine',   href: '#features' },
      { title: 'Daily Market Bias',  href: '#features' },
      { title: 'AI Chat Assistant',  href: '#features' },
      { title: 'Analytics & Win Rate', href: '#features' },
    ],
  },
  {
    label: 'Perusahaan',
    links: [
      { title: 'Testimoni Member', href: '#testimonials' },
      { title: 'Cara Kerja AI',    href: '#how-it-works' },
      { title: 'FAQ',              href: '#faq' },
      { title: 'Harga',            href: '#pricing' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { title: 'Syarat & Ketentuan', href: '#' },
      { title: 'Kebijakan Privasi',  href: '#' },
      { title: 'Hubungi Kami',       href: '#' },
    ],
  },
  {
    label: 'Ikuti Kami',
    links: [
      { title: 'Telegram',   href: '#', icon: Send },
      { title: 'Instagram',  href: '#', icon: Instagram },
      { title: 'YouTube',    href: '#', icon: Youtube },
      { title: 'Facebook',   href: '#', icon: Facebook },
    ],
  },
];

// ─── Footer ───────────────────────────────────────────────────
export function FooterSection() {
  return (
    <footer className="relative w-full border-t border-brand-border bg-[radial-gradient(35%_128px_at_50%_0%,rgba(245,158,11,0.07),transparent)] px-6 py-12 lg:py-16">
      {/* Glow line at top edge */}
      <div className="absolute top-0 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/30 blur" />

      <div className="mx-auto max-w-6xl">
        <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">

          {/* ── Brand column ── */}
          <AnimatedContainer className="space-y-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full shadow-[0_0_14px_rgba(245,158,11,0.4)]"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                <Zap className="h-4 w-4 text-black" strokeWidth={2.5} />
              </div>
              <span
                className="text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #f59e0b 60%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                GoldMind AI
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-sm leading-relaxed text-gray-500">
              Platform sinyal trading XAUUSD berbasis AI untuk trader Indonesia.
              Analisa cerdas, profit lebih konsisten.
            </p>

            {/* Live stat */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              850+ trader aktif hari ini
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} GoldMind AI. All rights reserved.
            </p>
          </AnimatedContainer>

          {/* ── Nav columns ── */}
          <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
            {footerLinks.map((section, index) => (
              <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
                <div className="mb-10 md:mb-0">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {section.label}
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {section.links.map((link) => {
                      const LinkIcon = link.icon;
                      return (
                        <li key={link.title}>
                          <a
                            href={link.href}
                            className="inline-flex items-center gap-1.5 text-gray-400 transition-colors duration-200 hover:text-white"
                          >
                            {LinkIcon && <LinkIcon className="h-3.5 w-3.5" />}
                            {link.title}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>

        {/* ── Bottom disclaimer ── */}
        <div className="mt-12 border-t border-brand-border pt-6">
          <p className="text-center text-xs leading-relaxed text-gray-700">
            Trading mengandung risiko. Past performance bukan jaminan profit di masa depan.
            Gunakan risk management yang baik dan hanya trading dengan modal yang siap hilang.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── AnimatedContainer — blur+fade in on scroll ───────────────
type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
