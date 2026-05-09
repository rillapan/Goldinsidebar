import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Header } from '@/components/ui/header-3';
import { HeroSection } from '@/components/ui/hero-2-1';
import { ShuffleTestimonials } from '@/components/ui/testimonial-cards';
import { FeaturesSection } from '@/components/ui/features-section';
import { PricingSection } from '@/components/ui/pricing-section';
import { FooterSection } from '@/components/ui/footer-section';


const steps = [
  {
    num: '01',
    title: 'Daftar & Bayar',
    desc: 'Isi form singkat, pilih metode bayar (QRIS/Transfer/e-Wallet), akun aktif otomatis dalam hitungan menit.',
  },
  {
    num: '02',
    title: 'AI Monitoring 24/5',
    desc: 'Bot kami memantau XAUUSD setiap menit, menganalisa 7 indikator teknikal + berita fundamental secara paralel.',
  },
  {
    num: '03',
    title: 'Terima Sinyal & Profit',
    desc: 'Sinyal masuk ke dashboard, WA, dan Telegram real-time. Ikuti entry/SL/TP — biarkan AI bekerja untuk kamu.',
  },
];


const faqs = [
  {
    q: 'Berapa akurasi sinyal GoldMind AI?',
    a: 'GoldMind AI menggunakan model Claude dari Anthropic untuk menganalisa 7 indikator teknikal secara real-time. Kualitas sinyal bergantung pada kondisi pasar. Trading selalu mengandung risiko — gunakan risk management dan jangan trading melebihi kemampuan modal.',
  },
  {
    q: 'Apakah bisa diakses dari HP?',
    a: 'Ya, dashboard sepenuhnya responsif. Selain itu sinyal juga dikirim ke WhatsApp dan Telegram, jadi kamu tidak perlu buka aplikasi untuk terima notifikasi.',
  },
  {
    q: 'Jam berapa sinyal biasa masuk?',
    a: 'Bot aktif 24/5 mengikuti jam pasar forex (Senin 00.00 – Sabtu 05.00 WIB). Daily Bias dikirim setiap hari kerja pukul 07.00 WIB.',
  },
  {
    q: 'Bagaimana jika tidak puas?',
    a: 'Kami memberikan jaminan transparansi penuh — semua history sinyal tercatat dan bisa dicek kapan saja. Hubungi support jika ada kendala.',
  },
];


export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-dark overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <Header />

      {/* ── HERO ── */}
      <HeroSection />

      {/* ── STATS BAR ── */}
      <section className="relative py-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-brand-card/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Model AI', value: 'Claude', sub: 'Anthropic AI terbaru', color: 'text-emerald-400', hasMethodology: false },
            { label: 'Indikator', value: '7', sub: 'RSI, MACD, EMA, BB, ATR', color: 'text-amber-400', hasMethodology: false },
            { label: 'Monitoring', value: '24/5', sub: 'Mengikuti jam pasar forex', color: 'text-blue-400', hasMethodology: false },
            { label: 'Notifikasi', value: '<30s', sub: 'WA + Telegram + Dashboard', color: 'text-amber-400', hasMethodology: false },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-3xl sm:text-4xl font-black mb-1 ${stat.color} font-display`}>
                {stat.value}
                {stat.hasMethodology && (
                  <a
                    href="#faq"
                    className="ml-1.5 align-super text-xs text-gray-500 hover:text-amber-400 transition-colors"
                    title="Dihitung dari sinyal yang mencapai TP1. Data historis sejak platform diluncurkan."
                  >
                    ⓘ
                  </a>
                )}
              </div>
              <div className="text-white font-semibold text-sm">{stat.label}</div>
              <div className="text-gray-500 text-xs mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative py-24 px-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-brand-card/15 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3 block">Proses Sederhana</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display">Mulai Profit dalam 3 Langkah</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Tidak butuh pengalaman trading bertahun-tahun. AI kami yang analisa, kamu yang eksekusi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Bold amber timeline connector */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)]">
              <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/30 via-amber-400/70 to-amber-500/30" />
            </div>

            {steps.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center group">
                {/* Large numbered circle — primary visual anchor per step */}
                <div className="relative mb-7 z-10">
                  <div className="w-20 h-20 rounded-full bg-brand-card border border-amber-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.18)] group-hover:shadow-[0_0_36px_rgba(245,158,11,0.36)] group-hover:border-amber-500/60 transition-all duration-300">
                    <span className="text-3xl font-black text-amber-400 font-display">{step.num}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <FeaturesSection />

      {/* ── TESTIMONIALS ── */}
      <ShuffleTestimonials />

      {/* ── PRICING ── */}
      <PricingSection />

      {/* ── FAQ ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3 block">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display">Pertanyaan Umum</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="glass-card p-6 hover:border-amber-500/20 transition-colors">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-12 text-center bg-gradient-to-br from-amber-500/10 via-transparent to-amber-600/5 border-amber-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <Trophy className="h-10 w-10 text-amber-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display">
                Siap Trading Lebih Cerdas?
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Analisa XAUUSD otomatis berbasis Claude AI — sinyal BUY/SELL langsung ke WA dan Telegram kamu, 24/5.
              </p>
              <Link href="/register"
                className="btn-gold text-lg px-10 py-4 rounded-xl inline-block shadow-[0_0_50px_rgba(245,158,11,0.4)] hover:shadow-[0_0_70px_rgba(245,158,11,0.6)] transition-shadow"
              >
                Bergabung Sekarang — Rp 299K/bulan
              </Link>
              <p className="text-gray-600 text-sm mt-4">Tanpa kontrak. Cancel kapan saja.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <FooterSection />
    </main>
  );
}
