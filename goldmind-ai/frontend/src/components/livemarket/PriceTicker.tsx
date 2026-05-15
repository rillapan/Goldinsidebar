'use client';

import { useState, useEffect, useRef } from 'react';
import { USD_TO_IDR } from '@/lib/constants';
import { formatIDR } from '@/lib/market-utils';

interface Props {
  price: number | null;
  dayChange?: number | null;
  status: 'live' | 'stale' | 'connecting';
}

function StatusBadge({ status }: { status: Props['status'] }) {
  if (status === 'live') return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      System Status: Live
    </span>
  );
  if (status === 'stale') return (
    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      System Status: Delayed
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-500/10 border border-gray-500/20 px-2.5 py-1 rounded-full font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
      Connecting...
    </span>
  );
}

export function PriceTicker({ price, dayChange, status }: Props) {
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (price === null) return;
    if (prevPriceRef.current !== null && prevPriceRef.current !== price) {
      setFlashClass(price > prevPriceRef.current ? 'flash-green' : 'flash-red');
    }
    prevPriceRef.current = price;
  }, [price]);

  const priceIDR = price != null ? price * USD_TO_IDR : null;
  const changeColor = dayChange == null ? 'text-gray-500'
    : dayChange > 0 ? 'text-emerald-400'
    : dayChange < 0 ? 'text-red-400'
    : 'text-gray-400';

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">XAUUSD Spot</p>
          <p className="text-xs text-gray-600 mt-0.5">Gold / USD · Per Troy Oz</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex flex-col gap-1">
        <span
          className={`text-5xl font-black font-mono tracking-tight text-white leading-none ${flashClass}`}
          onAnimationEnd={() => setFlashClass('')}
        >
          {price != null ? `$${price.toFixed(2)}` : <span className="text-gray-600">---</span>}
        </span>
        <span className="text-lg text-gray-400 font-mono">
          {priceIDR != null
            ? `≈ Rp ${formatIDR(priceIDR)}`
            : <span className="text-gray-600">Rp --</span>}
        </span>
      </div>

      {dayChange != null && (
        <p className={`text-sm font-semibold ${changeColor}`}>
          {dayChange > 0 ? '+' : ''}{dayChange.toFixed(2)} hari ini
        </p>
      )}
    </div>
  );
}
