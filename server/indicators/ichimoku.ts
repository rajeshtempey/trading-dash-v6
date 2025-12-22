// server/indicators/ichimoku.ts
// 100% FREE - Public domain algorithm
// Ichimoku Cloud - comprehensive technical analysis tool

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IchimokuResult {
  tenkanSen: number;      // Conversion Line (9 period)
  kijunSen: number;       // Base Line (26 period)
  senkouSpanA: number;    // Leading Span A
  senkouSpanB: number;    // Leading Span B
  chikouSpan: number;     // Lagging Span
  cloudColor: 'BULLISH' | 'BEARISH';
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  above_cloud: boolean;   // Price above cloud = bullish
  below_cloud: boolean;   // Price below cloud = bearish
}

export function calculateIchimoku(
  candles: Candle[],
  conversionPeriod: number = 9,
  basePeriod: number = 26,
  spanPeriod: number = 52,
  displacement: number = 26
): IchimokuResult[] {
  const results: IchimokuResult[] = [];

  for (let i = 0; i < candles.length; i++) {
    // Tenkan-sen (Conversion Line) - 9 period
    const conversionStart = Math.max(0, i - conversionPeriod + 1);
    const conversionCandles = candles.slice(conversionStart, i + 1);
    const conversionHigh = Math.max(...conversionCandles.map(c => c.high));
    const conversionLow = Math.min(...conversionCandles.map(c => c.low));
    const tenkanSen = (conversionHigh + conversionLow) / 2;

    // Kijun-sen (Base Line) - 26 period
    const baseStart = Math.max(0, i - basePeriod + 1);
    const baseCandles = candles.slice(baseStart, i + 1);
    const baseHigh = Math.max(...baseCandles.map(c => c.high));
    const baseLow = Math.min(...baseCandles.map(c => c.low));
    const kijunSen = (baseHigh + baseLow) / 2;

    // Senkou Span A (Leading Span A) - average of TK
    const senkouSpanA = (tenkanSen + kijunSen) / 2;

    // Senkou Span B (Leading Span B) - 52 period
    const spanStart = Math.max(0, i - spanPeriod + 1);
    const spanCandles = candles.slice(spanStart, i + 1);
    const spanHigh = Math.max(...spanCandles.map(c => c.high));
    const spanLow = Math.min(...spanCandles.map(c => c.low));
    const senkouSpanB = (spanHigh + spanLow) / 2;

    // Chikou Span (Lagging Span) - current close plotted 26 periods back
    const chikouSpan = candles[i].close;

    // Cloud color and position analysis
    const cloudColor = senkouSpanA > senkouSpanB ? 'BULLISH' : 'BEARISH';
    const cloudTop = Math.max(senkouSpanA, senkouSpanB);
    const cloudBottom = Math.min(senkouSpanA, senkouSpanB);
    const above_cloud = candles[i].close > cloudTop;
    const below_cloud = candles[i].close < cloudBottom;

    // Generate signals
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';

    if (i > 0) {
      const prevResult = results[i - 1];

      // TK Cross signals
      const prevTenkan = prevResult.tenkanSen;
      const prevKijun = prevResult.kijunSen;

      // Bullish signal: Tenkan crosses above Kijun + above cloud
      if (prevTenkan <= prevKijun && tenkanSen > kijunSen && above_cloud) {
        signal = 'BUY';
      } 
      // Bearish signal: Tenkan crosses below Kijun + below cloud
      else if (prevTenkan >= prevKijun && tenkanSen < kijunSen && below_cloud) {
        signal = 'SELL';
      }
    }

    results.push({
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikouSpan,
      cloudColor,
      signal,
      above_cloud,
      below_cloud
    });
  }

  return results;
}
