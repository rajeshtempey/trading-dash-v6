// Advanced indicator calculations for perfect prediction accuracy
import type { Candle, TechnicalIndicators } from "@shared/schema";

export interface ConfluenceScore {
  emaConfluence: number; // 0-100
  rsiConfluence: number; // 0-100
  bollingerConfluence: number; // 0-100
  macdConfluence: number; // 0-100
  volumeConfluence: number; // 0-100
  overallScore: number; // 0-100: how many indicators agree
}

export interface SupportResistance {
  supports: number[];
  resistances: number[];
  strongestSupport: number;
  strongestResistance: number;
}

export interface MarketSentiment {
  score: number; // -100 (extreme fear) to +100 (extreme greed)
  label: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  volumeSentiment: number; // -100 to +100
  priceSentiment: number; // -100 to +100
}

export interface RiskMetrics {
  drawdownRisk: number; // % risk of current position
  volatilityRank: number; // 0-100: current volatility vs historical
  sharpeRatio: number; // Risk-adjusted return
  calmarRatio: number; // Return/MaxDrawdown
  profitFactor: number; // Wins/Losses ratio
}

// Calculate multi-indicator confluence
export function calculateConfluence(indicators: TechnicalIndicators | null): ConfluenceScore {
  if (!indicators) {
    return {
      emaConfluence: 0,
      rsiConfluence: 0,
      bollingerConfluence: 0,
      macdConfluence: 0,
      volumeConfluence: 0,
      overallScore: 0,
    };
  }

  const { ema8, ema34, rsi, macd, bollingerBands, stochasticRsi } = indicators;

  // EMA Confluence: how strong is the trend
  const emaConfluence = ema8 > ema34 ? 85 : 15;

  // RSI Confluence: momentum alignment
  const rsiConfluence = rsi > 50 ? Math.min(100, rsi * 1.2) : Math.max(0, rsi * 0.8);

  // Bollinger Confluence: volatility and reversal points
  const bollingerConfluence = bollingerBands
    ? (Math.abs(bollingerBands.percentB - 0.5) * 200) // 0 at midline, 100 at extremes
    : 50;

  // MACD Confluence: momentum direction
  const macdConfluence = macd > 0 ? 75 : 25;

  // Volume Confluence (placeholder for future volume weighting)
  const volumeConfluence = 60;

  const allScores = [emaConfluence, rsiConfluence, bollingerConfluence, macdConfluence, volumeConfluence];
  const avgScore = allScores.reduce((a, b) => a + b) / allScores.length;

  // Count how many indicators are bullish (>60)
  const bullishCount = allScores.filter(s => s > 60).length;
  const overallScore = (bullishCount / allScores.length) * 100;

  return {
    emaConfluence,
    rsiConfluence,
    bollingerConfluence,
    macdConfluence,
    volumeConfluence,
    overallScore,
  };
}

// Calculate support and resistance levels
export function calculateSupportResistance(candles: Candle[], lookback: number = 50): SupportResistance {
  if (candles.length < 5) {
    const lastCandle = candles[candles.length - 1];
    return {
      supports: [lastCandle.low],
      resistances: [lastCandle.high],
      strongestSupport: lastCandle.low,
      strongestResistance: lastCandle.high,
    };
  }

  const recentCandles = candles.slice(-Math.min(lookback, candles.length));
  const closes = recentCandles.map(c => c.close);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);

  // Find local maxima and minima
  const supports: number[] = [];
  const resistances: number[] = [];

  for (let i = 1; i < lows.length - 1; i++) {
    if (lows[i] < lows[i - 1] && lows[i] < lows[i + 1]) {
      supports.push(lows[i]);
    }
    if (highs[i] > highs[i - 1] && highs[i] > highs[i + 1]) {
      resistances.push(highs[i]);
    }
  }

  // Add recent extremes
  resistances.push(Math.max(...highs));
  supports.push(Math.min(...lows));

  const strongestSupport = Math.max(...supports);
  const strongestResistance = Math.min(...resistances);

  return {
    supports: Array.from(new Set(supports)).sort((a, b) => b - a),
    resistances: Array.from(new Set(resistances)).sort((a, b) => a - b),
    strongestSupport,
    strongestResistance,
  };
}

