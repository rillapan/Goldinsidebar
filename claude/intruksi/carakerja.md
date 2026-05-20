# CARA KERJA SISTEM — GoldMind AI (SINYAL COHIBA)
Panduan operasional lengkap: apa yang dijalankan, bagaimana dipantau, dan apa yang harus dilakukan saat ada masalah.

---

## BAGIAN 1 — KOMPONEN SISTEM & CARA MENJALANKAN

Sistem terdiri dari **3 service** yang harus berjalan bersamaan + **2 infrastruktur** pendukung.

```
[Redis]  ←→  [AI Engine :8000]  →  [Backend :5000]  ←→  [Frontend :3000]
                    ↑
            [Twelve Data WebSocket]
```

---

### 1A. Redis (Infrastruktur Wajib)

**Fungsi:** Tempat menyimpan harga live, buffer candle, session JWT, dan reasoning sinyal terakhir.

**Cara jalankan (local):**
```bash
redis-server
```

**Verifikasi berjalan:**
```bash
redis-cli ping
# Expected: PONG 
STATUS : DONE
```

**Key-key penting yang harus ada:**
| Key | Isi | TTL | Ditulis oleh |
|-----|-----|-----|--------------|
| `price:xauusd` | Harga tick terkini XAUUSD | 120 detik | AI Engine (price_feed.py) |
| `candles:xauusd:1m` | Sorted set max 300 candle | Tidak ada TTL | AI Engine (price_feed.py) |
| `session:{userId}` | Device ID aktif per user | Sesuai JWT | Backend (auth) |
| `bot:last_reasoning:global` | Reasoning sinyal terakhir untuk bot Telegram | 4 jam (14400s) | AI Engine (signal_engine.py) |

**Cek isi Redis secara manual:**
```bash
redis-cli get price:xauusd | memurai-cli get price:xauusd               # harus ada angka harga
redis-cli zcard candles:xauusd:1m         # harus > 50 candle
redis-cli smembers bot:subscribers        # list chat_id member Telegram
```

---

### 1B. AI Engine (Python FastAPI — Port 8000)

**Fungsi:** Terima data harga dari Twelve Data WS → hitung indikator → kirim ke Claude API → push sinyal ke Backend.

**File `.env` yang wajib diisi:**
```bash
# goldmind-ai/ai-engine/.env
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-20250514
TWELVE_DATA_API_KEY=xxxxxxxxxxxx
BACKEND_URL=http://localhost:5000
INTERNAL_API_KEY=goldmind-internal-secret-key-2026
TELEGRAM_BOT_TOKEN=bot12345678:ABCdefghijklmnopqrstuvwxyz
NEWS_API_KEY=                         # opsional, untuk Daily Bias
FINNHUB_API_KEY=                      # opsional, untuk Daily Bias
FRONTEND_URL=http://localhost:3000
MIN_CONFIDENCE_THRESHOLD=65
```

**Install dependencies (sekali saja):**
```bash
cd goldmind-ai/ai-engine
pip install -r requirements.txt
```

**Cara jalankan (development):**
```bash
cd goldmind-ai/ai-engine
python -m uvicorn main:app --reload --port 8000

```

**Cara jalankan (production via PM2):**
```bash
# WAJIB dari folder goldmind-ai/ (bukan dari ai-engine/)
cd C:\Goldmind\GoldInsidebar\goldmind-ai
pm2 start ecosystem.config.js --only ai-engine

# Atau semua service sekaligus:
pm2 start ecosystem.config.js
```

