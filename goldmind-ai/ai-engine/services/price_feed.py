"""
SINYAL COHIBA -- Price Feed Service
Ambil harga XAUUSD dari Twelve Data REST API setiap 30 detik.
Simpan ke Redis sebagai buffer harga live + sorted set candle history.

WebSocket Twelve Data membutuhkan plan berbayar untuk XAU/USD.
REST API bekerja di semua plan termasuk free (8 credit/menit, 800/hari).
"""

import os
import sys
import json
import asyncio
import httpx
import redis.asyncio as aioredis
from datetime import datetime

# Force UTF-8 stdout agar tidak crash di Windows saat ada karakter non-ASCII
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY", "")
TWELVE_DATA_REST_URL = "https://api.twelvedata.com"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

POLL_INTERVAL = 30    # detik antara polling harga live
OHLCV_INTERVAL = 300  # detik antara fetch candle history (5 menit, hemat quota)

redis_client: aioredis.Redis | None = None
_feed_task: asyncio.Task | None = None
_ohlcv_task: asyncio.Task | None = None


async def get_redis() -> aioredis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    return redis_client


async def _fetch_live_price(client: httpx.AsyncClient) -> dict | None:
    """Ambil harga live XAU/USD via REST. Return dict atau None jika gagal."""
    try:
        resp = await client.get(
            f"{TWELVE_DATA_REST_URL}/price",
            params={"symbol": "XAU/USD", "apikey": TWELVE_DATA_API_KEY},
            timeout=10,
        )
        data = resp.json()
        if "price" in data:
            return {"price": float(data["price"])}
        else:
            print(f"[PRICE] WARN REST error: {data.get('message', data)}")
            return None
    except Exception as e:
        print(f"[PRICE] WARN fetch gagal: {type(e).__name__}: {e}")
        return None


async def _fetch_ohlcv_candles(client: httpx.AsyncClient) -> list[dict]:
    """
    Ambil 200 candle OHLCV 1-menit terakhir dari Twelve Data REST.
    Return list of dict [{open,high,low,close,volume,datetime}].
    """
    try:
        resp = await client.get(
            f"{TWELVE_DATA_REST_URL}/time_series",
            params={
                "symbol": "XAU/USD",
                "interval": "1min",
                "outputsize": 200,
                "apikey": TWELVE_DATA_API_KEY,
            },
            timeout=20,
        )
        data = resp.json()
        if data.get("status") == "error":
            print(f"[OHLCV] WARN error: {data.get('message')}")
            return []
        return data.get("values", [])
    except Exception as e:
        print(f"[OHLCV] WARN fetch gagal: {type(e).__name__}: {e}")
        return []


async def _price_poll_loop():
    """
    Loop utama: poll harga live setiap 30 detik -> simpan ke Redis.
    """
    if not TWELVE_DATA_API_KEY:
        print("[PRICE] ERROR TWELVE_DATA_API_KEY tidak dikonfigurasi -- price feed dibatalkan")
        return

    r = await get_redis()
    tick_count = 0
    error_count = 0

    print(f"[PRICE] Mulai polling XAU/USD setiap {POLL_INTERVAL} detik via REST API")

    async with httpx.AsyncClient() as client:
        # Validasi key sekali saat startup
        test = await _fetch_live_price(client)
        if test:
            print(f"[PRICE] OK API key valid -- harga awal XAU/USD = {test['price']}")
        else:
            print("[PRICE] ERROR Gagal fetch harga awal. Cek TWELVE_DATA_API_KEY.")

        while True:
            try:
                result = await _fetch_live_price(client)
                if result:
                    now = datetime.utcnow()
                    price_data = {
                        "symbol": "XAUUSD",
                        "price": result["price"],
                        "bid": round(result["price"] - 0.30, 5),
                        "ask": round(result["price"] + 0.30, 5),
                        "timestamp": now.isoformat(),
                        "day_change": 0.0,
                    }

                    # Simpan ke Redis key utama (TTL 120 detik)
                    await r.set("price:xauusd", json.dumps(price_data), ex=120)

                    # Tambah ke sorted set candle
                    ts = int(now.timestamp())
                    await r.zadd("candles:xauusd:1m", {json.dumps(price_data): ts})
                    await r.zremrangebyrank("candles:xauusd:1m", 0, -301)

                    tick_count += 1
                    error_count = 0

                    if tick_count % 5 == 1:
                        candle_count = await r.zcard("candles:xauusd:1m")
                        print(
                            f"[PRICE] Tick #{tick_count} | XAU/USD = {result['price']} "
                            f"| candles di Redis: {candle_count}"
                        )
                else:
                    error_count += 1
                    if error_count >= 5:
                        print(f"[PRICE] ERROR {error_count} kegagalan berturut-turut")

            except Exception as e:
                error_count += 1
                print(f"[PRICE] ERROR loop: {type(e).__name__}: {e}")

            await asyncio.sleep(POLL_INTERVAL)


async def _ohlcv_refresh_loop():
    """
    Setiap 5 menit: ambil 200 candle OHLCV dari REST dan isi ulang sorted set.
    Signal engine menggunakan data ini untuk kalkulasi indikator teknikal.
    """
    if not TWELVE_DATA_API_KEY:
        return

    r = await get_redis()

    # Tunggu 5 detik agar price poll loop sempat validate dulu
    await asyncio.sleep(5)
    print(f"[OHLCV] Mulai refresh candle history setiap {OHLCV_INTERVAL} detik")

    async with httpx.AsyncClient() as client:
        # Langsung fetch pertama kali saat startup agar Redis cepat terisi
        while True:
            try:
                candles = await _fetch_ohlcv_candles(client)
                if candles:
                    await r.delete("candles:xauusd:1m")

                    pipe = r.pipeline()
                    for c in candles:
                        try:
                            ts_str = c.get("datetime", "")
                            ts = int(datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S").timestamp())
                            entry = json.dumps({
                                "symbol": "XAUUSD",
                                "price": float(c.get("close", 0)),
                                "open": float(c.get("open", 0)),
                                "high": float(c.get("high", 0)),
                                "low": float(c.get("low", 0)),
                                "close": float(c.get("close", 0)),
                                "volume": float(c.get("volume", 0)),
                                "timestamp": ts_str,
                            })
                            pipe.zadd("candles:xauusd:1m", {entry: ts})
                        except Exception:
                            continue
                    await pipe.execute()

                    count = await r.zcard("candles:xauusd:1m")
                    print(f"[OHLCV] Refresh selesai -- {count} candle tersimpan ke Redis")
                else:
                    print("[OHLCV] WARN tidak ada candle diterima dari REST API")

            except Exception as e:
                print(f"[OHLCV] ERROR: {type(e).__name__}: {e}")

            await asyncio.sleep(OHLCV_INTERVAL)


async def start_price_feed():
    """Start price feed (polling) + OHLCV refresh sebagai background tasks."""
    global _feed_task, _ohlcv_task
    _feed_task = asyncio.create_task(_price_poll_loop())
    _ohlcv_task = asyncio.create_task(_ohlcv_refresh_loop())
    print("[PRICE] Price feed (REST polling) dimulai")


async def stop_price_feed():
    """Stop semua background tasks price feed."""
    global _feed_task, _ohlcv_task
    for task in [_feed_task, _ohlcv_task]:
        if task and not task.done():
            task.cancel()
    print("[PRICE] Price feed dihentikan")
