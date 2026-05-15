'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { USD_TO_IDR } from '@/lib/constants';
import { formatIDR } from '@/lib/market-utils';
import { MiniSparkline } from '@/components/livemarket/MiniSparkline';
import type { PriceData } from '@/lib/market-utils';

interface Props {
  livePrice: number | null;
}

export function LiveMarketMiniWidget({ livePrice }: Props) {
  const [candles, setCandles]   = useState<PriceData[]>([]);
  const [status, setStatus]     = useState<'live' | 'stale' | 'connecting'>('connecting');

  useEffect(() => {
    const fetchCandles = async () => {
      try {
        const res = await api.get('/market/candles');
        setCandles(res.data.data || []);
      } catch {
        // candles tidak tersedia — widget tetap tampil tanpa sparkline
      }
    };

    const fetchStatus = async () => {
      try {
        const res = await api.get('/market/status');
        setStatus(res.data.status);
      } catch {
        setStatus('stale');
      }
    };

    fetchCandles();
    fetchStatus();

    // Refresh candles setiap 30 detik
    const interval = setInterval(fetchCandles, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Deteksi stale: jika 60 detik tidak ada price_update, anggap stale
  useEffect(() => {
    if (livePrice == null) return;
    setStatus('live');
    const timer = setTimeout(() => setStatus('stale'), 60_000);
    return () => clearTimeout(timer);
  }, [livePrice]);

  const priceIDR = livePrice != null ? livePrice * USD_TO_IDR : null;

  return (
    <Link
      href="/livemarket"
      className="glass-card p-4 flex flex-col gap-3 hover:border-amber-500/25 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-white">Live Market</span>
          {status === 'live' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          {status === 'stale' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>

      {/* Price */}
      <div>
        <p className="text-xl font-black font-mono text-amber-400">
          {livePrice != null ? `$${livePrice.toFixed(2)}` : <span className="text-gray-600">---</span>}
        </p>
        <p className="text-xs text-gray-500 font-mono">
          {priceIDR != null ? `≈ Rp ${formatIDR(priceIDR)}` : 'Rp --'}
        </p>
      </div>

      {/* Mini sparkline */}
      {candles.length > 0 && (
        <MiniSparkline candles={candles} livePrice={livePrice} height={48} />
      )}

      <p className="text-xs text-gray-600">XAUUSD · Lihat detail →</p>
    </Link>
  );
}