**Endpoint yang tersedia:**
| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/health` | GET | Cek status scheduler + list jobs — gunakan untuk monitoring |
| `/api/generate-signal` | GET/POST | Trigger 1 siklus analisa secara manual (untuk test) |
| `/api/generate-bias` | POST | Trigger generate Daily Bias manual |

**Verifikasi AI Engine berjalan:**
```bash
curl http://localhost:8000/api/health
# Expected: {"status":"healthy","jobs":[...]}
```

---

### 1C. Backend (Node.js Express — Port 5000)

**Fungsi:** Terima sinyal dari AI Engine → simpan ke PostgreSQL → broadcast via Socket.IO → kelola auth, membership, payment, notifikasi.

**File `.env` yang wajib diisi:**
```bash
# goldmind-ai/backend/.env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/goldmind_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=minimum-32-karakter-random-string-wajib-diisi
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
AI_ENGINE_URL=http://localhost:8000
INTERNAL_API_KEY=goldmind-internal-secret-key-2026   # harus SAMA dengan AI Engine
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-20250514
XENDIT_SECRET_KEY=xnd_development_xxxx
XENDIT_CALLBACK_TOKEN=token-dari-dashboard-xendit
TELEGRAM_BOT_TOKEN=bot12345678:ABCdefghijklmnopqrstuvwxyz
TELEGRAM_CHANNEL_ID=@goldmind_signals_test            # atau -100xxxxxxxxxx
FONNTE_API_KEY=                                       # untuk WhatsApp blast
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=
EMAIL_FROM=noreply@goldmind.ai
```

**Setup database (sekali saja atau setelah schema berubah):**
```bash
cd goldmind-ai/backend
npm run db:migrate     # jalankan semua migration
npm run db:generate    # regenerate Prisma client
```

**Cara jalankan (development):**
```bash
cd goldmind-ai/backend
npm run dev
```

**Cara jalankan (production via PM2):**
```bash
cd goldmind-ai/backend
npm run build
pm2 start dist/server.js --name backend
```

**Verifikasi Backend berjalan:**
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok"}
```

---

### 1D. Frontend (Next.js — Port 3000)

**Fungsi:** Dashboard member, halaman landing, checkout, profil, chat AI.

**File `.env.local` yang wajib diisi:**
```bash
# goldmind-ai/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

**Cara jalankan (development):**
```bash
cd goldmind-ai/frontend
npm run dev
```

**Cara jalankan (production):**
```bash
cd goldmind-ai/frontend
npm run build
npm run start
```

---

## BAGIAN 2 — URUTAN STARTUP YANG BENAR

Jalankan **selalu dalam urutan ini**. Jika urutannya salah, Backend akan crash karena Redis belum siap.

```
1. Redis         → redis-server
2. PostgreSQL    → sudah berjalan (local: service, production: via systemctl)
3. AI Engine     → uvicorn main:app --reload --port 8000
4. Backend       → npm run dev  (di goldmind-ai/backend)
5. Frontend      → npm run dev  (di goldmind-ai/frontend)
```

**Cek semua berjalan:**
```bash
# 1. Redis
redis-cli ping                            # → PONG

# 2. AI Engine
curl http://localhost:8000/api/health

# 3. Backend
curl http://localhost:5000/api/health

