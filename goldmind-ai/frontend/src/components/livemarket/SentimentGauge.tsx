'use client';

import { useMemo } from 'react';
import type { PriceData } from '@/lib/market-utils';
import { calculateSentiment } from '@/lib/market-utils';

interface Props {
  candles: PriceData[];
}

// Arc segment endpoints — precomputed from center (100,100) radius 80
// Angles: 180°→144°→108°→72°→36°→0° (counter-clockwise in math = over top in SVG)
const ARC_POINTS = {
  p180: { x: 20,    y: 100 },
  p144: { x: 35.3,  y: 53.0 },
  p108: { x: 75.3,  y: 23.9 },
  p072: { x: 124.7, y: 23.9 },
  p036: { x: 164.7, y: 53.0 },
  p000: { x: 180,   y: 100 },
};

function arcPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  return `M ${from.x} ${from.y} A 80 80 0 0 1 ${to.x} ${to.y}`;
}

const SEGMENTS = [
  { path: arcPath(ARC_POINTS.p180, ARC_POINTS.p144), color: '#CF304A', label: 'Strong Sell' },
  { path: arcPath(ARC_POINTS.p144, ARC_POINTS.p108), color: '#FF6B35', label: 'Sell' },
  { path: arcPath(ARC_POINTS.p108, ARC_POINTS.p072), color: '#F0B90B', label: 'Netral' },
  { path: arcPath(ARC_POINTS.p072, ARC_POINTS.p036), color: '#1BA27A', label: 'Buy' },
  { path: arcPath(ARC_POINTS.p036, ARC_POINTS.p000), color: '#03A66D', label: 'Strong Buy' },
];

const LABEL_COLOR: Record<string, string> = {
  'Strong Sell': 'text-red-400',
  'Sell':        'text-orange-400',
  'Netral':      'text-amber-400',
  'Buy':         'text-emerald-300',
  'Strong Buy':  'text-emerald-400',
};

export function SentimentGauge({ candles }: Props) {
  const sentiment = useMemo(() => calculateSentiment(candles), [candles]);

  return (
    <div className="glass-card p-6 flex flex-col items-center gap-3">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide self-start">
        Market Sentiment
      </p>
      <p className="text-xs text-gray-600 self-start -mt-2">
        Berdasarkan pergerakan {candles.length} candle terakhir
      </p>

      <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
        {/* Colored arc segments */}
        {SEGMENTS.map((seg) => (
          <path
            key={seg.label}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeLinecap="butt"
            opacity="0.75"
          />
        ))}

        {/* Needle */}
        <line
          x1="100" y1="100"
          x2="100" y2="28"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${sentiment.degrees}, 100, 100)`}
          style={{ transition: 'transform 0.6s ease-out' }}
        />

        {/* Center pivot */}
        <circle cx="100" cy="100" r="5" fill="white" />
      </svg>

      <div className="text-center">
        <p className={`text-xl font-bold ${LABEL_COLOR[sentiment.label] ?? 'text-gray-400'}`}>
          {sentiment.label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Score: {Math.round(sentiment.score)}/100
        </p>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between w-full text-xs text-gray-600 px-1">
        <span>Strong Sell</span>
        <span>Netral</span>
        <span>Strong Buy</span>
      </div>
    </div>
  );
}
