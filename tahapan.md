# SINYAL COHIBA — Tahapan Pengerjaan

**Approach yang dipilih: A (Telegram Bot-First Validation)**
Dihasilkan oleh /plan-ceo-review pada 2026-05-08
Branch: main | Mode: HOLD SCOPE

---

## Konteks Strategis

Kode platform sudah ~70% selesai (7 dari 7 fitur). Namun belum ada satu pun paying customer.
Pertanyaan yang harus dijawab sebelum deploy full platform:

> **Apakah ada trader yang MAU BAYAR Rp 200.000/2 bulan untuk sinyal XAUUSD via Telegram,
> sebelum dashboard web selesai dibangun?**

Kalau 5+ orang bayar di 14 hari pertama → lanjut ke Approach B (deploy full platform).
Kalau 0 orang bayar → pivot sebelum sunk cost 50-60 hari kerja.

---

## APPROACH A — Validation Phase (Target: 2 Minggu)

### Fase 0: Pre-Code Assignment (7 Hari Sebelum Coding)

**WAJIB dikerjakan sebelum menulis satu baris kode pun.**

Tujuan: verifikasi bahwa target user nyata ada, bukan asumsi.

**Langkah:**

1. Join 3 grup Telegram XAUUSD Indonesia aktif sebagai member biasa (bukan sebagai founder/marketer)
   - Pilih grup dengan 500+ member dan daily activity
   - Amati: jam berapa sinyal diposting? Format apa? Berapa lama setelah sinyal orang eksekusi?
   
2. Lurk selama 7 hari. Catat:
   - Berapa sinyal per hari yang diposting
   - Berapa % yang direspons dengan "mantap / masuk / oke"
   - Berapa % yang bertanya "kenapa entry di sini?"
   - Format sinyal yang paling banyak di-forward
   - Harga membership grup-grup tersebut

3. DM langsung 5 member aktif:
   - Pertanyaan: "Kalau ada sinyal XAUUSD otomatis via Telegram, akurat dan ada penjelasan
     singkatnya, kamu mau coba gratis 7 hari?"
   - Catat setiap jawaban verbatim
   - Tanda "mau coba" = valid. Tanda "mantap bro" = TIDAK cukup.

**Gate Fase 0:** Jika 3 dari 5 orang menjawab "mau coba" → lanjut ke Fase 1.
Jika respon dingin → pivotkan pesan/format sebelum building.

**Deliverable:** Catatan observasi (simpan di `.claude/intruksi/observasi-komunitas.md`)

---

### Fase 1: Environment & Dependencies Setup (Hari 1-2)

#### 1A. Dapatkan API Keys yang Dibutuhkan

Untuk Approach A, hanya 4 env vars yang kritis:

| Env Var | Dibutuhkan Untuk | Cara Mendapatkan |
|---------|-----------------|------------------|
| `TELEGRAM_BOT_TOKEN` | Semua fungsi bot | BotFather → /newbot → salin token |
| `TELEGRAM_CHANNEL_ID` | Broadcast sinyal | Buat channel → invite bot → pakai @namaChannel atau numeric ID |
| `CLAUDE_API_KEY` | Signal engine (sudah ada) | console.anthropic.com |
| `TWELVE_DATA_API_KEY` | Price feed (sudah ada) | twelvedata.com |

**Yang TIDAK perlu untuk Approach A:**
- FONNTE_API_KEY (WhatsApp) — skip dulu
- SMTP credentials — skip dulu
- DATABASE_URL + REDIS_URL — hanya perlu Redis

#### 1B. Setup Backend `.env`

File: `goldmind-ai/backend/.env`

```bash
# Minimal untuk Approach A
NODE_ENV=development
PORT=5000
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-20250514
INTERNAL_API_KEY=goldmind-internal-secret-key-2026
FRONTEND_URL=http://localhost:3000
AI_ENGINE_URL=http://localhost:8000

# WAJIB untuk Telegram blast
TELEGRAM_BOT_TOKEN=bot12345678:ABCdefghijklmnopqrstuvwxyz
TELEGRAM_CHANNEL_ID=@goldmind_signals_test

# Kosongkan yang belum perlu (agar tidak error)
FONNTE_API_KEY=
SMTP_PASS=
XENDIT_SECRET_KEY=
XENDIT_CALLBACK_TOKEN=
JWT_SECRET=dev-secret-minimum-32-chars-untuk-jwt
```

