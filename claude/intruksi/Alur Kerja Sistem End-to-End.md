Ini adalah gambaran alur kerja sistem SINYAL COHIBA secara end-to-end. Gunakan ini sebagai referensi arsitektur saat membangun setiap komponen.

---

TAHAP 1 — DATA INGESTION (Python Service)
Input  : Twelve Data WebSocket stream (XAUUSD OHLCV real-time, 1 menit)
Proses :
  - Python subscribe ke Twelve Data WebSocket
  - Setiap candle masuk → simpan ke Redis (buffer harga live)
  - Setiap 5 menit → ambil 200 candle terakhir → hitung indikator via pandas-ta:
    RSI(14), MACD(12,26,9), EMA(20), EMA(50), EMA(200), BB(20), ATR(14)
  - Fetch berita terbaru dari NewsAPI / Finnhub sebagai konteks sentimen
Output : Dict Python berisi OHLCV + semua nilai indikator + ringkasan berita

TAHAP 2 — AI PROCESSING (Claude API)
Input  : Output dari Tahap 1 (format JSON/teks terstruktur)
Proses :
  - Prompt Builder membungkus data menjadi prompt terstruktur:
    "Kamu adalah AI Trading Analyst. Berikut data XAUUSD terkini: [data].
     Tentukan apakah ada setup sinyal valid. Jika ada, return JSON berikut:
     { signal, entry, sl, tp, confidence, reasoning }"
  - Kirim ke Claude API: POST https://api.anthropic.com/v1/messages
  - Parse response → validasi JSON output
Output : { signal: BUY/SELL/HOLD, entry, sl, tp, confidence, reasoning }

TAHAP 3 — GATED CONTENT (Express.js + PostgreSQL)
Input  : Output sinyal dari Tahap 2
Proses :
  - Simpan sinyal ke tabel signals (PostgreSQL) beserta timestamp & metadata
  - Push ke semua connected member via Socket.IO:
    io.to('premium_users').emit('new_signal', signalData)
  - Setiap request ke /api/signals → cek JWT → cek status membership di DB
    Jika ACTIVE → return data sinyal lengkap
    Jika EXPIRED/FREE → return 403 + redirect ke halaman upgrade
Output : Sinyal tampil real-time di dashboard member premium

TAHAP 4 — PAYMENT GATEWAY (Xendit Webhook)
Input  : User klik "Berlangganan" di halaman checkout
Proses :
  - Server POST ke Xendit API → dapat invoice_url + invoice_id
  - Redirect user ke Xendit hosted payment page
  - Xendit kirim POST webhook ke: /api/webhooks/xendit
  - Server verifikasi X-CALLBACK-TOKEN header
  - Jika valid → UPDATE users SET status='ACTIVE', expired_at=NOW()+30 days
  - Trigger notifikasi: WA konfirmasi + Email aktivasi
Output : User status berubah ke ACTIVE, akses dashboard terbuka otomatis

---

RINGKASAN ALUR SINGKAT:
Twelve Data WS → pandas-ta → Claude API → PostgreSQL → Socket.IO → Member Dashboard
                                                    ↓
                                              Xendit Webhook → Aktivasi Member Otomatis

---

INSTRUKSI AKHIR:
Sekarang buat file struktur folder proyek lengkap untuk monorepo ini:
/goldmind-ai
  /frontend   → Next.js 14
  /backend    → Node.js + Express.js
  /ai-engine  → Python + FastAPI
  /shared     → types, constants, utils bersama

Untuk setiap folder, tampilkan struktur file utama yang diperlukan. Setelah itu konfirmasi dan kita mulai build fase pertama: Infrastruktur + Database Schema.