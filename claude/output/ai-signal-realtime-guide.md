# Panduan: AI Signal Trading Real-Time XAUUSD
> Dibuat: 2026-05-15 | Platform: GoldMind AI (SINYAL COHIBA)

---

## 1. Cara Kerja Sistem Saat Ini

### Alur Data End-to-End

```
Twelve Data API
      │
      │  REST polling setiap 30 detik
      ▼
┌─────────────────────────┐
│   AI Engine (Python)    │
│   price_feed.py         │
│   · Ambil harga live    │
│   · Hitung OHLCV        │
└────────────┬────────────┘
             │ simpan ke Redis
             ▼
┌─────────────────────────┐
│        Redis            │
│  price:xauusd (TTL 2m)  │
│  candles:xauusd:1m      │
│  (sorted set, 300 entry)│
└────────────┬────────────┘
             │ dibaca setiap 5 menit
             ▼
┌─────────────────────────┐
│  signal_engine.py       │
│  1. Ambil 50 candle     │
│  2. Hitung 7 indikator  │
│     RSI, MACD, EMA20,   │
│     EMA50, BB, ATR, Vol │
│  3. Kirim ke Claude API │
│  4. Terima sinyal +     │
│     reasoning (Bahasa   │
│     Indonesia)          │
└────────────┬────────────┘
             │ POST /api/internal/signals
             ▼
┌─────────────────────────┐
│   Backend (Express.js)  │
│   · Simpan PostgreSQL   │
│   · Emit Socket.IO      │
│     'new_signal'        │
└────────────┬────────────┘
             │ real-time push
             ▼
┌─────────────────────────┐
│   Frontend (Next.js)    │  ←── Dashboard
│   Telegram Bot          │  ←── Notifikasi HP
│   WhatsApp (Fonnte)     │  ←── Notifikasi WA
└─────────────────────────┘
```

### Komponen Kunci

| Komponen | Peran | File |
|----------|-------|------|
| `price_feed.py` | Polling harga dari Twelve Data | `ai-engine/services/price_feed.py` |
| `signal_engine.py` | Hitung indikator + panggil Claude | `ai-engine/services/signal_engine.py` |
| `bias_engine.py` | Analisa fundamental harian 07:00 WIB | `ai-engine/services/bias_engine.py` |
| `cron.ts` | Trigger harian dari backend ke AI | `backend/src/lib/cron.ts` |
| `socket.ts` | Broadcast sinyal ke frontend | `backend/src/lib/socket.ts` |

---

## 2. Kenapa Sinyal Setiap 5 Menit, Bukan Setiap Detik?

Ini **keputusan desain yang benar**, bukan keterbatasan teknis.

### Alasan Teknikal

```
RSI membutuhkan minimal 14 candle
MACD membutuhkan minimal 26 candle
EMA50 membutuhkan minimal 50 candle

→ Candle 1 menit: perlu 50 menit data historis
→ Candle 5 menit: perlu 250 menit (~4 jam) data historis
→ Terlalu sering = indikator belum "matang" = sinyal palsu
```

### Alasan Trading

| Frekuensi | Dampak |
|-----------|--------|
| Setiap detik | Over-trading, spread makan profit, sinyal noise |
| Setiap menit | Terlalu banyak false signal, indikator tidak stabil |
| Setiap 5 menit | **Optimal** — indikator akurat, sinyal bermakna |
| Setiap 15 menit | Lebih sedikit sinyal, lebih tinggi akurasi |
| Setiap 1 jam | Swing trading, cocok untuk posisi overnight |

### Alasan Biaya

- Setiap sinyal = 1 API call ke Claude → biaya nyata
- 5 menit × 24 jam × 5 hari = **288 analisa/minggu**
- Jika 1 menit: **1.440 analisa/minggu** = 5× lebih mahal

---

## 3. Rekomendasi Model AI

### Model Claude (Anthropic) — Digunakan Saat Ini

