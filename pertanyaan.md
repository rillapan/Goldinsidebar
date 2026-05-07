# Hal yang Perlu Disiapkan — GoldMind AI

## Wajib Sebelum Fase 2 (Database & Infrastruktur)
| No | Yang Dibutuhkan | Untuk Apa | Cara Mendapatkan |
|----|----------------|-----------|-----------------|
| 1  | `DATABASE_URL` (PostgreSQL) | Prisma ORM — semua data user/signal/transaksi | Supabase (gratis) → Project Settings → Connection String |
| 2  | `REDIS_URL` | Session, live price cache, candle buffer | Upstash (gratis) → Create Database → Redis URL |

## Wajib Sebelum Fase 4 (Payment Gateway)
| No | Yang Dibutuhkan | Untuk Apa | Cara Mendapatkan |
|----|----------------|-----------|-----------------|
| 3  | `XENDIT_SECRET_KEY` | Buat invoice pembayaran | dashboard.xendit.co → Settings → API Keys |
| 4  | `XENDIT_CALLBACK_TOKEN` | Verifikasi webhook dari Xendit | dashboard.xendit.co → Webhooks → Token |

## Wajib Sebelum Fase 5 (AI Signal Engine)
| No | Yang Dibutuhkan | Untuk Apa | Cara Mendapatkan |
|----|----------------|-----------|-----------------|
| 5  | `CLAUDE_API_KEY` | Signal analysis + Daily Bias + Chat Assistant | console.anthropic.com → API Keys |
| 6  | `TWELVE_DATA_API_KEY` | WebSocket harga XAUUSD real-time | twelvedata.com → My API → Copy Key |

## Wajib Sebelum Fase 6 (Notifikasi)
| No | Yang Dibutuhkan | Untuk Apa | Cara Mendapatkan |
|----|----------------|-----------|-----------------|
| 7  | `FONNTE_API_KEY` | Kirim notifikasi WhatsApp (sinyal, bias, reminder) | fonnte.com → Device → Token |
| 8  | Nomor WA yang terdaftar di Fonnte | Device pengirim pesan WA | Scan QR code di Fonnte dashboard |
| 9  | `TELEGRAM_BOT_TOKEN` | Blast sinyal ke channel Telegram | Buat bot via @BotFather → /newbot |
| 10 | `TELEGRAM_CHANNEL_ID` | Target channel blast (e.g. `@goldmind_signals`) | Buat channel Telegram, invite bot sebagai admin |
| 11 | SMTP credentials | Email konfirmasi bayar & reminder expiry | Resend.com (gratis 3k/hari) → API Keys |

## Keputusan Bisnis yang Perlu Dikonfirmasi
| No | Pertanyaan | Default saat ini |
|----|-----------|-----------------|
| 12 | Harga membership per bulan? | Rp 299.000 (hardcoded di `payment.routes.ts:16`) |
| 13 | Domain produksi? | Dibutuhkan untuk `FRONTEND_URL`, Xendit redirect URL, dan email sender |
| 14 | Apakah Daily Bias perlu approval admin sebelum di-blast, atau otomatis langsung publish? | Saat ini sistem simpan dengan `isPublished: false`, perlu tombol publish manual di admin |

## Opsional (Bisa Diisi Nanti)
- `NEWS_API_KEY` — Bias engine bisa fallback ke Finnhub saja jika tidak ada
- `FINNHUB_API_KEY` — Bias engine bisa fallback ke NewsAPI saja jika tidak ada
- `TELEGRAM_CHANNEL_ID` — Bisa diisi kosong jika notifikasi Telegram belum dibutuhkan