#### 1C. Setup AI Engine `.env`

File: `goldmind-ai/ai-engine/.env`

```bash
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-20250514
TWELVE_DATA_API_KEY=xxxxxxxxxxxx
BACKEND_URL=http://localhost:5000
INTERNAL_API_KEY=goldmind-internal-secret-key-2026

# Telegram Bot Token — sama dengan backend
TELEGRAM_BOT_TOKEN=bot12345678:ABCdefghijklmnopqrstuvwxyz

# Opsional untuk Approach A
NEWS_API_KEY=
FINNHUB_API_KEY=
FRONTEND_URL=http://localhost:3000
```

#### 1D. Tambah python-telegram-bot ke AI Engine

Edit `goldmind-ai/ai-engine/requirements.txt` — tambah baris:

```
python-telegram-bot==21.6
```

Install:
```bash
cd goldmind-ai/ai-engine
pip install python-telegram-bot==21.6
```

**Verifikasi install:**
```bash
python -c "from telegram import Bot; print('OK')"
```

---

### Fase 2: Test Telegram Broadcast (Hari 2)

**Tujuan:** Verifikasi bahwa `sendSignalNotification()` sudah bisa broadcast ke Telegram.
Ini sudah BUILT di `backend/src/lib/notifications.ts:199`. Hanya perlu dikonfigurasi.

#### 2A. Buat Bot dan Channel Test

1. Buka Telegram → cari `@BotFather`
2. `/newbot` → ikuti instruksi → simpan token
3. Buat channel Telegram baru (private dulu, untuk test)
4. Invite bot ke channel: Settings → Administrators → Add Administrator → bot kamu
5. Grant permission: "Post Messages"
6. Dapatkan Channel ID: forward satu pesan dari channel ke `@userinfobot`

#### 2B. Test Manual via cURL

Setelah backend berjalan (`npm run dev` di `goldmind-ai/backend`):

```bash
# Test endpoint internal/signals dengan payload contoh
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
    "reasoning": "RSI oversold di 28, EMA 20 memberikan support kuat. Momentum bullish terdeteksi."
  }'
```

**Expected:** Sinyal muncul di Telegram channel dalam < 5 detik.

**Failure modes:**
- Bot tidak bisa post → cek permission "Post Messages" di channel
- "Chat not found" → verifikasi TELEGRAM_CHANNEL_ID (coba format numeric -100xxxxxxxxxx)
- Timeout → cek TELEGRAM_BOT_TOKEN tidak salah
- Sinyal tersimpan ke DB tapi Telegram tidak terkirim → cek console log backend, `sendSignalNotification` berjalan async dan errors tidak block response

**Format sinyal yang akan dikirim (sudah fixed di notifications.ts:208-224):**
```
🟢 SINYAL BUY — XAUUSD

⏱ Timeframe: M15
📍 Entry: 2350.50
🛑 Stop Loss: 2340.00
🎯 Take Profit: 2375.00
📊 Confidence: 75%
⚖️ Risk/Reward: 1:2.0

💬 RSI oversold di 28, EMA 20 memberikan support kuat.
    Momentum bullish terdeteksi.

⚠️ Bukan rekomendasi investasi. Gunakan risk management.
```

---

### Fase 3: "Kenapa?" Bot Handler (Hari 3-4)

**Tujuan:** Trader bisa reply "kenapa?" ke bot dan mendapat penjelasan reasoning sinyal terakhir.

#### 3A. Buat File Bot Handler

File baru: `goldmind-ai/ai-engine/services/telegram_bot.py`

