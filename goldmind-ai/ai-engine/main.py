"""
SINYAL COHIBA — AI Engine (FastAPI)
Signal Processing + Daily Bias Generation

Startup sequence:
1. Sambung ke Redis
2. Start Twelve Data WebSocket price feed (background task)
3. Start APScheduler untuk generate sinyal setiap 5 menit (Senin-Jumat)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import os

load_dotenv()

from services.price_feed    import start_price_feed, stop_price_feed
from services.signal_engine import router as signal_router, signal_scheduler
from services.bias_engine   import router as bias_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Konteks hidup aplikasi FastAPI.
    Semua resource distart saat startup, dibersihkan saat shutdown.
    """
    # ── STARTUP ────────────────────────────────────────

    # 1. Start price feed — subscribe ke Twelve Data WebSocket
    await start_price_feed()
    print("📡 Price feed terhubung ke Twelve Data")

    # 2. Start APScheduler — auto signal generation setiap 5 menit
    signal_scheduler.start()
    print("⏰ APScheduler dimulai — signal generation setiap 5 menit (Senin–Jumat)")

    # Log jadwal yang aktif
    for job in signal_scheduler.get_jobs():
        print(f"   └─ Job: {job.id} | Next run: {job.next_run_time}")

    print("\n🚀 SINYAL COHIBA Engine siap\n")
    yield

    # ── SHUTDOWN ───────────────────────────────────────

    # Hentikan scheduler terlebih dahulu agar tidak ada job baru yang start
    if signal_scheduler.running:
        signal_scheduler.shutdown(wait=False)
        print("⏰ APScheduler dihentikan")

    # Hentikan price feed WebSocket
    await stop_price_feed()
    print("📡 Price feed dihentikan")

    print("🛑 SINYAL COHIBA Engine shutdown selesai")


app = FastAPI(
    title="SINYAL COHIBA Engine",
    description="AI Signal Processing & Daily Bias Generation untuk XAUUSD",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signal_router, prefix="/api", tags=["signals"])
app.include_router(bias_router,   prefix="/api", tags=["bias"])


@app.get("/api/health")
async def health():
    """Health check endpoint — dipanggil oleh monitoring/uptime checker."""
    scheduler_status = "running" if signal_scheduler.running else "stopped"
    jobs = [
        {"id": job.id, "next_run": str(job.next_run_time)}
        for job in signal_scheduler.get_jobs()
    ]
    return {
        "status": "ok",
        "service": "goldmind-ai-engine",
        "scheduler": scheduler_status,
        "scheduled_jobs": jobs,
    }