# 4. Frontend
# Buka browser: http://localhost:3000
```

---

## BAGIAN 3 — PROSES OTOMATIS (YANG BERJALAN SENDIRI)

Setelah semua service berjalan, proses-proses ini berjalan otomatis tanpa intervensi manual.

### Proses Otomatis di AI Engine

| Proses | Interval | Fungsi |
|--------|----------|--------|
| **Price Feed WebSocket** | Real-time (setiap detik) | Terima tick XAUUSD dari Twelve Data → simpan ke Redis |
| **Signal Engine** | Setiap 5 menit (Senin-Jumat) | Ambil 200 candle → hitung 7 indikator → tanya Claude → push sinyal ke backend jika confidence > 65% |
| **Daily Bias** | Dipicu oleh Backend 07:00 WIB | Fetch berita → Claude API → kirim ke backend |

### Proses Otomatis di Backend (node-cron)

| Job | Jadwal | Fungsi |
|-----|--------|--------|
| **Job 1: Trigger Daily Bias** | 07:00 WIB, Senin-Jumat | POST ke AI Engine `/api/generate-bias` |
| **Job 2: Membership Expiry** | Setiap jam | Nonaktifkan membership expired, update status user |
| **Job 3: Reminder H-7** | 09:00 WIB harian | Kirim WA+Email ke user yang membership berakhir 4-7 hari lagi |
| **Job 4: Reminder H-3 Urgent** | 09:30 WIB harian | Kirim WA+Email urgent ke user yang membership berakhir ≤3 hari |
| **Job 5: Signal Outcome Monitor** | Setiap 5 menit | Bandingkan harga live vs SL/TP sinyal ACTIVE → update status TP_HIT/SL_HIT otomatis |

---

## BAGIAN 4 — CARA MEMANTAU SISTEM

### 4A. Pantau AI Engine

**Sinyal baru digenerate?**
```bash
# Cek log uvicorn — cari line seperti:
# "Signal generated: BUY confidence=78"
# "Signal pushed to backend successfully"
```

**Candle data masuk dari Twelve Data?**
```bash
redis-cli zcard candles:xauusd:1m
# Harus > 50 dan terus bertambah saat market buka
```

**Harga live tersedia?**
```bash
redis-cli get price:xauusd
# Harus ada nilai numerik, bukan null
```

**Trigger sinyal manual (untuk test):**
```bash
curl http://localhost:8000/api/generate-signal
# AI Engine akan jalankan 1 siklus analisa sekarang juga
```

**Cek status scheduler:**
```bash
curl http://localhost:8000/api/health
# Lihat field "jobs" — harus ada entry untuk signal_engine dan bias_engine
```

---

### 4B. Pantau Backend

**Sinyal tersimpan ke database?**
```bash
# Buka Prisma Studio
cd goldmind-ai/backend
npm run db:studio
# Buka browser: http://localhost:5555
# Lihat tabel Signal
```

**Test endpoint internal (simulasi kiriman dari AI Engine):**
```bash
curl -X POST http://localhost:5000/api/internal/signals \
  -H "Content-Type: application/json" \
  -H "X-Internal-Key: goldmind-internal-secret-key-2026" \
  -d '{
    "signal": "BUY",
    "entry": "2350.50",
    "sl": "2340.00",
    "tp": "2375.00",
    "confidence": "75",
    "timeframe": "M15",
    "reasoning": "RSI oversold di 28, EMA 20 memberikan support kuat."
  }'
# Expected: {"success":true} + sinyal muncul di Telegram channel dalam <5 detik
```

**Pantau cron jobs berjalan:**
Lihat console log backend — setiap job yang berjalan akan print log seperti:
```
[CRON] Job 5: Checking signal outcomes...
[CRON] Signal #123 closed: TP_HIT at 2375.00
```

---

### 4C. Pantau Telegram

**Verifikasi broadcast berfungsi:**
1. Jalankan test endpoint di 4B di atas
2. Sinyal harus muncul di Telegram channel dalam < 5 detik
3. Jika tidak muncul → cek `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHANNEL_ID` di `.env`

**Cek format sinyal Telegram (yang akan diterima member):**
```
🟢 SINYAL BUY — XAUUSD

⏱ Timeframe: M15
📍 Entry: 2350.50
🛑 Stop Loss: 2340.00
🎯 Take Profit: 2375.00
📊 Confidence: 75%
⚖️ Risk/Reward: 1:2.0

💬 RSI oversold di 28, EMA 20 memberikan support kuat.

⚠️ Bukan rekomendasi investasi. Gunakan risk management.
```

---

## BAGIAN 5 — ALUR KETIKA MEMBER BARU BAYAR

Ini alur lengkap dari klik "Berlangganan" sampai member bisa akses dashboard.

```
1. User klik "Berlangganan" di frontend
      ↓
2. Backend POST ke Xendit API → dapat invoice_url
      ↓
3. User diredirect ke halaman bayar Xendit
      ↓