```python
"""
SINYAL COHIBA — Telegram Interactive Bot
Menangani pesan masuk dari subscriber.
Satu-satunya command yang direspons: "kenapa?" / "kenapa" / "why"
"""

import os
import asyncio
import logging
import redis.asyncio as aioredis
from telegram import Update, Bot
from telegram.ext import Application, MessageHandler, filters, ContextTypes

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

logger = logging.getLogger(__name__)


async def _get_redis() -> aioredis.Redis:
    return aioredis.from_url(REDIS_URL, decode_responses=True)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handler untuk semua pesan teks.
    Hanya merespons 'kenapa?' — abaikan semua pesan lain.
    """
    if not update.message or not update.message.text:
        return

    text = update.message.text.strip().lower()
    chat_id = str(update.message.chat_id)

    # Hanya respons keyword spesifik
    kenapa_keywords = {"kenapa?", "kenapa", "why?", "why", "knp", "knp?"}
    if text not in kenapa_keywords:
        return

    r = await _get_redis()
    try:
        # Ambil reasoning sinyal terakhir dari Redis
        # Key: bot:last_reasoning:{chat_id}
        # Key ini di-set oleh store_reasoning_for_bot() saat sinyal baru masuk
        reasoning = await r.get(f"bot:last_reasoning:{chat_id}")

        if not reasoning:
            # Coba ambil dari global (channel broadcast) jika personal key kosong
            reasoning = await r.get("bot:last_reasoning:global")

        if reasoning:
            await update.message.reply_text(
                f"💬 *Penjelasan Sinyal Terakhir:*\n\n{reasoning}\n\n"
                f"⚠️ _Analisa ini bukan rekomendasi investasi. "
                f"Perdagangan mengandung risiko. Gunakan risk management._",
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(
                "Maaf, penjelasan untuk sinyal ini belum tersedia. "
                "Coba lagi setelah sinyal baru muncul."
            )
    except Exception as e:
        logger.error(f"Error handling 'kenapa' from {chat_id}: {e}")
        await update.message.reply_text(
            "Maaf, ada gangguan teknis. Coba lagi dalam beberapa menit."
        )
    finally:
        await r.aclose()


def build_application() -> Application:
    """Bangun Telegram Application dengan handler."""
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message)
    )
    return app


async def store_reasoning_for_bot(reasoning: str, subscriber_chat_ids: list[str]) -> None:
    """
    Simpan reasoning ke Redis saat sinyal baru di-generate.
    Dipanggil oleh signal_engine setelah sinyal valid.
    TTL: 4 jam (sinyal tidak relevan setelah sesi trading selesai).
    """
    r = await _get_redis()
    try:
        # Global key untuk channel broadcast
        await r.setex("bot:last_reasoning:global", 14400, reasoning)  # 4 jam
        # Per-subscriber key (jika bot di-DM langsung)
        for chat_id in subscriber_chat_ids:
            await r.setex(f"bot:last_reasoning:{chat_id}", 14400, reasoning)
    finally:
        await r.aclose()
```

#### 3B. Update main.py — Jalankan Bot Bersamaan FastAPI

Edit `goldmind-ai/ai-engine/main.py` — tambah startup bot:

```python
# Tambah import di atas
from services.telegram_bot import build_application as build_bot_app

# Di dalam lifespan(), setelah signal_scheduler.start():
bot_app = build_bot_app()
await bot_app.initialize()
await bot_app.start()
await bot_app.updater.start_polling(drop_pending_updates=True)
print("🤖 Telegram Bot aktif — mendengarkan pesan 'kenapa?'")
```

Dan di bagian shutdown:
```python
# Setelah signal_scheduler.shutdown():
await bot_app.updater.stop()
await bot_app.stop()
await bot_app.shutdown()
```

#### 3C. Update Signal Engine — Simpan Reasoning ke Redis

Edit `goldmind-ai/ai-engine/services/signal_engine.py` — di dalam fungsi yang mengirim sinyal ke backend, tambah panggilan ke `store_reasoning_for_bot`:

```python
# Setelah push_signal_to_backend() berhasil, tambah:
from services.telegram_bot import store_reasoning_for_bot

# Ambil subscriber list dari Redis
subscribers = await r.smembers("bot:subscribers")
await store_reasoning_for_bot(reasoning, list(subscribers))
```

**Failure modes Fase 3:**
- Bot polling gagal start → cek TELEGRAM_BOT_TOKEN valid
- Polling conflicts → pastikan tidak ada 2 instance bot berjalan bersamaan
- Redis TTL terlalu pendek → reasoning hilang sebelum user tanya → set ke 14400s (4 jam)
- Reasoning kosong/None dari Claude → sudah di-handle: reply "belum tersedia"

---

### Fase 4: Subscriber Management (Hari 4)

**Tujuan:** Hanya `chat_id` yang sudah bayar yang bisa menerima sinyal broadcast.

**Konsep:** Redis Set `bot:subscribers` berisi list chat_id yang authorized.

#### 4A. Add Subscriber (Manual — Founder)

Founder jalankan setelah konfirmasi pembayaran Xendit:

```bash
# Di Redis CLI (setelah user bayar dan konfirmasi)
redis-cli sadd bot:subscribers 123456789

# Cek siapa saja yang sudah subscribe
redis-cli smembers bot:subscribers

# Remove subscriber (jika membership expired)
redis-cli srem bot:subscribers 123456789
```

#### 4B. Cara User Mendapatkan chat_id Mereka

1. User DM ke bot: `/start`
2. Bot reply dengan chat_id mereka

Tambah handler `/start` ke `telegram_bot.py`:

```python
from telegram.ext import CommandHandler

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.message.chat_id
    await update.message.reply_text(
        f"Halo! 👋\n\n"
        f"Chat ID kamu: `{chat_id}`\n\n"
        f"Kirimkan angka ini ke admin setelah pembayaran dikonfirmasi "
        f"untuk mengaktifkan akses sinyal kamu.\n\n"
        f"Setelah aktif, kamu akan menerima sinyal XAUUSD secara otomatis "
        f"dan bisa reply *kenapa?* untuk mendapat penjelasan.",
        parse_mode="Markdown"
    )

# Tambah ke build_application():
app.add_handler(CommandHandler("start", start_command))
```

#### 4C. Broadcast ke Subscribers (Modifikasi notifications.ts)

Saat ini `sendSignalNotification()` hanya broadcast ke `TELEGRAM_CHANNEL_ID` (satu channel).
Untuk Approach A, ini sudah cukup — subscriber join channel tersebut setelah diundang oleh founder.

**Flow subscriber:**
1. User bayar via Xendit link
2. Founder konfirmasi manual → jalankan `redis-cli sadd bot:subscribers {chat_id}`
3. Founder invite user ke Telegram channel (private)
4. User menerima sinyal di channel, bisa DM bot untuk "kenapa?"

**Catatan:** Untuk fase validasi, tidak perlu auto-activation. Manual activation cukup untuk ≤ 20 subscriber.

---

### Fase 5: Silent Test — Founder Only (Hari 5-9, 5 Trading Days)

**Tujuan:** Verifikasi signal engine menghasilkan sinyal yang secara teknikal masuk akal
sebelum ada user lain yang melihatnya.

#### 5A. Setup Minimal Production-Like Environment

```bash
# Jalankan Redis (jika local)
redis-server &

# Jalankan AI Engine
cd goldmind-ai/ai-engine
python -m uvicorn main:app --reload --port 8000

# Jalankan Backend (tab terpisah)
cd goldmind-ai/backend
npm run dev
```

#### 5B. Checklist Verifikasi Sinyal (Per Hari Trading)

Untuk setiap sinyal yang diterima di Telegram founder, evaluasi:

| Kriteria | Cek |
|----------|-----|
| Format sinyal lengkap (Entry/SL/TP/Confidence/Reasoning) | ✓/✗ |
| Entry price masuk akal vs harga pasar saat sinyal dikirim | ✓/✗ |
| SL tidak terlalu ketat (< 5 pip dari entry XAUUSD) | ✓/✗ |
| TP realistis (R:R minimal 1:1.5) | ✓/✗ |
| Reasoning dalam Bahasa Indonesia, ≥ 2 kalimat | ✓/✗ |
| Sinyal sampai di Telegram dalam < 60 detik dari market condition | ✓/✗ |
| Reply "kenapa?" memberikan penjelasan yang relevan | ✓/✗ |

