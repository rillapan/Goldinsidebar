Sekarang kita mulai membangun fitur per fitur. Kerjakan satu fitur dalam satu sesi, konfirmasi sebelum lanjut ke berikutnya.

---

FITUR 1 — PAYWALL MEMBERSHIP SYSTEM
- Seluruh halaman dashboard, sinyal, dan AI Chat hanya bisa diakses user dengan status = ACTIVE
- Implementasi: JWT-based authentication + middleware proteksi route
- Session management dengan Redis
- Deteksi multi-login untuk mencegah sharing akun ilegal (1 akun = 1 device aktif)
- Jelaskan bagaimana logika middleware auth bekerja pada sistem ini

FITUR 2 — AUTOMATIC PAYMENT GATEWAY (Xendit)
- Integrasi penuh Xendit: QRIS, Virtual Account semua bank, e-Wallet
- Alur: user klik bayar → server buat Xendit Invoice via API → Xendit tampilkan halaman bayar
- Setelah bayar: Xendit kirim Webhook ke endpoint server → server verifikasi signature → update status user = ACTIVE di database
- Kirim notifikasi konfirmasi ke WA dan email secara otomatis
- Zero manual admin confirmation

FITUR 3 — AI SIGNAL ENGINE (XAUUSD)
- Bot jalan 24/5 (mengikuti jam pasar forex)
- Alur: Twelve Data WebSocket → Python pandas-ta hitung indikator → prompt ke Claude API → parse JSON output
- Indikator wajib: RSI, MACD, EMA 20/50/200, Bollinger Bands, ATR, Support/Resistance
- Output signal disimpan ke PostgreSQL, lalu di-push ke semua connected member via Socket.IO

FITUR 4 — DAILY FUNDAMENTAL BIAS
- Berjalan otomatis setiap hari pukul 07.00 WIB via Node-Cron
- Fetch berita dari NewsAPI / Finnhub (NFP, CPI, Fed Rate, USD Index, geopolitik)
- Data dikirim ke Claude API dengan prompt: "Berdasarkan data berita berikut, tentukan Market Bias XAUUSD untuk hari ini: BUY / SELL / WAIT beserta reasoning dalam Bahasa Indonesia."
- Hasil disimpan ke tabel daily_bias, lalu di-blast ke seluruh member via WA + Telegram

FITUR 5 — AI CHAT ASSISTANT
- Interface chat di dashboard member
- Setiap pertanyaan user dibungkus bersama data harga live XAUUSD terkini ke dalam prompt Claude API
- AI mempertahankan konteks percakapan dalam satu sesi (kirim conversation history)
- Output selalu sertakan disclaimer trading di akhir respons
- Model: claude-sonnet, max_tokens: 1000

FITUR 6 — MULTI-CHANNEL NOTIFICATION
- WA via Fonnte/Wablas API: sinyal baru, Daily Bias, reminder renewal
- Telegram Bot: sinyal baru + update posisi (partial TP, geser SL)
- Email via Nodemailer: konfirmasi pembayaran, aktivasi akun, ekspirasi membership
- Format notifikasi harus profesional dan informatif

FITUR 7 — ADMIN DASHBOARD
- Panel terpisah, hanya bisa diakses role = ADMIN
- Tampilkan: jumlah member aktif, total transaksi, win rate sinyal, log aktivitas sistem
- Manajemen konten Daily Bias (edit/approve sebelum blast)
- Visualisasi: chart pertumbuhan member dan revenue bulanan

---

INSTRUKSI SEKARANG:
Mulai dari Fitur 1 (Paywall + Auth). Buat middleware autentikasi JWT di Express.js, termasuk:
1. generateToken(userId)
2. verifyToken(req, res, next)
3. checkMembership(req, res, next)
Jelaskan logika tiap fungsi secara singkat.