4. User bayar (QRIS / VA / e-Wallet)
      ↓
5. Xendit kirim POST webhook ke: /api/webhooks/xendit
      ↓
6. Backend verifikasi X-CALLBACK-TOKEN header
      ↓
7. Backend buat record Membership di PostgreSQL (status=ACTIVE, endDate=+30 hari)
      ↓
8. Backend update User.status = ACTIVE
      ↓
9. sendActivationNotification() dipanggil:
   - Kirim WA konfirmasi ke nomor member
   - Kirim Email HTML aktivasi
   - Buat Telegram invite link (expire 48 jam, limit 1 orang)
   - Kirim invite link ke WA member
      ↓
10. Member klik invite link → masuk ke Telegram channel private
      ↓
11. Member login ke dashboard → akses penuh terbuka
```

**Untuk Approach A (validasi — tanpa full automation):**
Setelah konfirmasi bayar dari Xendit:
```bash
# Tambah chat_id member ke bot:subscribers di Redis
redis-cli sadd bot:subscribers {chat_id_member}

# Invite manual member ke Telegram channel
```

---

## BAGIAN 6 — TROUBLESHOOTING MASALAH UMUM

### Masalah: Backend crash saat startup

**Penyebab paling umum:** Redis belum berjalan atau tidak bisa dikoneksi.

**Cek:**
```bash
redis-cli ping   # harus PONG
```

**Solusi:** Jalankan Redis dulu (`redis-server`), baru restart Backend.

---

### Masalah: Sinyal tidak muncul di Telegram

**Langkah debug:**

1. Cek apakah candle data masuk:
   ```bash
   redis-cli zcard candles:xauusd:1m   # harus > 50
   ```

2. Cek apakah Twelve Data WebSocket terhubung:
   - Lihat log AI Engine — harus ada "Connected to Twelve Data WebSocket"
   - Jika tidak: cek `TWELVE_DATA_API_KEY` di `.env`

3. Cek apakah sinyal digenerate tapi confidence tidak cukup:
   - Lihat log AI Engine — cari "Signal skipped: confidence=XX < threshold=65"
   - Solusi sementara: turunkan `MIN_CONFIDENCE_THRESHOLD` ke 60

4. Cek apakah backend menerima sinyal tapi Telegram gagal kirim:
   - Lihat log Backend — cari error "sendSignalNotification failed"
   - Penyebab: `TELEGRAM_BOT_TOKEN` salah atau bot belum jadi admin channel

5. Test manual end-to-end:
   ```bash
   curl http://localhost:8000/api/generate-signal
   ```

---

### Masalah: Member tidak bisa login (403 MULTI_LOGIN_DETECTED)

**Penyebab:** User login dari device lain, device ID lama masih terikat di Redis.

**Solusi (reset session):**
```bash
redis-cli del session:{userId}
```
Kemudian minta user login ulang.

---

### Masalah: Membership member tidak aktif padahal sudah bayar

**Cek:**
```bash
# Di Prisma Studio atau SQL langsung
# Lihat tabel Membership — apakah ada record baru dengan status=ACTIVE?
```

**Jika tidak ada:** Webhook Xendit tidak sampai ke server.
- Untuk development: Xendit tidak bisa POST ke localhost. Gunakan ngrok:
  ```bash
  ngrok http 5000
  # Daftarkan URL ngrok ke Xendit dashboard sebagai webhook URL
  ```

---

### Masalah: Reply "kenapa?" ke bot tidak direspons

**Penyebab:** File `telegram_bot.py` belum dibuat atau `store_reasoning_for_bot` belum dipanggil di signal_engine.

**Status:** Fitur ini BELUM DIIMPLEMENTASI (lihat Fase 3 di tahapan.md).

**Solusi sementara:** Member bisa baca reasoning di Telegram channel — format sinyal sudah menyertakan reasoning singkat.

---

## BAGIAN 7 — PEMANTAUAN HARIAN (CHECKLIST OPERATOR)

Lakukan ini setiap hari trading saat pasar buka (Senin–Jumat):

### Pagi (Sebelum 07:00 WIB)
- [ ] Pastikan Redis berjalan: `redis-cli ping`
- [ ] Pastikan AI Engine berjalan: `curl localhost:8000/api/health`
- [ ] Pastikan Backend berjalan: `curl localhost:5000/api/health`
- [ ] Pastikan candle data masuk: `redis-cli zcard candles:xauusd:1m` > 50

### Setelah 07:00 WIB
- [ ] Daily Bias sudah muncul di Telegram channel
- [ ] Jika tidak muncul → trigger manual: `curl localhost:8000/api/generate-bias` atau POST ke `/api/internal/generate-bias`

### Sepanjang Hari
- [ ] Pantau sinyal masuk di Telegram channel
- [ ] Untuk setiap sinyal, evaluasi:
  - Entry price masuk akal vs harga pasar saat sinyal
  - SL tidak terlalu ketat (tidak dalam 5 pip dari entry)
  - TP realistis (R:R minimal 1:1.5)
  - Reasoning berbahasa Indonesia, minimal 2 kalimat

### Sore/Malam
- [ ] Cek hasil sinyal hari ini: apakah TP hit atau SL hit?
- [ ] Catat di spreadsheet pribadi untuk tracking win rate awal

---

## BAGIAN 8 — PRODUCTION (VPS) — PERINTAH PENTING

Untuk deployment ke server production (Ubuntu 22.04):

**Install PM2:**
```bash
npm install -g pm2
```

**Jalankan semua service via PM2:**
```bash
# Backend
cd goldmind-ai/backend && npm run build
pm2 start dist/server.js --name goldmind-backend

