import Link from 'next/link';

const features = [
  {
    title: 'AI Signal Engine',
    desc: 'Sinyal BUY/SELL real-time dengan Entry, SL, TP. Diproses AI setiap 5 menit menggunakan 7+ indikator teknikal.',
    icon: '⚡',
    color: 'amber',
  },
  {
    title: 'Daily Market Bias',
    desc: 'Analisa fundamental harian otomatis pukul 07.00 WIB. Pantau NFP, CPI, Fed Rate — semua dirangkum AI.',
    icon: '📰',
    color: 'blue',
  },
  {
    title: 'AI Chat Assistant',
    desc: 'Tanya langsung ke AI tentang kondisi pasar, level support/resistance, dan strategi trading kapan saja.',
    icon: '🤖',
    color: 'emerald',
  },
  {
    title: 'Real-time Monitoring',
    desc: 'Harga XAUUSD live via WebSocket, update posisi sinyal, notifikasi partial TP & geser SL otomatis.',
    icon: '📡',
    color: 'purple',
  },
  {
    title: 'Multi-Channel Notifikasi',
    desc: 'Terima sinyal & bias langsung di WhatsApp, Telegram, dan Email. Tidak pernah ketinggalan entry.',
    icon: '📱',
    color: 'pink',
  },
  {
    title: 'Auto Payment',
    desc: 'Bayar via QRIS, Transfer Bank, atau e-Wallet. Akun aktif otomatis tanpa konfirmasi manual.',
    icon: '💳',
    color: 'cyan',
  },
];

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

const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'Full-time Trader, Surabaya',
    avatar: 'B',
    text: 'Sebelum pakai GoldMind AI, saya sering salah entry karena baca chart sendiri. Sekarang win rate saya naik dari 52% ke 78% dalam 2 bulan pertama.',
    profit: '+4.200 pips',
    months: '2 bulan',
  },
  {
    name: 'Siti Rahayu',
    role: 'Part-time Trader, Jakarta',
    avatar: 'S',
    text: 'Saya kerja kantoran jadi tidak bisa pantau chart terus. Daily Bias jam 7 pagi itu game changer — langsung tahu hari ini mood pasar emas ke mana.',
    profit: '+2.850 pips',
    months: '1 bulan',
  },
  {
    name: 'Ahmad Fauzi',
    role: 'Trader Pemula, Bandung',
    avatar: 'A',
    text: 'Tadinya takut trading emas karena volatil. Dengan sinyal AI yang lengkap ada SL-nya, saya jadi lebih disiplin. Alhamdulillah bulan pertama sudah balik modal.',
    profit: '+1.950 pips',
    months: '1 bulan',
  },
];

