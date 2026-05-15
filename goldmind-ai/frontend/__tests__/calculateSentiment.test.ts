import { calculateSentiment } from '../src/lib/market-utils';
import type { PriceData } from '../src/lib/market-utils';

function makeCandles(prices: number[]): PriceData[] {
  return prices.map((p, i) => ({
    symbol: 'XAUUSD',
    close: p,
    timestamp: new Date(Date.now() + i * 60_000).toISOString(),
  }));
}

describe('calculateSentiment', () => {
  it('returns neutral (score=50, degrees=0) when candles < 2', () => {
    expect(calculateSentiment([])).toEqual({ score: 50, label: 'Netral', degrees: 0 });
    expect(calculateSentiment(makeCandles([2300]))).toEqual({ score: 50, label: 'Netral', degrees: 0 });
  });

  it('returns neutral when first price is 0 (division guard)', () => {
    const candles = makeCandles([0, 2300]);
    expect(calculateSentiment(candles)).toEqual({ score: 50, label: 'Netral', degrees: 0 });
  });

  it('returns Netral when price is flat', () => {
    const result = calculateSentiment(makeCandles([2300, 2300]));
    expect(result.score).toBe(50);
    expect(result.label).toBe('Netral');
    expect(result.degrees).toBe(0);
  });

  it('returns Buy when price rises ~1%', () => {
    const result = calculateSentiment(makeCandles([2300, 2323])); // +1%
    expect(result.score).toBeCloseTo(75, 0);
    expect(result.label).toBe('Buy');
    expect(result.degrees).toBeGreaterThan(0);
  });

  it('returns Sell when price falls ~1%', () => {
    const result = calculateSentiment(makeCandles([2300, 2277])); // -1%
    expect(result.score).toBeCloseTo(25, 0);
    expect(result.label).toBe('Sell');
    expect(result.degrees).toBeLessThan(0);
  });

  it('returns Strong Buy when price rises ≥ 2%', () => {
    const result = calculateSentiment(makeCandles([2300, 2346])); // +2%
    expect(result.score).toBe(100);
    expect(result.label).toBe('Strong Buy');
    expect(result.degrees).toBe(90);
  });

  it('returns Strong Sell when price falls ≥ 2%', () => {
    const result = calculateSentiment(makeCandles([2300, 2254])); // -2%
    expect(result.score).toBe(0);
    expect(result.label).toBe('Strong Sell');
    expect(result.degrees).toBe(-90);
  });

  it('score is always clamped between 0 and 100', () => {
    const extreme = calculateSentiment(makeCandles([1000, 9000])); // +800%
    expect(extreme.score).toBe(100);
    const crash = calculateSentiment(makeCandles([9000, 100])); // -99%
    expect(crash.score).toBe(0);
  });

  it('uses close field when available (over price field)', () => {
    const candles: PriceData[] = [
      { symbol: 'XAUUSD', close: 2300, price: 9999, timestamp: new Date().toISOString() },
      { symbol: 'XAUUSD', close: 2323, price: 9999, timestamp: new Date().toISOString() },
    ];
    const result = calculateSentiment(candles);
    expect(result.score).toBeCloseTo(75, 0); // berdasarkan close, bukan price
  });

  it('falls back to price field when close is undefined', () => {
    const candles: PriceData[] = [
      { symbol: 'XAUUSD', price: 2300, timestamp: new Date().toISOString() },
      { symbol: 'XAUUSD', price: 2323, timestamp: new Date().toISOString() },
    ];
    const result = calculateSentiment(candles);
    expect(result.score).toBeCloseTo(75, 0);
  });
});