| Model | Kecepatan | Biaya | Kualitas Reasoning | Rekomendasi |
|-------|-----------|-------|-------------------|-------------|
| **claude-haiku-4-5** | ⚡⚡⚡ Sangat Cepat | 💰 Sangat Murah | ⭐⭐⭐ Baik | **Signal Engine** (volume tinggi) |
| **claude-sonnet-4-6** | ⚡⚡ Cepat | 💰💰 Sedang | ⭐⭐⭐⭐ Sangat Baik | **Daily Bias** (kualitas tinggi) |
| **claude-opus-4-7** | ⚡ Lambat | 💰💰💰 Mahal | ⭐⭐⭐⭐⭐ Terbaik | Analisa Khusus / Review Sinyal |

### Strategi Dual-Model (Direkomendasikan)

```
Sinyal 5 Menit  →  claude-haiku-4-5   (cepat, murah, volume tinggi)
Daily Bias      →  claude-sonnet-4-6  (mendalam, reasoning kuat)
Konfirmasi Besar→  claude-opus-4-7    (hanya untuk event NFP/CPI)
```

**Kenapa Haiku untuk sinyal?**
- Sinyal trading butuh respons cepat (<2 detik)
- Format terstruktur (JSON: type, entry, SL, TP, confidence)
- Haiku sudah cukup cerdas untuk analisa teknikal terstruktur
- Hemat 80% biaya dibanding Sonnet untuk volume yang sama

**Kenapa Sonnet untuk bias?**
- Daily Bias butuh pemahaman konteks makro yang lebih dalam
- NFP, CPI, Fed statement — membutuhkan nuance lebih tinggi
- Frekuensi rendah (1x/hari) sehingga biaya tidak masalah

---

## 4. Cara Mendapatkan Sinyal Setiap Saat

### A. Dashboard Real-Time (Sudah Berjalan)

Sinyal muncul otomatis via Socket.IO tanpa refresh halaman.

```
Buka: http://localhost:3000/dashboard
Status: Bot Aktif → sinyal muncul otomatis
```

### B. Notifikasi Telegram (Direkomendasikan)

1. Buka menu **Telegram** di sidebar dashboard
2. Hubungkan akun Telegram
3. Setiap sinyal baru → langsung masuk ke HP dalam <30 detik

**Keunggulan:**
- Tidak perlu buka dashboard
- Tersedia di mana saja selama ada internet
- Format rapi: Entry, SL, TP, Reasoning

### C. Live Market Widget (Baru)

Halaman `/livemarket` — harga XAUUSD real-time setiap 2 detik via Socket.IO + mini widget di dashboard utama.

---

## 5. Cara Meningkatkan Frekuensi Sinyal (Opsional)

Jika ingin sinyal lebih sering, ubah interval di `signal_engine.py`:

```python
# Saat ini: setiap 5 menit
SIGNAL_INTERVAL = 300  # detik

# Untuk 2 menit (tidak direkomendasikan):
SIGNAL_INTERVAL = 120

# Untuk 1 menit (hati-hati biaya):
SIGNAL_INTERVAL = 60
```

> ⚠️ **Peringatan:** Menurunkan interval meningkatkan biaya API Claude dan
> risiko sinyal palsu (false signal) karena indikator teknikal belum stabil.

---

## 6. Cara Pastikan Sistem Jalan 24/5

### Cek Status Service

```bash
# Dari folder goldmind-ai/
pm2 status

# Output yang diharapkan:
# ┌────┬──────────────┬─────────┬──────┬───────────┐
# │ id │ name         │ status  │ cpu  │ memory    │
# ├────┼──────────────┼─────────┼──────┼───────────┤
# │ 0  │ ai-engine    │ online  │ 0%   │ 80mb      │
# │ 1  │ backend      │ online  │ 0%   │ 120mb     │
# │ 2  │ frontend     │ online  │ 0%   │ 200mb     │
# └────┴──────────────┴─────────┴──────┴───────────┘
```

