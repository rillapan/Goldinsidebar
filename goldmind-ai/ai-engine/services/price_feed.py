"""
SINYAL COHIBA — Price Feed Service
Subscribe ke Twelve Data WebSocket untuk harga XAUUSD real-time.
Simpan ke Redis sebagai buffer harga live.
"""

import os
import json
import asyncio
import redis.asyncio as aioredis
import websockets
from datetime import datetime

TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY", "")
TWELVE_DATA_WS_URL = "wss://ws.twelvedata.com/v1/quotes/price"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

redis_client: aioredis.Redis | None = None
ws_connection = None
_feed_task: asyncio.Task | None = None


async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(REDIS_URL)
    return redis_client


async def _price_feed_loop():
    """Main loop: subscribe ke Twelve Data WebSocket, simpan harga ke Redis."""
    if not TWELVE_DATA_API_KEY:
        print("❌ [PRICE] TWELVE_DATA_API_KEY tidak dikonfigurasi — price feed dibatalkan")
        return

    r = await get_redis()

    while True:
        try:
            # API key wajib ada di URL — Twelve Data menolak koneksi tanpa ini
            ws_url = f"{TWELVE_DATA_WS_URL}?apikey={TWELVE_DATA_API_KEY}"
            async with websockets.connect(ws_url) as ws:
                # Tunggu pesan "hello" konfirmasi dari server sebelum subscribe
                hello = await ws.recv()
                hello_data = json.loads(hello)
                if hello_data.get("status") != "ok":
                    print(f"⚠️ [PRICE] Server hello tidak OK: {hello_data}")

                # Subscribe ke XAUUSD
                subscribe_msg = {
                    "action": "subscribe",
                    "params": {
                        "symbols": "XAU/USD",
                    },
                }
                await ws.send(json.dumps(subscribe_msg))
                print("📡 [PRICE] Subscribed to XAU/USD")

                async for message in ws:
                    data = json.loads(message)
                    
                    if data.get("event") == "price":
                        price_data = {
                            "symbol": "XAUUSD",
                            "price": float(data.get("price", 0)),
                            "bid": float(data.get("bid", 0)),
                            "ask": float(data.get("ask", 0)),
                            "timestamp": data.get("timestamp", datetime.utcnow().isoformat()),
                            "day_change": float(data.get("day_change", 0)),
                        }
                        
                        # Simpan ke Redis dengan TTL 120 detik
                        await r.set("price:xauusd", json.dumps(price_data), ex=120)
                        
                        # Simpan ke sorted set untuk candle history
                        ts = int(datetime.utcnow().timestamp())
                        await r.zadd("candles:xauusd:1m", {json.dumps(price_data): ts})
                        
                        # Trim: keep only last 300 candles
                        await r.zremrangebyrank("candles:xauusd:1m", 0, -301)

        except Exception as e:
            print(f"❌ [PRICE] WebSocket error: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)


async def start_price_feed():
    """Start the price feed background task."""
    global _feed_task
    _feed_task = asyncio.create_task(_price_feed_loop())
    print("📡 [PRICE] Price feed started")


async def stop_price_feed():
    """Stop the price feed."""
    global _feed_task
    if _feed_task:
        _feed_task.cancel()
        print("📡 [PRICE] Price feed stopped")
