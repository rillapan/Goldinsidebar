'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { AlertTriangle, Rocket } from 'lucide-react';

export function UrgencyBand() {
  return (
    <section className="relative py-14 px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/10 to-transparent" />

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          className="glass-card border-amber-500/20 p-8 sm:p-10 text-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
        >
          {/* Amber glow behind card */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/6 via-transparent to-amber-600/4 rounded-xl" />

          <div className="relative z-10 space-y-5">
            {/* Warning label */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
                <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
                Jangan Tunggu Loss Besar Baru Mau Berubah
              </span>
            </div>

            {/* Contrast lines */}
            <div className="space-y-2 py-2">
              <p className="text-gray-300 leading-relaxed">
                Yang pakai sistem &amp; AI sudah mulai lebih konsisten.
              </p>
              <p className="text-gray-500 leading-relaxed text-sm">
                Yang masih entry random? Masih sibuk berharap market balik.
              </p>
            </div>

            {/* Urgency line */}
            <p className="text-white font-semibold text-base sm:text-lg">
              Gabung sekarang sebelum akses &amp; harga member naik.
            </p>

            {/* CTA */}
            <div className="pt-1">
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 btn-gold text-base px-8 py-3.5 rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.35)] hover:shadow-[0_0_60px_rgba(245,158,11,0.55)] transition-shadow"
              >
                <Rocket className="h-4 w-4" strokeWidth={2} />
                Gabung Sekarang
              </Link>
            </div>

            <p className="text-gray-600 text-xs">Tidak ada kontrak — batalkan kapan saja.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
