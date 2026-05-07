"""
GoldMind AI — Signal Engine
Alur: Redis candles → hitung indikator pandas-ta → Claude API → push ke backend.

APScheduler menjalankan siklus analisa otomatis setiap 5 menit (Senin–Jumat).
"""

import os
import json
import re
import pandas as pd
import pandas_ta as ta
import redis.asyncio as aioredis
import httpx
from fastapi import APIRouter
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler

router  = APIRouter()

# ─── KONFIGURASI ──────────────────────────────────────────

REDIS_URL       = os.getenv("REDIS_URL", "redis://localhost:6379")
CLAUDE_API_KEY  = os.getenv("CLAUDE_API_KEY", "")
CLAUDE_MODEL    = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
BACKEND_URL     = os.getenv("BACKEND_URL", "http://localhost:5000")
INTERNAL_KEY    = os.getenv("INTERNAL_API_KEY", "")
MIN_CONFIDENCE  = int(os.getenv("MIN_CONFIDENCE_THRESHOLD", "65"))

# Scheduler APScheduler — diinisialisasi di sini, distart di main.py
signal_scheduler = AsyncIOScheduler(timezone="Asia/Jakarta")


# ─── HELPER: Redis ────────────────────────────────────────

async def _get_redis() -> aioredis.Redis:
    """Buat koneksi Redis async per-request (lazy)."""
    return aioredis.from_url(REDIS_URL, decode_responses=True)


# ─── STEP 1: Ambil Candle Data dari Redis ─────────────────

async def fetch_candles(r: aioredis.Redis, count: int = 200) -> pd.DataFrame:
    """
    Ambil candle terakhir dari Redis sorted set 'candles:xauusd:1m'.
    Setiap entry adalah JSON tick price dari Twelve Data WebSocket.
    """
    raw = await r.zrange("candles:xauusd:1m", -count, -1)
    if not raw:
        return pd.DataFrame()

    records = []
    for item in raw:
        try:
            records.append(json.loads(item))
        except json.JSONDecodeError:
            continue

    if not records:
        return pd.DataFrame()

    df = pd.DataFrame(records)
    # Pastikan kolom price bertipe float
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["price"])
    return df


# ─── STEP 2: Hitung Indikator Teknikal ───────────────────

def calculate_indicators(df: pd.DataFrame) -> dict:
    """
    Hitung 7 indikator wajib: RSI, MACD, EMA 20/50/200, Bollinger Bands, ATR.
    Minimal butuh 50 data point agar indikator valid.
    """
    if df.empty or len(df) < 50:
        return {}

    close = df["price"].astype(float)

    # RSI (14)
    rsi_series = ta.rsi(close, length=14)

    # MACD (12, 26, 9)
    macd_df = ta.macd(close, fast=12, slow=26, signal=9)

    # EMA 20, 50, 200
    ema20  = ta.ema(close, length=20)
    ema50  = ta.ema(close, length=50)
    ema200 = ta.ema(close, length=min(200, len(close) - 1))

    # Bollinger Bands (20, 2)
    bb_df = ta.bbands(close, length=20)

    # ATR (14) — gunakan proxy high/low dari spread harga 0.1%
    # karena data tick tidak memiliki OHLC terpisah
    atr_series = ta.atr(
        high=close * 1.001,
        low=close * 0.999,
        close=close,
        length=14
    )

    def safe_last(series) -> float | None:
        """Ambil nilai terakhir series; return None jika kosong."""
        if series is None or series.empty:
            return None
        val = series.iloc[-1]
        return float(val) if pd.notna(val) else None

    current_price = float(close.iloc[-1])

    return {
        "current_price": current_price,
        "rsi_14":        safe_last(rsi_series),
        "macd":          safe_last(macd_df.iloc[:, 0]) if macd_df is not None and not macd_df.empty else None,
        "macd_signal":   safe_last(macd_df.iloc[:, 1]) if macd_df is not None and not macd_df.empty else None,
        "macd_hist":     safe_last(macd_df.iloc[:, 2]) if macd_df is not None and not macd_df.empty else None,
        "ema_20":        safe_last(ema20),
        "ema_50":        safe_last(ema50),
        "ema_200":       safe_last(ema200),
        "bb_upper":      safe_last(bb_df.iloc[:, 0]) if bb_df is not None and not bb_df.empty else None,
        "bb_middle":     safe_last(bb_df.iloc[:, 1]) if bb_df is not None and not bb_df.empty else None,
        "bb_lower":      safe_last(bb_df.iloc[:, 2]) if bb_df is not None and not bb_df.empty else None,
        "atr_14":        safe_last(atr_series),
        "data_points":   len(df),
    }


# ─── STEP 3: Analisa dengan Claude API ───────────────────