# AI Engine
cd goldmind-ai/ai-engine
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name goldmind-ai-engine --interpreter none

# Frontend
cd goldmind-ai/frontend && npm run build
pm2 start "npm run start" --name goldmind-frontend --cwd goldmind-ai/frontend

# Simpan config PM2 agar auto-restart setelah reboot
pm2 save
pm2 startup
```

**Pantau semua proses:**
```bash
pm2 status          # lihat semua proses dan statusnya
pm2 logs            # lihat semua log
pm2 logs backend    # log backend saja
pm2 logs ai-engine  # log AI engine saja
```

**Restart service:**
```bash
pm2 restart backend
pm2 restart ai-engine
pm2 restart all
```

**Nginx config (reverse proxy):**
```nginx
server {
    server_name goldmind.ai www.goldmind.ai;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## RINGKASAN SATU HALAMAN

```
STARTUP URUTAN:
  1. redis-server
  2. postgresql (sudah jalan)
  3. uvicorn main:app --reload --port 8000   (ai-engine)
  4. npm run dev                              (backend)
  5. npm run dev                              (frontend)

MONITOR HARIAN:
  redis-cli zcard candles:xauusd:1m  → harus > 50
  curl localhost:8000/api/health      → harus ada jobs
  Telegram channel                    → Daily Bias muncul 07:00, sinyal muncul tiap 5 menit

TEST MANUAL SINYAL:
  curl http://localhost:8000/api/generate-signal

TEST TELEGRAM:
  curl -X POST localhost:5000/api/internal/signals \
    -H "X-Internal-Key: goldmind-internal-secret-key-2026" \
    -H "Content-Type: application/json" \
    -d '{"signal":"BUY","entry":"2350","sl":"2340","tp":"2375","confidence":"75","timeframe":"M15","reasoning":"Test"}'

MEMBER BARU BAYAR:
  Xendit webhook → otomatis aktif → WA+Email+Telegram invite dikirim

RESET SESSION (user multi-login):
  redis-cli del session:{userId}

PM2 PRODUCTION:
  pm2 status | pm2 logs | pm2 restart all
```
