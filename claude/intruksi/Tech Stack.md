Gunakan tech stack berikut secara eksak. Jangan ganti library tanpa konfirmasi.

---

FRONTEND LAYER:
- Framework  : Next.js 14 (App Router)
- Language   : TypeScript
- Styling    : Tailwind CSS v3
- Components : ShadCN UI
- Charts     : TradingView Lightweight Charts
- Real-time  : Socket.IO Client

BACKEND LAYER:
- API Server : Node.js + Express.js (REST API utama)
- AI Engine  : Python + FastAPI (signal processing)
- WebSocket  : Socket.IO Server
- Scheduler  : Node-Cron (Node) + APScheduler (Python)
- Auth       : JWT (JSON Web Token)
- Process    : PM2

DATABASE LAYER:
- Primary DB : PostgreSQL
- Cache      : Redis (harga live + session)
- ORM        : Prisma
- Hosting    : Supabase atau Railway

AI & DATA INTELLIGENCE:
- AI Model   : Anthropic Claude API (claude-sonnet) — untuk Chat Assistant & Daily Bias
- Price Feed : Twelve Data API (WebSocket, real-time XAUUSD, 800+ indikator)
- Histori    : Alpha Vantage REST (20+ tahun histori, backtesting)
- Display    : GoldAPI.io (widget spot price di landing page — gratis)
- Indicators : TA-Lib + pandas-ta (RSI, MACD, EMA 20/50/200, BB, ATR, Stochastic)
- News       : NewsAPI / Finnhub (berita fundamental)
- Processing : NumPy + Pandas

PAYMENT & NOTIFICATION:
- Payment    : Xendit (QRIS, Virtual Account, e-Wallet)
- WhatsApp   : Fonnte atau Wablas API
- Telegram   : Telegram Bot API (gratis)
- Email      : Nodemailer + SMTP (Resend/Mailgun)

INFRASTRUKTUR:
- Server     : VPS Ubuntu 22.04 (min. 2 vCPU, 4GB RAM, 80GB SSD)
- Proxy      : Nginx + Let's Encrypt SSL
- CI/CD      : GitHub + GitHub Actions
- Monitor    : UptimeRobot

---

Contoh struktur JSON response dari AI Signal Engine yang harus direturn:
{
  "signal": "BUY",
  "entry": 3245.50,
  "sl": 3230.00,
  "tp": 3280.00,
  "confidence": 87,
  "timeframe": "M15",
  "reasoning": "RSI oversold di 28, harga bounce dari EMA200, MACD bullish crossover",
  "timestamp": "2026-05-05T07:00:00Z"
}

INSTRUKSI:
Buat skema database PostgreSQL terlebih dahulu (tabel: users, memberships, signals, transactions, daily_bias, chat_sessions). Tampilkan sebagai SQL CREATE TABLE. Jangan buat kode aplikasi dulu.