async def analyze_with_claude(indicators: dict) -> dict | None:
    """
    Kirim data indikator ke Claude API dan parse respons JSON.
    Jika Claude tidak menghasilkan sinyal valid, return None.
    """
    if not CLAUDE_API_KEY:
        print("⚠️ [SIGNAL] CLAUDE_API_KEY tidak dikonfigurasi")
        return None

    prompt = (
        "Kamu adalah AI Trading Analyst XAUUSD profesional.\n"
        f"Data indikator terkini:\n{json.dumps(indicators, indent=2)}\n\n"
        "Analisa data di atas. Jika ada setup sinyal valid dengan probability > 65%, "
        "return JSON berikut:\n"
        '{"signal":"BUY" atau "SELL","entry":<harga>,"sl":<stop loss>,'
        '"tp":<take profit>,"confidence":<65-100>,"timeframe":"M15",'
        '"reasoning":"<analisa dalam Bahasa Indonesia, 2-3 kalimat>"}\n\n'
        'Jika tidak ada setup valid, return: {"signal":"HOLD","reasoning":"<alasan>"}\n'
        "Return HANYA JSON, tanpa teks atau markdown apapun."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 500,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )

        if resp.status_code != 200:
            print(f"❌ [SIGNAL] Claude API error: {resp.status_code} — {resp.text[:200]}")
            return None

        text = resp.json()["content"][0]["text"].strip()

        # Parse JSON — bersihkan markdown code block jika ada
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group())
            print(f"⚠️ [SIGNAL] Gagal parse JSON dari Claude: {text[:200]}")
            return None

    except httpx.TimeoutException:
        print("❌ [SIGNAL] Claude API timeout")
        return None
    except Exception as e:
        print(f"❌ [SIGNAL] Unexpected error: {e}")
        return None


# ─── STEP 4: Push ke Backend ─────────────────────────────

async def _push_signal_to_backend(signal_data: dict) -> bool:
    """
    Kirim sinyal yang sudah divalidasi ke backend Express.
    Backend akan menyimpan ke PostgreSQL dan broadcast via Socket.IO.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{BACKEND_URL}/api/internal/signals",
                json=signal_data,
                headers={"X-Internal-Key": INTERNAL_KEY},
            )
        if resp.status_code == 201:
            return True
        print(f"❌ [SIGNAL] Backend menolak sinyal: {resp.status_code} — {resp.text[:200]}")
        return False
    except Exception as e:
        print(f"❌ [SIGNAL] Gagal push ke backend: {e}")
        return False


# ─── CORE: Satu Siklus Analisa ───────────────────────────

async def _run_signal_cycle() -> dict:
    """
    Satu siklus lengkap: ambil data → hitung indikator → Claude → push ke backend.
    Dipanggil oleh APScheduler setiap 5 menit dan oleh endpoint manual.
    """
    r = await _get_redis()

    try:
        df = await fetch_candles(r)
        if df.empty:
            return {"status": "skip", "reason": "Tidak ada data candle di Redis"}

        indicators = calculate_indicators(df)
        if not indicators:
            return {"status": "skip", "reason": "Data candle tidak cukup untuk hitung indikator"}

        result = await analyze_with_claude(indicators)
        if not result:
            return {"status": "error", "reason": "Claude API gagal atau tidak merespons"}

        signal_type = result.get("signal", "HOLD")

        if signal_type == "HOLD":
            return {"status": "hold", "data": result}

        # Validasi confidence minimum
        confidence = result.get("confidence", 0)
        if confidence < MIN_CONFIDENCE:
            return {
                "status": "skip",
                "reason": f"Confidence {confidence}% di bawah threshold {MIN_CONFIDENCE}%",
            }

        # Push ke backend
        pushed = await _push_signal_to_backend(result)
        if pushed:
            print(f"✅ [SIGNAL] {signal_type} @ {result.get('entry')} — confidence {confidence}%")
            return {"status": "signal_generated", "data": result}
        else:
            return {"status": "error", "reason": "Gagal push sinyal ke backend"}

    finally:
        await r.aclose()


# ─── APScheduler: Jalankan setiap 5 menit (Senin–Jumat) ──

@signal_scheduler.scheduled_job(
    trigger="cron",
    day_of_week="mon-fri",
    minute="*/5",
    id="auto_signal_generation",
    max_instances=1,       # Cegah job menumpuk jika sebelumnya belum selesai
    coalesce=True,         # Jika terlewat, jalankan sekali saja
)
async def _auto_signal_job() -> None:
    """Job APScheduler: generate sinyal otomatis setiap 5 menit hari kerja."""
    print(f"⏰ [SCHEDULER] Auto signal cycle — {datetime.now().strftime('%H:%M:%S WIB')}")
    result = await _run_signal_cycle()
    print(f"   └─ Status: {result.get('status')} | {result.get('reason', result.get('data', {}).get('signal', ''))}")


# ─── ENDPOINT MANUAL (dipanggil saat testing atau trigger eksternal) ──

@router.post("/generate-signal")
async def generate_signal():
    """
    Endpoint manual untuk trigger satu siklus analisa.
    Berguna saat testing atau kebutuhan khusus di luar jadwal otomatis.
    """
    result = await _run_signal_cycle()
    return result