**Gate Fase 5:** 4 dari 5 hari trading, semua kriteria terpenuhi.
Jika gagal → debug signal engine sebelum lanjut ke user eksternal.

#### 5C. Bug yang Harus Dicek

**ATR Proxy Issue (HIGH PRIORITY):**
`signal_engine.py` menggunakan synthetic ATR karena data tick tidak ada OHLC:
```python
high = close * 1.001  # asumsi 0.1% spread
low = close * 0.999
```
Ini bisa menghasilkan SL/TP yang tidak akurat. Selama silent test, bandingkan
level SL/TP yang di-generate dengan ATR real dari chart TradingView.
Jika selisih > 10 pip secara konsisten → perlu perbaiki kalkulasi sebelum public.

**MIN_CONFIDENCE threshold:**
Default di `signal_engine.py`: 65. Jika tidak ada sinyal yang muncul dalam 1 hari
trading penuh → cek Redis apakah candle data tersimpan dengan benar:
```bash
redis-cli zcard candles:xauusd:1m  # harus > 50
redis-cli get price:xauusd          # harus ada nilai
```

---

### Fase 6: Free Trial Launch (Hari 10-14)

**Tujuan:** 5+ orang bayar Rp 200.000/2 bulan dalam 14 hari pertama.

#### 6A. Distribution (Hari 10-11)

1. Masuk ke 3 grup XAUUSD Indonesia yang sudah diobservasi di Fase 0
2. Post 1 sinyal per sesi trading (manual, copy dari Telegram bot):
   ```
   🟢 SIGNAL BUY XAUUSD (gratis, 7 hari trial)
   Entry: 2350.50 | SL: 2340 | TP: 2375
   Confidence: 75% — generated by AI
   
   DM saya untuk akses gratis 7 hari 👆
   ```
3. DM setiap orang yang react atau bertanya

#### 6B. Conversion Script

Saat follow-up DM:

> "Halo! Ini sinyal XAUUSD otomatis dari AI yang kami develop.
> Akurasinya kami test sendiri 5 hari trading, hasilnya cukup promising.
> Kamu bisa coba gratis 7 hari — tidak perlu data kartu kredit.
> Kalau cocok, harganya Rp 200.000 untuk 2 bulan. Harga ini dikunci selamanya.
> Mau coba?"

#### 6C. Payment Flow (Manual, Hari 12-14)

Jika user mau bayar:

1. Kirim Xendit invoice link (buat manual di dashboard Xendit)
2. User bayar via QRIS/VA/e-Wallet
3. Founder terima notifikasi Xendit
4. Founder jalankan:
   ```bash
   redis-cli sadd bot:subscribers {chat_id_user}
   ```
5. Invite user ke Telegram channel (private)
6. Konfirmasi ke user: "Akses aktif sampai [tanggal + 60 hari]"

**Waktu aktivasi yang dijanjikan ke user: maksimal 12 jam dari pembayaran.**

---

## GATE CRITERIA — Lanjut ke Approach B atau Pivot

### Kondisi LANJUT ke Approach B (Full Platform):

- [ ] 5+ orang telah membayar Rp 200.000/2 bulan sebelum Hari 14
- [ ] Win rate sinyal minimal 55% selama silent test (berdasarkan evaluasi manual Fase 5)
- [ ] Tidak ada complaint tentang format sinyal dari trial user
- [ ] Signal delivery latency < 60 detik secara konsisten

Jika semua terpenuhi → **lanjut ke Approach B (roadmap di bawah).**

### Kondisi PIVOT:

- [ ] 0 orang bayar setelah 14 hari
- Evaluasi: apakah masalah di produk, distribusi, atau harga?
- Coba: ganti channel distribusi, ubah harga, atau ubah format sinyal