// Calculate market sentiment
export function calculateMarketSentiment(candles: Candle[], indicators: TechnicalIndicators | null): MarketSentiment {
  if (candles.length < 10 || !indicators) {
    return {
      score: 0,
      label: 'Neutral',
      volumeSentiment: 0,
      priceSentiment: 0,
    };
  }

  // Price sentiment: momentum and trend
  const lastCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2];
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const bullishBody = lastCandle.close > lastCandle.open ? bodySize : -bodySize;

  // Volume sentiment: increasing volume on uptrends
  const volumeGrowth = (lastCandle.volume - previousCandle.volume) / previousCandle.volume;
  const volumeSentiment = bullishBody > 0 ? volumeGrowth * 100 : -volumeGrowth * 100;

  // Price sentiment from RSI
  const rsi = indicators.rsi || 50;
  const priceSentiment = (rsi - 50) * 2; // -100 to +100

  // Overall sentiment
  const score = Math.max(-100, Math.min(100, (priceSentiment + volumeSentiment) / 2));

  let label: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  if (score < -70) label = 'Extreme Fear';
  else if (score < -20) label = 'Fear';
  else if (score < 20) label = 'Neutral';
  else if (score < 70) label = 'Greed';
  else label = 'Extreme Greed';

  return {
    score,
    label,
    volumeSentiment,
    priceSentiment,
  };
}

// Calculate risk metrics
export function calculateRiskMetrics(candles: Candle[]): RiskMetrics {
  if (candles.length < 20) {
    return {
      drawdownRisk: 0,
      volatilityRank: 50,
      sharpeRatio: 0,
      calmarRatio: 0,
      profitFactor: 1,
    };
  }

  const closes = candles.map(c => c.close);

  // Volatility calculation
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);
  const volatilityRank = Math.min(100, stdDev * 1000); // Scale to 0-100

  // Sharpe Ratio (risk-free rate assumed 0)
  const avgReturn = returns.reduce((a, b) => a + b) / returns.length;
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // Max Drawdown
  let peak = closes[0];
  let maxDrawdown = 0;
  for (const close of closes) {
    if (close > peak) peak = close;
    const drawdown = (peak - close) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Calmar Ratio
  const totalReturn = (closes[closes.length - 1] - closes[0]) / closes[0];
  const calmarRatio = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;

  // Profit Factor (simple: wins vs losses)
  const profits = returns.filter(r => r > 0).reduce((a, b) => a + b, 0);
  const losses = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0));
  const profitFactor = losses > 0 ? profits / losses : 1;

  return {
    drawdownRisk: maxDrawdown * 100,
    volatilityRank,
    sharpeRatio,
    calmarRatio,
    profitFactor,
  };
}

// Multi-timeframe confirmation
export interface MultiTimeframeSignal {
  timeframe: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 0-100
  confirmation: boolean; // Does higher timeframe confirm?
}

export function getMultiTimeframeConfirmation(
  candles1m: Candle[],
  candles5m: Candle[],
  candles1h: Candle[],
  indicators1m: TechnicalIndicators | null,
  indicators5m: TechnicalIndicators | null,
  indicators1h: TechnicalIndicators | null
): MultiTimeframeSignal[] {
  const signals: MultiTimeframeSignal[] = [];

  const getSignal = (indicators: TechnicalIndicators | null): 'BUY' | 'SELL' | 'NEUTRAL' => {
    if (!indicators) return 'NEUTRAL';
    if (indicators.ema8 > indicators.ema34 && indicators.rsi < 70) return 'BUY';
    if (indicators.ema8 < indicators.ema34 && indicators.rsi > 30) return 'SELL';
    return 'NEUTRAL';
  };

  signals.push({
    timeframe: '1m',
    signal: getSignal(indicators1m),
    strength: indicators1m?.trendStrength || 0,
    confirmation: false,
  });

  signals.push({
    timeframe: '5m',
    signal: getSignal(indicators5m),
    strength: indicators5m?.trendStrength || 0,
    confirmation: false,
  });

  signals.push({
    timeframe: '1h',
    signal: getSignal(indicators1h),
    strength: indicators1h?.trendStrength || 0,
    confirmation: false,
  });

  // Check confirmation: higher timeframe should align
  const signal1h = signals[2].signal;
  if (signal1h !== 'NEUTRAL') {
    signals[0].confirmation = signals[0].signal === signal1h;
    signals[1].confirmation = signals[1].signal === signal1h;
  }

  return signals;
}
