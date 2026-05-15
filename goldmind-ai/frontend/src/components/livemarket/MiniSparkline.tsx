'use client';

import { useEffect, useRef } from 'react';
import type { PriceData } from '@/lib/market-utils';

interface Props {
  candles: PriceData[];
  livePrice?: number | null;
  height?: number;
  color?: string;
}

export function MiniSparkline({ candles, livePrice, height = 80, color = '#F0B90B' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<any>(null);
  const lineRef      = useRef<any>(null);
  // Track Unix-seconds dari data point terakhir yang sudah dirender
  const lastTimeRef  = useRef<number>(0);

  // Inisialisasi chart saat candles pertama kali tersedia
  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    let mounted = true;

    import('lightweight-charts').then(({ createChart, ColorType }) => {
      if (!mounted || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: 'transparent',
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        rightPriceScale: { visible: false },
        leftPriceScale:  { visible: false },
        timeScale:       { visible: false, borderVisible: false },
        crosshair: {
          vertLine: { visible: false },
          horzLine: { visible: false },
        },
        handleScale:  false,
        handleScroll: false,
      });

      const series = chart.addLineSeries({
        color,
        lineWidth: 2,
        priceLineVisible:      false,
        lastValueVisible:      false,
        crosshairMarkerVisible: false,
      });

      const data = candles
        .map((c) => ({
          time: Math.floor(new Date(c.timestamp).getTime() / 1000) as number,
          value: (c.close || c.price || 0) as number,
        }))
        .filter((d) => d.value > 0 && Number.isFinite(d.time))
        .sort((a, b) => a.time - b.time)
        // Deduplicate: TradingView tidak menerima dua titik dengan time sama
        .filter((d, i, arr) => i === 0 || d.time > arr[i - 1].time);

      if (data.length > 0) {
        series.setData(data as any);
        lastTimeRef.current = data[data.length - 1].time;
      }

      chartRef.current = chart;
      lineRef.current  = series;
    });

    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        lineRef.current  = null;
        lastTimeRef.current = 0;
      }
    };
  }, [candles, height, color]); // eslint-disable-line react-hooks/exhaustive-deps

  // Append harga live tanpa re-render seluruh chart.
  // TradingView mengharuskan time selalu maju — jika nowSec ≤ lastTime, skip.
  useEffect(() => {
    if (!lineRef.current || livePrice == null) return;
    const nowSec = Math.floor(Date.now() / 1000);
    // Pastikan time selalu lebih besar dari titik terakhir
    const newTime = nowSec > lastTimeRef.current ? nowSec : lastTimeRef.current + 1;
    try {
      lineRef.current.update({ time: newTime as any, value: livePrice });
      lastTimeRef.current = newTime;
    } catch {
      // Silent: bisa terjadi saat chart sedang di-destroy
    }
  }, [livePrice]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