---

## APPROACH B — Full Platform Completion (Setelah Gate Terpenuhi)

Ini roadmap Approach B jika validasi berhasil. Kode sudah ~70% siap.
Dikerjakan setelah Approach A gate terpenuhi.

### Prioritas Pengerjaan Approach B

**PRIORITAS 1 — BLOCKER (Minggu 1-2)**

| Item | File | Gap | Estimasi |
|------|------|-----|----------|
| Setup VPS (Ubuntu 22.04, 2vCPU/4GB) | — | Belum ada server | 1 hari |
| Domain + SSL (Certbot/Let's Encrypt) | — | Belum ada domain | 0.5 hari |
| PostgreSQL + Redis di VPS | — | Hanya local saat ini | 0.5 hari |
| Semua .env production dikonfigurasi | .env files | Env vars production kosong | 0.5 hari |
| Deploy backend + ai-engine via PM2 | ecosystem.config.js | Belum ada PM2 config | 1 hari |
| Deploy frontend Next.js (build + start) | — | Belum pernah di-build | 0.5 hari |
| Nginx reverse proxy config | nginx.conf | Belum ada | 0.5 hari |
| Test end-to-end di VPS | — | Belum pernah ditest | 1 hari |

**PRIORITAS 2 — FITUR GAP (Minggu 2-3)**

| Item | File | Gap | Estimasi |
|------|------|-----|----------|
| Signal position update (auto SL/TP change) | ai-engine/signal_engine.py | Belum ada loop monitoring | 3 hari |
| Xendit auto-activation (bukan manual) | backend/routes/webhook.routes.ts | Sudah ada tapi perlu test di production | 1 hari |
| Admin dashboard chart (member growth, revenue) | frontend/app/admin/page.tsx | UI ada, data endpoint belum | 2 hari |
| Hero image → screenshot dashboard asli | frontend/components/ui/hero-2-1.tsx | Tunggu dashboard selesai di-deploy | 0.5 hari |

**PRIORITAS 3 — POLISH (Minggu 3)**

| Item | File | Gap | Estimasi |
|------|------|-----|----------|
| Accessibility audit landing page | globals.css, hero-2-1.tsx | WCAG contrast, reduced motion | 1 hari |
| DESIGN.md dokumentasi | DESIGN.md (baru) | Belum ada design system doc | 2 jam |
| Load testing (k6 atau Artillery) | — | Belum ada | 0.5 hari |
| Signal backtest vs real OHLC data | ai-engine/signal_engine.py | ATR proxy issue | 2 hari |

---

## Env Vars Lengkap untuk Approach B (Production)

### Backend (`goldmind-ai/backend/.env.production`)

```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://goldmind.ai
DATABASE_URL=postgresql://user:pass@localhost:5432/goldmind_prod
REDIS_URL=redis://localhost:6379
JWT_SECRET=[generate: openssl rand -hex 32]
JWT_EXPIRES_IN=7d
AI_ENGINE_URL=http://localhost:8000
XENDIT_SECRET_KEY=xnd_production_xxxx
XENDIT_CALLBACK_TOKEN=[dari dashboard Xendit]
INTERNAL_API_KEY=[generate: openssl rand -hex 24]
CLAUDE_API_KEY=sk-ant-xxxx
CLAUDE_MODEL=claude-sonnet-4-20250514
TELEGRAM_BOT_TOKEN=botXXXX:YYYY
TELEGRAM_CHANNEL_ID=@goldmind_signals
FONNTE_API_KEY=[dari fonnte.com]
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=[dari resend.com]
EMAIL_FROM=noreply@goldmind.ai
```

### AI Engine (`goldmind-ai/ai-engine/.env.production`)

```bash
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=sk-ant-xxxx
CLAUDE_MODEL=claude-sonnet-4-20250514
TWELVE_DATA_API_KEY=xxxx
BACKEND_URL=http://localhost:5000
INTERNAL_API_KEY=[sama dengan backend]
TELEGRAM_BOT_TOKEN=botXXXX:YYYY
NEWS_API_KEY=xxxx
FINNHUB_API_KEY=xxxx
FRONTEND_URL=https://goldmind.ai
MIN_CONFIDENCE_THRESHOLD=65
```

---

## Failure Modes yang Harus Di-Address (Approach A)

| Scenario | Dampak | Mitigasi |
|----------|--------|----------|
| Redis mati | Bot tidak bisa ambil reasoning, signal engine tidak bisa simpan candle | Setup Redis auto-restart (`systemctl enable redis`) |
| Telegram API timeout | Sinyal tidak terkirim tapi tersimpan ke PostgreSQL | `sendSignalNotification` sudah async — log error di console, tidak block flow |
| Signal engine tidak generate sinyal | User tidak melihat sinyal | Monitor Redis: `redis-cli zcard candles:xauusd:1m` harus > 50 |
| `kenapa?` tidak direspons | User frustrasi | Bot sudah handle dengan "belum tersedia" message |
| Dua instance bot berjalan | Konflik polling → pesan terima dua kali | Pastikan hanya satu uvicorn process yang jalan |
| ATR proxy menghasilkan SL terlalu ketat | User loss karena SL kena noise | Review manual setiap sinyal di Fase 5 sebelum release ke user |

---

## Checklist Final Sebelum User Pertama

- [ ] Fase 0 selesai: 3+ dari 5 orang bilang "mau coba"
- [ ] `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHANNEL_ID` dikonfigurasi
- [ ] `python-telegram-bot==21.6` terinstall di ai-engine
- [ ] `telegram_bot.py` dibuat dan terintegrasi ke `main.py`
- [ ] Test manual via cURL berhasil mengirim sinyal ke Telegram
- [ ] Reply "kenapa?" di bot memberikan respons yang benar
- [ ] Command `/start` memberikan chat_id user
- [ ] Redis berjalan dan `bot:subscribers` set sudah ada
- [ ] Silent test 5 trading days selesai: 4/5 hari semua kriteria terpenuhi
- [ ] ATR proxy issue sudah dievaluasi (SL/TP masuk akal vs TradingView chart)

---

## Notes Teknis Penting

1. **`anthropic==0.8.1` di requirements.txt bisa dihapus** — `signal_engine.py` dan
   `bias_engine.py` keduanya call Claude API via `httpx` langsung, bukan SDK. Package
   ini unused dead weight. Hapus untuk cleanliness.

2. **Internal routes sudah diimplementasi** — Klaim di CLAUDE.md bahwa `/api/internal/signals`
   "belum diimplementasi" adalah stale. Routes sudah ada di `internal.routes.ts` dan berfungsi.

3. **Bot polling vs webhook** — Untuk Approach A (development/local), polling sudah cukup.
   Untuk Approach B (production di VPS dengan domain + SSL), migrasi ke webhook lebih efisien.

4. **Signal broadcasting** — `sendSignalNotification()` di `notifications.ts:199` sudah
   handle Telegram. Tidak perlu double implementation. Bot Python hanya untuk "kenapa?" handler.

---

## Status Tracking

| Fase | Status | Tanggal Target |
|------|--------|----------------|
| Fase 0: Community Observation | BELUM MULAI | 7 hari pertama |
| Fase 1: Env & Dependencies | BELUM MULAI | Hari 1-2 |
| Fase 2: Telegram Broadcast Test | BELUM MULAI | Hari 2 |
| Fase 3: "Kenapa?" Handler | BELUM MULAI | Hari 3-4 |
| Fase 4: Subscriber Management | BELUM MULAI | Hari 4 |
| Fase 5: Silent Test (5 hari) | BELUM MULAI | Hari 5-9 |
| Fase 6: Free Trial Launch | BELUM MULAI | Hari 10-14 |
| GATE: 5+ paying users | — | Hari 14 |
| Approach B: Full Platform | MENUNGGU GATE | Setelah Hari 14 |

---

*Update file ini setiap kali satu fase selesai. Ganti status "BELUM MULAI" → "IN PROGRESS" → "SELESAI".*
