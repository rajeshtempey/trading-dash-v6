// Pattern Recognition for candlestick analysis
import type { Candle, PatternDetection } from "@shared/schema";

export function detectPatterns(candles: Candle[]): PatternDetection[] {
  if (candles.length < 5) return [];

  const patterns: PatternDetection[] = [];
  const recent = candles.slice(-5);

  // Head and Shoulders
  const headShoulders = detectHeadShoulders(recent);
  if (headShoulders) patterns.push(headShoulders);

  // Double Top/Bottom
  const doubleTop = detectDoubleTop(recent);
  if (doubleTop) patterns.push(doubleTop);

  const doubleBottom = detectDoubleBottom(recent);
  if (doubleBottom) patterns.push(doubleBottom);

  // Triangle (Ascending/Descending/Symmetrical)
  const triangle = detectTriangle(recent);
  if (triangle) patterns.push(triangle);

  // Flag/Pennant
  const flag = detectFlag(recent);
  if (flag) patterns.push(flag);

  // Divergence
  const divergence = detectDivergence(candles.slice(-14));
  if (divergence) patterns.push(divergence);

  return patterns;
}

function detectHeadShoulders(candles: Candle[]): PatternDetection | null {
  if (candles.length < 5) return null;

  const [c1, c2, c3, c4, c5] = candles;

  // Look for pattern: shoulder < head > shoulder
  const shoulder1High = c1.high;
  const headHigh = c3.high;
  const shoulder2High = c5.high;
  const neckline = Math.min(c2.low, c4.low);

  if (
    headHigh > shoulder1High * 1.02 &&
    headHigh > shoulder2High * 1.02 &&
    Math.abs(shoulder1High - shoulder2High) < shoulder1High * 0.02
  ) {
    return {
      name: "Head and Shoulders",
      confidence: 75,
      description: "Bearish reversal pattern. Sell signal when neckline breaks.",
      breakoutLevel: neckline,
      predictedTarget: neckline - (headHigh - neckline),
    };
  }

  return null;
}

function detectDoubleTop(candles: Candle[]): PatternDetection | null {
  if (candles.length < 3) return null;

  const highs = candles.map(c => c.high);
  const maxHigh = Math.max(...highs);
  const topIndices = highs
    .map((h, i) => ({ h, i }))
    .filter(x => x.h >= maxHigh * 0.98)
    .map(x => x.i);

  if (topIndices.length >= 2) {
    const lowBetween = Math.min(
      ...candles
        .slice(Math.min(...topIndices) + 1, Math.max(...topIndices))
        .map(c => c.low)
    );

    return {
      name: "Double Top",
      confidence: 70,
      description: "Bearish reversal. Support at neckline.",
      breakoutLevel: lowBetween,
      predictedTarget: lowBetween - (maxHigh - lowBetween),
    };
  }

  return null;
}

function detectDoubleBottom(candles: Candle[]): PatternDetection | null {
  if (candles.length < 3) return null;

  const lows = candles.map(c => c.low);
  const minLow = Math.min(...lows);
  const bottomIndices = lows
    .map((l, i) => ({ l, i }))
    .filter(x => x.l <= minLow * 1.02)
    .map(x => x.i);

  if (bottomIndices.length >= 2) {
    const highBetween = Math.max(
      ...candles
        .slice(Math.min(...bottomIndices) + 1, Math.max(...bottomIndices))
        .map(c => c.high)
    );

    return {
      name: "Double Bottom",
      confidence: 70,
      description: "Bullish reversal. Resistance at neckline.",
      breakoutLevel: highBetween,
      predictedTarget: highBetween + (highBetween - minLow),
    };
  }

  return null;
}

function detectTriangle(candles: Candle[]): PatternDetection | null {
  if (candles.length < 4) return null;

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // Check for converging highs and lows
  const highTrend = highs[highs.length - 1] < highs[0];
  const lowTrend = lows[lows.length - 1] > lows[0];

  if (highTrend && lowTrend) {
    const highRange = Math.max(...highs) - Math.min(...highs);
    const lowRange = Math.max(...lows) - Math.min(...lows);
    const convergence = (highRange + lowRange) / 2 / candles[0].close;

    if (convergence < 0.05) {
      const lastCandle = candles[candles.length - 1];
      const averagePrice = (lastCandle.high + lastCandle.low) / 2;

      return {
        name: "Triangle (Ascending/Descending)",
        confidence: 65,
        description: "Consolidation pattern. Breakout expected soon.",
        breakoutLevel: averagePrice,
        predictedTarget: averagePrice + (lastCandle.high - lastCandle.low) * 2,
      };
    }
  }

  return null;
}

function detectFlag(candles: Candle[]): PatternDetection | null {
  if (candles.length < 5) return null;

  const volatilities = candles.slice(-3).map(c => c.high - c.low);
  const avgVolatility = volatilities.reduce((a, b) => a + b) / volatilities.length;

  // Flag: small volatility after large move
  if (avgVolatility < candles[0].high * 0.002) {
    const lastCandle = candles[candles.length - 1];

    return {
      name: "Flag/Pennant",
      confidence: 60,
      description: "Continuation pattern. Expect breakout in trend direction.",
      breakoutLevel: lastCandle.high + avgVolatility,
      predictedTarget:
        lastCandle.close +
        (lastCandle.close - candles[0].open) * 0.5,
    };
  }

  return null;
}

function detectDivergence(candles: Candle[]): PatternDetection | null {
  if (candles.length < 5) return null;

  // Simplified RSI calculation for divergence
  const closes = candles.map(c => c.close);
  const rsi = calculateSimpleRSI(closes);

  const priceHigher = closes[closes.length - 1] > closes[closes.length - 5];
  const rsiLower = rsi[rsi.length - 1] < rsi[rsi.length - 5];

  if (priceHigher && rsiLower) {
    return {
      name: "Bearish Divergence (RSI)",
      confidence: 68,
      description: "Price making higher highs but RSI making lower highs. Sell signal.",
    };
  }

  const priceLower = closes[closes.length - 1] < closes[closes.length - 5];
  const rsiHigher = rsi[rsi.length - 1] > rsi[rsi.length - 5];

  if (priceLower && rsiHigher) {
    return {
      name: "Bullish Divergence (RSI)",
      confidence: 68,
      description: "Price making lower lows but RSI making higher lows. Buy signal.",
    };
  }

  return null;
}

function calculateSimpleRSI(prices: number[], period: number = 14): number[] {
  const rsis: number[] = [];

  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(i - period, i);
    let gains = 0;
    let losses = 0;

    for (let j = 1; j < slice.length; j++) {
      const change = slice[j] - slice[j - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / (avgLoss || 1);
    const rsi = 100 - (100 / (1 + rs));

    rsis.push(rsi);
  }

  return rsis;
}
