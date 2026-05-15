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
          time: Math.floor(new Date(c.timestamp).getTime() / 1000) as any,
          value: (c.close || c.price || 0) as number,
        }))
        .filter((d) => d.value > 0)
        .sort((a, b) => a.time - b.time);

      if (data.length > 0) series.setData(data);

      chartRef.current = chart;
      lineRef.current  = series;
    });

    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        lineRef.current  = null;
      }
    };
  }, [candles, height, color]); // eslint-disable-line react-hooks/exhaustive-deps

  // Append harga live sebagai titik baru tanpa re-render seluruh chart
  useEffect(() => {
    if (!lineRef.current || livePrice == null) return;
    lineRef.current.update({
      time: Math.floor(Date.now() / 1000) as any,
      value: livePrice,
    });
  }, [livePrice]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