### Start Semua Service

```bash
cd goldmind-ai/
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # auto-start setelah reboot
```

### Cek Log AI Engine

```bash
pm2 logs ai-engine --lines 50

# Tanda sistem sehat:
# [signal_engine] ✅ Sinyal BUY dikirim ke backend
# [price_feed] 📊 XAUUSD: 2318.45 → Redis updated
# [bias_engine] 📰 Daily bias generated: BUY (85%)
```

---

## 7. Monitoring & Troubleshooting

### Indikator Sistem Sehat

| Indikator | Lokasi | Nilai Normal |
|-----------|--------|-------------|
| System Status: Live | Halaman /livemarket | Hijau |
| Bot Aktif | Header dashboard | Hijau |
| Sinyal terbaru | Dashboard | < 10 menit lalu |
| Redis ping | Backend log | OK |

### Jika Sinyal Tidak Muncul

```
1. Cek pm2 status → ai-engine harus "online"
2. Cek pm2 logs ai-engine → ada error koneksi Twelve Data?
3. Cek pm2 logs backend → ada error koneksi PostgreSQL?
4. Cek Redis: redis-cli ping → harus jawab "PONG"
5. Cek .env ai-engine: TWELVE_DATA_API_KEY sudah benar?
6. Cek .env ai-engine: CLAUDE_API_KEY masih valid?
```

---

## 8. Arsitektur Ideal untuk Sinyal 24/5

```
                    ┌─────────────────┐
                    │  Twelve Data    │
                    │  WebSocket*     │  ← upgrade plan untuk
                    │  (1 detik)      │    harga setiap detik
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   AI Engine     │
                    │   price_feed.py │
                    │   (Python)      │
                    └────────┬────────┘
                             │ Redis Pub/Sub
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼───┐  ┌───────▼────┐  ┌────▼──────────┐
    │ Signal      │  │  Bias      │  │  Live Price   │
    │ Engine      │  │  Engine    │  │  Broadcast    │
    │ (5 menit)   │  │  (harian)  │  │  (2 detik)    │
    └─────────────┘  └────────────┘  └───────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │ HTTP / Socket.IO
                    ┌────────▼────────┐
                    │    Backend      │
                    │    Express.js   │
                    └────────┬────────┘
                             │
                   ┌─────────┴──────────┐
                   │                    │
          ┌────────▼──┐        ┌────────▼────┐
          │ Dashboard │        │  Telegram   │
          │ Real-time │        │  Bot Alert  │
          └───────────┘        └─────────────┘

* WebSocket Twelve Data tersedia pada paket berbayar ($29/bulan)
```

---

## 9. Rekomendasi Peningkatan Bertahap

### Fase 1 — Sekarang (Sudah Selesai)
- [x] Sinyal AI setiap 5 menit
- [x] Notifikasi Telegram
- [x] Live Market dashboard
- [x] Daily Bias harian

### Fase 2 — Jangka Pendek
- [ ] Ganti ke **claude-haiku-4-5** untuk signal engine (hemat biaya 80%)
- [ ] Tambah indikator: **Stochastic RSI + Volume Profile**
- [ ] Sinyal confidence threshold: hanya kirim jika confidence ≥ 70%

### Fase 3 — Jangka Menengah
- [ ] Upgrade Twelve Data ke WebSocket (harga setiap detik)
- [ ] Multi-timeframe analysis: M1 + M5 + H1 konfirmasi
- [ ] Backtesting engine: validasi sinyal historis

### Fase 4 — Jangka Panjang
- [ ] News sentiment: integrasi NewsAPI + analisa dampak ke sinyal
- [ ] Auto-close signal: monitor SL/TP hit secara otomatis
- [ ] Win rate tracker: statistik akurasi per kondisi pasar

---

*Dokumen ini dibuat berdasarkan arsitektur aktual GoldMind AI (SINYAL COHIBA) per 2026-05-15.*
