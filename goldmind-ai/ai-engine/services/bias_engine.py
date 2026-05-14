"""
SINYAL COHIBA — Daily Bias Engine
Fetch berita ekonomi → kirim ke Claude → hasilkan Market Bias harian
"""

import os
import json
import httpx
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


async def fetch_news() -> list[dict]:
    """Fetch berita ekonomi dari NewsAPI dan Finnhub."""
    news = []
    
    async with httpx.AsyncClient() as client:
        # NewsAPI
        try:
            resp = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": "gold XAUUSD federal reserve inflation CPI NFP",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 10,
                    "apiKey": NEWS_API_KEY,
                },
                timeout=15.0,
            )
            if resp.status_code == 200:
                articles = resp.json().get("articles", [])
                for a in articles:
                    news.append({
                        "title": a.get("title"),
                        "description": a.get("description"),
                        "source": a.get("source", {}).get("name"),
                        "publishedAt": a.get("publishedAt"),
                    })
        except Exception as e:
            print(f"⚠️ NewsAPI error: {e}")
        
        # Finnhub
        try:
            resp = await client.get(
                "https://finnhub.io/api/v1/news",
                params={"category": "forex", "token": FINNHUB_API_KEY},
                timeout=15.0,
            )
            if resp.status_code == 200:
                for item in resp.json()[:5]:
                    news.append({
                        "title": item.get("headline"),
                        "description": item.get("summary"),
                        "source": item.get("source"),
                        "publishedAt": item.get("datetime"),
                    })
        except Exception as e:
            print(f"⚠️ Finnhub error: {e}")
    
    return news


async def generate_bias_with_claude(news: list[dict]) -> dict | None:
    """Kirim berita ke Claude untuk analisa Market Bias."""
    news_text = "\n".join([
        f"- [{n['source']}] {n['title']}: {n.get('description', '')}"
        for n in news
    ])

    prompt = f"""Berdasarkan data berita ekonomi global berikut:

{news_text}

Tentukan Market Bias XAUUSD untuk hari ini. Return JSON:
{{
  "direction": "BUY" atau "SELL" atau "WAIT",
  "confidence": <0-100>,
  "reasoning": "<analisa dalam Bahasa Indonesia, 2-3 paragraf>"
}}

Return HANYA JSON, tanpa teks lain."""

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": CLAUDE_MODEL,
                "max_tokens": 800,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30.0,
        )
    
    if resp.status_code != 200:
        return None
    
    text = resp.json()["content"][0]["text"]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        return json.loads(match.group()) if match else None


@router.post("/generate-bias")
async def generate_bias():
    """Dipanggil oleh Node-Cron setiap pukul 07.00 WIB."""
    news = await fetch_news()
    
    if not news:
        return {"status": "skip", "reason": "No news data available"}
    
    bias = await generate_bias_with_claude(news)
    if not bias:
        return {"status": "error", "reason": "Claude API failed"}
    
    # Forward ke backend untuk disimpan ke DB + broadcast
    payload = {
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "direction": bias["direction"],
        "confidence": bias["confidence"],
        "reasoning": bias["reasoning"],
        "newsData": news,
    }
    
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{BACKEND_URL}/api/internal/bias",
            json=payload,
            headers={"X-Internal-Key": os.getenv("INTERNAL_API_KEY", "")},
            timeout=10.0,
        )
    
    return {"status": "bias_generated", "data": bias}
