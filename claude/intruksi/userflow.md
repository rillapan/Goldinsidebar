 Buat kerangka route/halaman berdasarkan 6 tahap ini — jangan buat kode UI dulu.

---

TAHAP 1 — LANDING PAGE
- User mengakses website → tampilkan testimoni, data win rate, chart sinyal historis, CTA
- User klik "Bergabung Sekarang" → arahkan ke halaman registrasi & checkout

TAHAP 2 — REGISTRASI & PAYMENT
- User isi form: nama, email, nomor WA
- User pilih metode bayar (QRIS / Transfer) → Xendit API generate invoice otomatis
- Pembayaran terdeteksi via Xendit webhook real-time
- Akun aktif otomatis, email & WA konfirmasi dikirim, akses dashboard terbuka

TAHAP 3 — DAILY BIAS (setiap pukul 07.00 WIB)
- Sistem otomatis fetch berita ekonomi global (NFP, CPI, Fed Rate, dll)
- AI proses data fundamental → hasilkan Market Bias: BUY / SELL / WAIT + reasoning
- Distribusi otomatis ke WA dan Telegram seluruh member aktif

TAHAP 4 — REAL-TIME SIGNAL EXECUTION
- Bot pantau harga XAUUSD setiap menit
- AI deteksi setup sinyal valid → tampilkan: Entry Price, Stop Loss (SL), Take Profit (TP)
- AI monitor posisi → keluarkan instruksi update: geser SL atau partial TP
- Sinyal selesai (TP/SL hit) → catat ke history, update statistik win rate otomatis

TAHAP 5 — AI CHAT ASSISTANT
- Member buka fitur AI Chat di dashboard
- Member ketik pertanyaan analisa → AI baca data harga live XAUUSD
- AI respons: kondisi indikator, level support/resistance, rekomendasi + disclaimer
- AI pertahankan konteks percakapan dalam satu sesi

TAHAP 6 — RETENTION & RENEWAL
- H-7 sebelum expired → notifikasi WA reminder
- H-3 sebelum expired → notifikasi kedua dengan urgency + link bayar langsung
- Masa aktif habis → dashboard dikunci, arahkan ke halaman renewal
- Setelah renewal bayar → akses aktif kembali otomatis, diperpanjang 30 hari

---

buat desain yang sesuai dengan mcv stich

OUTPUT YANG DIHARAPKAN:
Buat daftar semua route/halaman yang diperlukan beserta fungsinya. Contoh format:
{ path: '/dashboard', role: 'member', fungsi: 'Halaman utama member dengan sinyal dan Daily Bias' }