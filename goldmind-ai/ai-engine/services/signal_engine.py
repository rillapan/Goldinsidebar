"""
SINYAL COHIBA — Signal Engine
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


# ─── STEP 1b: Ambil OHLCV dari Twelve Data REST ──────────

async def fetch_ohlcv_from_rest(interval: str = "5min", count: int = 200) -> pd.DataFrame:
    """
    Fetch OHLCV candles dari Twelve Data REST API.
    Dipakai untuk ATR akurat dan S/R detection berbasis real H/L.
    Fallback: jika gagal, calculate_indicators() pakai synthetic proxy.
    """
    twelve_data_key = os.getenv("TWELVE_DATA_API_KEY", "")
    url = "https://api.twelvedata.com/time_series"
    params = {
        "symbol": "XAU/USD",
        "interval": interval,
        "outputsize": count,
        "apikey": twelve_data_key,
        "format": "JSON",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)

        if resp.status_code != 200:
            print(f"⚠️ [OHLCV] Twelve Data REST error: {resp.status_code}")
            return pd.DataFrame()

        data = resp.json()
        if "values" not in data:
            print(f"⚠️ [OHLCV] Respons tidak mengandung 'values': {data.get('message', 'unknown')}")
            return pd.DataFrame()

        df = pd.DataFrame(data["values"])
        for col in ["open", "high", "low", "close"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df.dropna(subset=["open", "high", "low", "close"])
        df = df.iloc[::-1].reset_index(drop=True)  # urutkan: oldest first
        return df

    except httpx.TimeoutException:
        print("❌ [OHLCV] Twelve Data REST timeout — fallback ke synthetic proxy")
        return pd.DataFrame()
    except Exception as e:
        print(f"❌ [OHLCV] Unexpected error: {e}")
        return pd.DataFrame()


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

def calculate_indicators(
    df_tick: pd.DataFrame,
    df_ohlcv: pd.DataFrame | None = None,
) -> dict:
    """
    Hitung 7 indikator wajib + Support/Resistance dari pivot high/low.
    df_tick  : tick prices dari Redis (untuk RSI, MACD, EMA, BB)
    df_ohlcv : OHLCV dari Twelve Data REST (untuk ATR real + S/R akurat)
    """
    if df_tick.empty or len(df_tick) < 50:
        return {}

    close = df_tick["price"].astype(float)

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

    # ATR (14) — gunakan OHLCV real jika tersedia, fallback ke synthetic proxy
    use_real_ohlcv = df_ohlcv is not None and not df_ohlcv.empty and len(df_ohlcv) >= 14
    if use_real_ohlcv:
        atr_series = ta.atr(
            high=df_ohlcv["high"],
            low=df_ohlcv["low"],
            close=df_ohlcv["close"],
            length=14,
        )
        atr_source = "ohlcv_rest"
    else:
        atr_series = ta.atr(
            high=close * 1.001,
            low=close * 0.999,
            close=close,
            length=14,
        )
        atr_source = "synthetic_proxy"

    def safe_last(series) -> float | None:
        if series is None or series.empty:
            return None
        val = series.iloc[-1]
        return float(val) if pd.notna(val) else None

    current_price = float(close.iloc[-1])

    # Support/Resistance — pivot high/low dari 20 bar terakhir
    # Pakai H/L real dari OHLCV jika tersedia (tangkap intrabar wicks).
    # Fallback: pakai close dari tick data.
    if use_real_ohlcv:
        highs_for_sr = df_ohlcv["high"].values[-20:]
        lows_for_sr  = df_ohlcv["low"].values[-20:]
    else:
        highs_for_sr = close.values[-20:]
        lows_for_sr  = close.values[-20:]

    pivot_highs: list[float] = []
    pivot_lows: list[float]  = []
    for i in range(1, len(highs_for_sr) - 1):
        if highs_for_sr[i] > highs_for_sr[i - 1] and highs_for_sr[i] > highs_for_sr[i + 1]:
            pivot_highs.append(float(highs_for_sr[i]))
        if lows_for_sr[i] < lows_for_sr[i - 1] and lows_for_sr[i] < lows_for_sr[i + 1]:
            pivot_lows.append(float(lows_for_sr[i]))

    resistances = sorted([h for h in pivot_highs if h > current_price])
    supports    = sorted([l for l in pivot_lows  if l < current_price], reverse=True)

    return {
        "current_price":      current_price,
        "rsi_14":             safe_last(rsi_series),
        "macd":               safe_last(macd_df.iloc[:, 0]) if macd_df is not None and not macd_df.empty else None,
        "macd_signal":        safe_last(macd_df.iloc[:, 1]) if macd_df is not None and not macd_df.empty else None,
        "macd_hist":          safe_last(macd_df.iloc[:, 2]) if macd_df is not None and not macd_df.empty else None,
        "ema_20":             safe_last(ema20),
        "ema_50":             safe_last(ema50),
        "ema_200":            safe_last(ema200),
        "bb_upper":           safe_last(bb_df.iloc[:, 0]) if bb_df is not None and not bb_df.empty else None,
        "bb_middle":          safe_last(bb_df.iloc[:, 1]) if bb_df is not None and not bb_df.empty else None,
        "bb_lower":           safe_last(bb_df.iloc[:, 2]) if bb_df is not None and not bb_df.empty else None,
        "atr_14":             safe_last(atr_series),
        "atr_source":         atr_source,
        "nearest_resistance": resistances[0] if resistances else None,
        "nearest_support":    supports[0]    if supports    else None,
        "resistance_levels":  resistances[:3],
        "support_levels":     supports[:3],
        "data_points":        len(df_tick),
    }


# ─── STEP 3a: Fallback rule-based (tanpa Claude) ─────────

def _rule_based_signal(indicators: dict) -> dict:
    """
    Sinyal berbasis aturan sederhana — dipakai saat CLAUDE_API_KEY tidak dikonfigurasi.
    Cukup untuk testing pipeline end-to-end tanpa memanggil Claude API.
    """
    rsi       = indicators.get("rsi_14") or 50.0
    macd_hist = indicators.get("macd_hist") or 0.0
    price     = indicators.get("current_price") or 0.0
    atr       = indicators.get("atr_14") or 5.0
    ema20     = indicators.get("ema_20") or price
    ema50     = indicators.get("ema_50") or price

    # BUY: RSI oversold + MACD histogram berbalik positif + harga di atas EMA20
    if rsi < 35 and macd_hist > 0 and price > ema20:
        return {
            "signal":     "BUY",
            "entry":      price,
            "sl":         round(price - atr * 1.5, 2),
            "tp":         round(price + atr * 2.5, 2),
            "confidence": 70,
            "timeframe":  "M15",
            "reasoning":  (
                f"RSI oversold ({rsi:.1f}) dengan MACD histogram positif ({macd_hist:.2f}) "
                f"dan harga di atas EMA20. Potensi reversal ke atas. [rule-based]"
            ),
        }

    # SELL: RSI overbought + MACD histogram berbalik negatif + harga di bawah EMA20
    if rsi > 65 and macd_hist < 0 and price < ema20:
        return {
            "signal":     "SELL",
            "entry":      price,
            "sl":         round(price + atr * 1.5, 2),
            "tp":         round(price - atr * 2.5, 2),
            "confidence": 70,
            "timeframe":  "M15",
            "reasoning":  (
                f"RSI overbought ({rsi:.1f}) dengan MACD histogram negatif ({macd_hist:.2f}) "
                f"dan harga di bawah EMA20. Potensi reversal ke bawah. [rule-based]"
            ),
        }

    return {
        "signal":    "HOLD",
        "reasoning": f"RSI {rsi:.1f}, MACD hist {macd_hist:.2f} — tidak ada setup jelas. [rule-based]",
    }


# ─── STEP 3: Analisa dengan Claude API ───────────────────

async def analyze_with_claude(indicators: dict) -> dict | None:
    """
    Kirim data indikator ke Claude API dan parse respons JSON.
    Jika CLAUDE_API_KEY tidak dikonfigurasi, pakai rule-based fallback.
    """
    if not CLAUDE_API_KEY or CLAUDE_API_KEY.startswith("sk-ant-xxx"):
        print("⚠️ [SIGNAL] CLAUDE_API_KEY tidak dikonfigurasi — pakai rule-based fallback")
        return _rule_based_signal(indicators)

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
    Satu siklus lengkap: fetch tick → fetch OHLCV → hitung indikator → Claude → push backend.
    OHLCV fetch adalah best-effort — gagal tidak memblok siklus.
    """
    r = await _get_redis()

    try:
        # OHLCV dari Twelve Data REST — fetch dulu, bisa jadi sumber fallback
        df_ohlcv = await fetch_ohlcv_from_rest(interval="5min", count=200)

        # Tick data dari Redis (untuk RSI/MACD/EMA/BB)
        df_tick = await fetch_candles(r)

        if df_tick.empty:
            if df_ohlcv.empty:
                return {"status": "skip", "reason": "Tidak ada data di Redis maupun Twelve Data REST"}
            # Fallback: pakai close price OHLCV sebagai tick data
            # Terjadi saat WebSocket belum jalan atau Redis baru di-restart
            print("⚠️ [SIGNAL] Redis kosong — fallback ke OHLCV REST close prices")
            df_tick = df_ohlcv[["close"]].rename(columns={"close": "price"})

        if df_ohlcv.empty:
            print("⚠️ [SIGNAL] OHLCV REST gagal — ATR akan pakai synthetic proxy")

        # Hitung semua indikator
        indicators = calculate_indicators(
            df_tick,
            df_ohlcv if not df_ohlcv.empty else None,
        )
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
            print(
                f"✅ [SIGNAL] {signal_type} @ {result.get('entry')} "
                f"— confidence {confidence}% | ATR: {indicators.get('atr_source')}"
            )
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

@router.api_route("/generate-signal", methods=["GET", "POST"])
async def generate_signal():
    """
    Trigger manual satu siklus analisa — bisa dari browser (GET) atau curl (POST).
    """
    result = await _run_signal_cycle()
    return result
