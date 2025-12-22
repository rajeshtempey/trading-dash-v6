// server/indicators/supertrend.ts
// 100% FREE - No licensing required
// SuperTrend is an industry-standard FREE indicator

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SuperTrendResult {
  supertrend: number;
  direction: 'UP' | 'DOWN';
  buy_signal: boolean;
  sell_signal: boolean;
  trend_change: boolean;
}

export function calculateSuperTrend(
  candles: Candle[],
  period: number = 10,
  multiplier: number = 3
): SuperTrendResult[] {
  const results: SuperTrendResult[] = [];
  
  if (candles.length < period + 1) {
    return candles.map(candle => ({
      supertrend: candle.close,
      direction: 'UP',
      buy_signal: false,
      sell_signal: false,
      trend_change: false
    }));
  }

  const atr = calculateATR(candles, period);

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      results.push({
        supertrend: candles[i].close,
        direction: 'UP',
        buy_signal: false,
        sell_signal: false,
        trend_change: false
      });
      continue;
    }

    const hl2 = (candles[i].high + candles[i].low) / 2;
    const basicUpperBand = hl2 + (multiplier * atr[i]);
    const basicLowerBand = hl2 - (multiplier * atr[i]);

    let finalUpperBand = basicUpperBand;
    let finalLowerBand = basicLowerBand;

    if (i > 0) {
      const prevResult = results[i - 1];
      finalUpperBand = basicUpperBand < prevResult.supertrend || 
                       candles[i - 1].close > prevResult.supertrend
        ? basicUpperBand
        : prevResult.supertrend;

      finalLowerBand = basicLowerBand > prevResult.supertrend || 
                       candles[i - 1].close < prevResult.supertrend
        ? basicLowerBand
        : prevResult.supertrend;
    }

    const supertrend = candles[i].close <= finalUpperBand 
      ? finalUpperBand 
      : finalLowerBand;

    const direction = candles[i].close <= supertrend ? 'DOWN' : 'UP';
    const prevDirection = results[i - 1].direction;

    const buy_signal = prevDirection === 'DOWN' && direction === 'UP';
    const sell_signal = prevDirection === 'UP' && direction === 'DOWN';
    const trend_change = buy_signal || sell_signal;

    results.push({ 
      supertrend, 
      direction, 
      buy_signal, 
      sell_signal,
      trend_change 
    });
  }

  return results;
}

// ATR Helper Function (FREE)
function calculateATR(candles: Candle[], period: number): number[] {
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    tr.push(Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    ));
  }

  // Calculate SMA of TR first
  let sum = 0;
  for (let i = 0; i < period && i < tr.length; i++) {
    sum += tr[i];
  }

  // Calculate EMA of TR
  const atr: number[] = new Array(tr.length).fill(0);
  atr[period - 1] = sum / period;

  const multiplier = 2 / (period + 1);

  for (let i = period; i < tr.length; i++) {
    atr[i] = (tr[i] - atr[i - 1]) * multiplier + atr[i - 1];
  }

  return atr;
}
