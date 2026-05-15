'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { PriceTicker } from '@/components/livemarket/PriceTicker';
import { MiniSparkline } from '@/components/livemarket/MiniSparkline';
import { SentimentGauge } from '@/components/livemarket/SentimentGauge';
import type { PriceData } from '@/lib/market-utils';

export default function LiveMarketPage() {
  const [price, setPrice]       = useState<number | null>(null);
  const [dayChange, setDayChange] = useState<number | null>(null);
  const [candles, setCandles]   = useState<PriceData[]>([]);
  const [status, setStatus]     = useState<'live' | 'stale' | 'connecting'>('connecting');
  const [staleTimer, setStaleTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchCandles = useCallback(async () => {
    try {
      const res = await api.get('/market/candles');
      setCandles(res.data.data || []);
    } catch {
      // Redis tidak tersedia — tetap tampil
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/market/status');
      setStatus(res.data.status);
      if (res.data.price) setPrice(res.data.price);
    } catch {
      setStatus('stale');
    }
  }, []);

  useEffect(() => {
    fetchCandles();
    fetchStatus();

    // Refresh candles setiap 30 detik
    const candleInterval = setInterval(fetchCandles, 30_000);

    const socket = getSocket();

    const onPriceUpdate = (data: { price: number; day_change?: number }) => {
      setPrice(data.price);
      if (data.day_change != null) setDayChange(data.day_change);
      setStatus('live');

      // Reset stale timer: jika 60 detik tidak ada update, tandai stale
      setStaleTimer((prev) => {
        if (prev) clearTimeout(prev);
        return setTimeout(() => setStatus('stale'), 60_000);
      });
    };

    socket.on('price_update', onPriceUpdate);

    return () => {
      clearInterval(candleInterval);
      socket.off('price_update', onPriceUpdate);
      setStaleTimer((prev) => { if (prev) clearTimeout(prev); return null; });
    };
  }, [fetchCandles, fetchStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page Heading ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Live Market</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          XAUUSD real-time · Harga diperbarui setiap 30 detik dari Twelve Data
        </p>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Kiri: Price Ticker (full width pada mobile, 2 col pada lg) ── */}
        <div className="lg:col-span-2 space-y-6">
          <PriceTicker price={price} dayChange={dayChange} status={status} />

          {/* Sparkline */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-white">Tren 30 Candle Terakhir</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {candles.length > 0
                    ? `${candles.length} titik data · setiap ~5 menit`
                    : 'Memuat data...'}
                </p>
              </div>
              {status === 'live' && (
                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>

            {candles.length === 0 ? (
              <div className="h-[120px] flex items-center justify-center">
                <div className="h-[120px] w-full animate-pulse bg-brand-border/20 rounded" />
              </div>
            ) : (
              <MiniSparkline candles={candles} livePrice={price} height={120} />
            )}
          </div>

          {/* Info box */}
          <div className="glass-card p-4 bg-amber-500/3 border-amber-500/10">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-amber-400 font-semibold">Catatan:</span>{' '}
              Harga diperbarui setiap ±30 detik menggunakan REST polling dari Twelve Data.
              Estimasi IDR menggunakan kurs indikatif dan bukan merupakan rekomendasi trading.
            </p>
          </div>
        </div>

        {/* ── Kanan: Sentiment Gauge ── */}
        <div className="space-y-6">
          {candles.length === 0 ? (
            <div className="glass-card p-6 h-[280px] animate-pulse bg-brand-card/60" />
          ) : (
            <SentimentGauge candles={candles} />
          )}

          {/* Keterangan zona sentiment */}
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs font-semibold text-white mb-3">Zona Sentiment</p>
            {[
              { label: 'Strong Buy',  color: 'bg-emerald-400', range: '≥ +2%' },
              { label: 'Buy',         color: 'bg-emerald-600', range: '+1% s/d +2%' },
              { label: 'Netral',      color: 'bg-amber-400',   range: '-1% s/d +1%' },
              { label: 'Sell',        color: 'bg-orange-500',  range: '-2% s/d -1%' },
              { label: 'Strong Sell', color: 'bg-red-500',     range: '≤ -2%' },
            ].map((z) => (
              <div key={z.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm ${z.color}`} />
                  <span className="text-xs text-gray-300">{z.label}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">{z.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
