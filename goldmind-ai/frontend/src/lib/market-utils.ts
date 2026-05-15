export interface PriceData {
  symbol?: string;
  price?: number;
  close?: number;
  open?: number;
  high?: number;
  low?: number;
  timestamp: string;
  day_change?: number;
}

export interface SentimentResult {
  score: number;
  label: string;
  degrees: number;
}

export function calculateSentiment(candles: PriceData[]): SentimentResult {
  if (candles.length < 2) {
    return { score: 50, label: 'Netral', degrees: 0 };
  }

  const first = candles[0].close || candles[0].price || 0;
  const last = candles[candles.length - 1].close || candles[candles.length - 1].price || 0;

  if (first === 0) {
    return { score: 50, label: 'Netral', degrees: 0 };
  }

  // changePercent: positif = naik, negatif = turun
  // ±2% → score 100/0 (Strong Buy/Sell), ±1% → 75/25, ±0.5% → 62.5/37.5
  const changePercent = ((last - first) / first) * 100;
  const score = Math.max(0, Math.min(100, 50 + changePercent * 25));

  const label =
    score >= 80 ? 'Strong Buy' :
    score >= 60 ? 'Buy' :
    score >= 40 ? 'Netral' :
    score >= 20 ? 'Sell' :
    'Strong Sell';

  const degrees = (score / 100) * 180 - 90;

  return { score, label, degrees };
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

export function normalizeCandle(raw: PriceData): number {
  return (raw.close || raw.price) as number;
}