const faqs = [
  {
    q: 'Berapa akurasi sinyal GoldMind AI?',
    a: 'Win rate rata-rata 87% berdasarkan data historis 1.240+ sinyal. Hasil bisa bervariasi tergantung kondisi pasar dan manajemen risiko masing-masing trader.',
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

const includedFeatures = [
  'Sinyal BUY/SELL real-time (Entry, SL, TP)',
  'Daily Market Bias jam 07.00 WIB',
  'AI Chat Assistant unlimited',
  'Notifikasi WhatsApp + Telegram + Email',
  'Dashboard mobile-friendly',
  'Update posisi sinyal (partial TP, geser SL)',
  'History sinyal 30 hari',
  'Akses penuh selama 30 hari',
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-dark overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-xl border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <span className="text-brand-dark font-black text-sm">G</span>
            </div>
            <span className="text-xl font-bold text-gradient-gold">GoldMind AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Fitur</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Cara Kerja</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimoni</a>
            <a href="#pricing" className="hover:text-white transition-colors">Harga</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm hidden sm:block">
              Login
            </Link>
            <Link href="/register" className="btn-gold text-sm !px-4 !py-2 rounded-lg">
              Bergabung Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Bot Aktif — Monitoring XAUUSD 24/5</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
            Sinyal Trading Emas
            <br />
            <span className="text-gradient-gold">Berbasis Kecerdasan AI</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Dapatkan sinyal entry/exit XAUUSD real-time dengan win rate 87%.
            AI kami analisa 7 indikator teknikal + fundamental setiap 5 menit, 24/5.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register" className="btn-gold text-lg px-8 py-4 rounded-xl inline-flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
              🚀 Mulai Sekarang — Rp 299K/bulan
            </Link>
            <a href="#how-it-works" className="px-8 py-4 rounded-xl border border-brand-border text-gray-300 hover:border-amber-500/40 hover:text-white transition-all duration-300 inline-flex items-center justify-center gap-2">
              Lihat Cara Kerja →
            </a>
          </div>

          {/* Mock signal card preview */}
          <div className="max-w-sm mx-auto">
            <div className="glass-card p-5 text-left shadow-2xl shadow-black/50 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="badge-buy">BUY</span>
                  <span className="text-gray-400 text-xs">M15 · XAUUSD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-medium">AKTIF</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Entry</span>
                  <span className="font-mono font-bold text-white text-sm">3,248.50</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Stop Loss</span>
                  <span className="font-mono font-bold text-red-400 text-sm">3,232.00</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Take Profit</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">3,285.00</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                <span className="text-xs text-gray-500">Confidence: <span className="text-amber-400 font-semibold">91%</span></span>
                <span className="text-xs text-gray-600">2 menit lalu</span>
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-3">↑ Contoh sinyal real dari dashboard member</p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-brand-border bg-brand-card/30">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Win Rate', value: '87%', sub: 'Dari 1.240+ sinyal', color: 'text-emerald-400' },
            { label: 'Total Sinyal', value: '1.240+', sub: 'Sejak diluncurkan', color: 'text-amber-400' },
            { label: 'Member Aktif', value: '850+', sub: 'Trader Indonesia', color: 'text-blue-400' },
            { label: 'Avg. Profit', value: '+2.340', sub: 'Pips per bulan', color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-3xl sm:text-4xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-white font-semibold text-sm">{stat.label}</div>
              <div className="text-gray-600 text-xs mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3 block">Proses Sederhana</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Mulai Profit dalam 3 Langkah</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Tidak butuh pengalaman trading bertahun-tahun. AI kami yang analisa, kamu yang eksekusi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

            {steps.map((step) => (
              <div key={step.num} className="glass-card p-7 relative group hover:border-amber-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center mb-5 font-black text-brand-dark text-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-shadow">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 bg-brand-card/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3 block">Platform Lengkap</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Semua yang Kamu Butuhkan</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              GoldMind AI menggabungkan sinyal AI, analisa fundamental, dan chat assistant dalam satu platform terintegrasi.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature) => {
              const colorMap: Record<string, string> = {
                amber: 'from-amber-500/15 to-transparent border-amber-500/10 hover:border-amber-500/25 group-hover:text-amber-400',
                blue: 'from-blue-500/15 to-transparent border-blue-500/10 hover:border-blue-500/25 group-hover:text-blue-400',
                emerald: 'from-emerald-500/15 to-transparent border-emerald-500/10 hover:border-emerald-500/25 group-hover:text-emerald-400',
                purple: 'from-purple-500/15 to-transparent border-purple-500/10 hover:border-purple-500/25 group-hover:text-purple-400',
                pink: 'from-pink-500/15 to-transparent border-pink-500/10 hover:border-pink-500/25 group-hover:text-pink-400',
                cyan: 'from-cyan-500/15 to-transparent border-cyan-500/10 hover:border-cyan-500/25 group-hover:text-cyan-400',
              };
              return (
                <div key={feature.title}
                  className={`group glass-card p-6 bg-gradient-to-br ${colorMap[feature.color]} transition-all duration-300 hover:-translate-y-0.5`}
                >
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className={`text-base font-bold text-white mb-2 transition-colors ${colorMap[feature.color].split(' ').find(c => c.startsWith('group-hover:'))}`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3 block">Sudah Terbukti</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Kata Mereka yang Sudah Bergabung</h2>
            <p className="text-gray-500">850+ trader Indonesia telah mempercayai GoldMind AI untuk analisa harian mereka.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card p-6 flex flex-col gap-4 hover:border-amber-500/20 transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-1 text-amber-400 text-sm">★★★★★</div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-brand-dark font-black text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-sm">{t.profit}</p>
                    <p className="text-gray-600 text-xs">{t.months}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-4 bg-brand-card/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3 block">Harga Transparan</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Satu Paket, Semua Akses</h2>
            <p className="text-gray-500">Tidak ada paket tersembunyi. Satu harga, fitur lengkap, akses penuh 30 hari.</p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="glass-card p-8 border-amber-500/30 bg-gradient-to-br from-amber-500/8 to-transparent relative overflow-hidden">
              {/* Popular badge */}
              <div className="absolute top-4 right-4 bg-gradient-gold text-brand-dark text-xs font-black px-3 py-1 rounded-full">
                POPULER
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">GoldMind AI Pro</h3>
                <p className="text-gray-400 text-sm">Akses penuh semua fitur premium</p>
              </div>

              <div className="flex items-end gap-2 mb-8">
                <span className="text-5xl font-black text-white">299K</span>
                <span className="text-gray-400 mb-2">/bulan</span>
              </div>

              <ul className="space-y-3 mb-8">
                {includedFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/register" className="btn-gold w-full text-center block py-4 rounded-xl text-base font-bold shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] transition-shadow">
                Bergabung Sekarang
              </Link>

              <p className="text-center text-gray-600 text-xs mt-4">
                Bayar via QRIS · Transfer Bank · e-Wallet · Aktivasi otomatis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3 block">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold">Pertanyaan Umum</h2>
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
              <div className="text-4xl mb-4">🏆</div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Siap Trading Lebih Cerdas?
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Bergabung dengan 850+ trader Indonesia yang sudah menggunakan AI untuk analisa emas mereka setiap hari.
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
      <footer className="border-t border-brand-border py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <span className="text-brand-dark font-black text-sm">G</span>
              </div>
              <span className="text-lg font-bold text-gradient-gold">GoldMind AI</span>
            </Link>
            <div className="flex flex-wrap gap-6 text-gray-500 text-sm justify-center">
              <a href="#features" className="hover:text-gray-300 transition-colors">Fitur</a>
              <a href="#pricing" className="hover:text-gray-300 transition-colors">Harga</a>
              <a href="#testimonials" className="hover:text-gray-300 transition-colors">Testimoni</a>
              <Link href="/login" className="hover:text-gray-300 transition-colors">Login</Link>
            </div>
          </div>
          <div className="border-t border-brand-border pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-600 text-xs">© 2026 GoldMind AI. All rights reserved.</p>
            <p className="text-gray-700 text-xs max-w-md text-center md:text-right">
              Trading mengandung risiko. Past performance bukan jaminan profit di masa depan. Gunakan risk management yang baik.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
