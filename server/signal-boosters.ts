import type { Candle, TechnicalIndicators, Asset } from "@shared/schema";
import type { MLPredictionResult } from "./ml-engine";

interface SentimentResult {
  score: number;
  label: 'VERY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'VERY_BEARISH';
  factors: string[];
  confidence: number;
}

interface VolumeAnalysis {
  volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  volumeStrength: number;
  unusualActivity: boolean;
  buyingPressure: number;
  sellingPressure: number;
}

interface MomentumScore {
  overall: number;
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
  divergence: 'BULLISH' | 'BEARISH' | 'NONE';
}

interface VolatilityAdjustment {
  adjustedConfidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  volatilityPercent: number;
  recommendedPositionSize: number;
}

interface SignalBoost {
  originalConfidence: number;
  boostedConfidence: number;
  boostPercent: number;
  sentiment: SentimentResult;
  volumeAnalysis: VolumeAnalysis;
  momentum: MomentumScore;
  volatilityAdjustment: VolatilityAdjustment;
  overallSignalStrength: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK' | 'VERY_WEAK';
  tradingRecommendation: string;
  riskRewardRatio: number;
}

function analyzeSentiment(candles: Candle[], indicators: TechnicalIndicators): SentimentResult {
  const factors: string[] = [];
  let score = 50;
  
  if (indicators.ema8 > indicators.ema34) {
    score += 10;
    factors.push('EMA crossover bullish');
  } else {
    score -= 10;
    factors.push('EMA crossover bearish');
  }
  
  if (indicators.rsi < 30) {
    score += 15;
    factors.push('RSI oversold - potential reversal');
  } else if (indicators.rsi > 70) {
    score -= 15;
    factors.push('RSI overbought - potential correction');
  } else if (indicators.rsi > 50) {
    score += 5;
    factors.push('RSI bullish momentum');
  } else {
    score -= 5;
    factors.push('RSI bearish momentum');
  }
  
  if (indicators.macd > 0) {
    score += 8;
    factors.push('MACD positive');
  } else {
    score -= 8;
    factors.push('MACD negative');
  }
  
  if (indicators.bollingerBands) {
    const bb = indicators.bollingerBands;
    if (bb.percentB < 0.2) {
      score += 12;
      factors.push('Price near lower Bollinger Band');
    } else if (bb.percentB > 0.8) {
      score -= 12;
      factors.push('Price near upper Bollinger Band');
    }
    
    if (bb.bandwidth > 5) {
      factors.push('High volatility detected');
    } else if (bb.bandwidth < 2) {
      factors.push('Low volatility - potential breakout coming');
    }
  }
  
  if (indicators.stochasticRsi) {
    const stoch = indicators.stochasticRsi;
    if (stoch.fastK < 20 && stoch.fastD < 20) {
      score += 10;
      factors.push('Stochastic RSI oversold');
    } else if (stoch.fastK > 80 && stoch.fastD > 80) {
      score -= 10;
      factors.push('Stochastic RSI overbought');
    }
  }
  
  const recentCandles = candles.slice(-10);
  let greenCandles = 0;
  for (const c of recentCandles) {
    if (c.close > c.open) greenCandles++;
  }
  if (greenCandles >= 7) {
    score += 8;
    factors.push('Strong bullish candle pattern');
  } else if (greenCandles <= 3) {
    score -= 8;
    factors.push('Strong bearish candle pattern');
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let label: SentimentResult['label'];
  if (score >= 75) label = 'VERY_BULLISH';
  else if (score >= 55) label = 'BULLISH';
  else if (score >= 45) label = 'NEUTRAL';
  else if (score >= 25) label = 'BEARISH';
  else label = 'VERY_BEARISH';
  
  const confidence = Math.abs(score - 50) * 2;
  
  return { score, label, factors, confidence };
}

function analyzeVolume(candles: Candle[]): VolumeAnalysis {
  const volumes = candles.map(c => c.volume || 0);
  const recentVolumes = volumes.slice(-10);
  const olderVolumes = volumes.slice(-30, -10);
  
  const recentAvg = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const olderAvg = olderVolumes.length > 0 ? 
    olderVolumes.reduce((a, b) => a + b, 0) / olderVolumes.length : recentAvg;
  
  let volumeTrend: VolumeAnalysis['volumeTrend'];
  if (recentAvg > olderAvg * 1.2) {
    volumeTrend = 'INCREASING';
  } else if (recentAvg < olderAvg * 0.8) {
    volumeTrend = 'DECREASING';
  } else {
    volumeTrend = 'STABLE';
  }
  
  const volumeStrength = Math.min(100, (recentAvg / (olderAvg || 1)) * 50);
  
  const unusualActivity = recentVolumes.some(v => v > olderAvg * 2.5);
  
  const recentCandles = candles.slice(-10);
  let buyVolume = 0;
  let sellVolume = 0;
  for (const c of recentCandles) {
    if (c.close > c.open) {
      buyVolume += c.volume || 0;
    } else {
      sellVolume += c.volume || 0;
    }
  }
  const totalVolume = buyVolume + sellVolume;
  const buyingPressure = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50;
  const sellingPressure = 100 - buyingPressure;
  
  return {
    volumeTrend,
    volumeStrength: Math.round(volumeStrength),
    unusualActivity,
    buyingPressure: Math.round(buyingPressure),
    sellingPressure: Math.round(sellingPressure),
  };
}

function calculateMomentumScore(candles: Candle[], indicators: TechnicalIndicators): MomentumScore {
  const prices = candles.map(c => c.close);
  const currentPrice = prices[prices.length - 1];
  
  const shortTermPrices = prices.slice(-5);
  const shortTermChange = shortTermPrices.length > 1 ? 
    (shortTermPrices[shortTermPrices.length - 1] - shortTermPrices[0]) / shortTermPrices[0] * 100 : 0;
  
  const mediumTermPrices = prices.slice(-20);
  const mediumTermChange = mediumTermPrices.length > 1 ?
    (mediumTermPrices[mediumTermPrices.length - 1] - mediumTermPrices[0]) / mediumTermPrices[0] * 100 : 0;
  
  const longTermPrices = prices.slice(-50);
  const longTermChange = longTermPrices.length > 1 ?
    (longTermPrices[longTermPrices.length - 1] - longTermPrices[0]) / longTermPrices[0] * 100 : 0;
  
  const shortTerm = Math.max(-100, Math.min(100, shortTermChange * 10));
  const mediumTerm = Math.max(-100, Math.min(100, mediumTermChange * 5));
  const longTerm = Math.max(-100, Math.min(100, longTermChange * 2));
  
  const overall = (shortTerm * 0.4 + mediumTerm * 0.35 + longTerm * 0.25);
  
  let divergence: MomentumScore['divergence'] = 'NONE';
  
  const priceTrend = shortTermChange > 0 ? 'UP' : 'DOWN';
  const rsiTrend = indicators.rsi > 50 ? 'UP' : 'DOWN';
  
  if (priceTrend === 'DOWN' && indicators.rsi < 30 && shortTermChange < -2) {
    divergence = 'BULLISH';
  } else if (priceTrend === 'UP' && indicators.rsi > 70 && shortTermChange > 2) {
    divergence = 'BEARISH';
  }
  
  return {
    overall: Math.round(overall),
    shortTerm: Math.round(shortTerm),
    mediumTerm: Math.round(mediumTerm),
    longTerm: Math.round(longTerm),
    divergence,
  };
}

function calculateVolatilityAdjustment(candles: Candle[], baseConfidence: number): VolatilityAdjustment {
  const prices = candles.map(c => c.close);
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * 100;
  
  let riskLevel: VolatilityAdjustment['riskLevel'];
  let confidenceMultiplier: number;
  let positionSizeMultiplier: number;
  
  if (volatility < 1) {
    riskLevel = 'LOW';
    confidenceMultiplier = 1.1;
    positionSizeMultiplier = 1.0;
  } else if (volatility < 2.5) {
    riskLevel = 'MEDIUM';
    confidenceMultiplier = 1.0;
    positionSizeMultiplier = 0.8;
  } else if (volatility < 5) {
    riskLevel = 'HIGH';
    confidenceMultiplier = 0.85;
    positionSizeMultiplier = 0.5;
  } else {
    riskLevel = 'EXTREME';
    confidenceMultiplier = 0.7;
    positionSizeMultiplier = 0.25;
  }
  
  const adjustedConfidence = Math.min(95, Math.max(20, baseConfidence * confidenceMultiplier));
  const recommendedPositionSize = Math.round(positionSizeMultiplier * 100);
  
  return {
    adjustedConfidence: Math.round(adjustedConfidence),
    riskLevel,
    volatilityPercent: Math.round(volatility * 100) / 100,
    recommendedPositionSize,
  };
}

export function calculateSignalBoost(
  asset: Asset,
  candles: Candle[],
  indicators: TechnicalIndicators,
  mlPredictions: MLPredictionResult | null,
  originalConfidence: number
): SignalBoost {
  const sentiment = analyzeSentiment(candles, indicators);
  const volumeAnalysis = analyzeVolume(candles);
  const momentum = calculateMomentumScore(candles, indicators);
  const volatilityAdjustment = calculateVolatilityAdjustment(candles, originalConfidence);
  
  let boost = 0;
  
  if (sentiment.label === 'VERY_BULLISH' || sentiment.label === 'VERY_BEARISH') {
    boost += 15;
  } else if (sentiment.label === 'BULLISH' || sentiment.label === 'BEARISH') {
    boost += 8;
  }
  
  if (volumeAnalysis.volumeTrend === 'INCREASING') {
    boost += 10;
  }
  if (volumeAnalysis.unusualActivity) {
    boost += 12;
  }
  if (Math.abs(volumeAnalysis.buyingPressure - 50) > 20) {
    boost += 8;
  }
  
  if (Math.abs(momentum.overall) > 50) {
    boost += 12;
  } else if (Math.abs(momentum.overall) > 25) {
    boost += 6;
  }
  if (momentum.divergence !== 'NONE') {
    boost += 15;
  }
  
  if (mlPredictions) {
    const { ensemble } = mlPredictions;
    if (ensemble.signalStrength === 'STRONG') {
      boost += 18;
    } else if (ensemble.signalStrength === 'MODERATE') {
      boost += 10;
    }
    if (ensemble.agreementScore > 80) {
      boost += 12;
    }
  }
  
  const boostedConfidence = Math.min(98, Math.max(25, volatilityAdjustment.adjustedConfidence + boost * 0.5));
  const boostPercent = boostedConfidence - originalConfidence;
  
  let overallSignalStrength: SignalBoost['overallSignalStrength'];
  if (boostedConfidence >= 85) {
    overallSignalStrength = 'VERY_STRONG';
  } else if (boostedConfidence >= 70) {
    overallSignalStrength = 'STRONG';
  } else if (boostedConfidence >= 55) {
    overallSignalStrength = 'MODERATE';
  } else if (boostedConfidence >= 40) {
    overallSignalStrength = 'WEAK';
  } else {
    overallSignalStrength = 'VERY_WEAK';
  }
  
  let tradingRecommendation: string;
  if (overallSignalStrength === 'VERY_STRONG') {
    tradingRecommendation = sentiment.label.includes('BULLISH') 
      ? 'Strong Buy - Multiple confirming signals'
      : sentiment.label.includes('BEARISH')
        ? 'Strong Sell - Multiple confirming signals'
        : 'Wait for clearer direction';
  } else if (overallSignalStrength === 'STRONG') {
    tradingRecommendation = sentiment.label.includes('BULLISH')
      ? 'Buy - Good entry opportunity'
      : sentiment.label.includes('BEARISH')
        ? 'Sell - Consider exit/short'
        : 'Hold - Monitor for breakout';
  } else if (overallSignalStrength === 'MODERATE') {
    tradingRecommendation = 'Proceed with caution - Use smaller position size';
  } else {
    tradingRecommendation = 'Avoid trading - Wait for stronger signals';
  }
  
  const currentPrice = candles[candles.length - 1].close;
  const atrValue = indicators.atr?.value || (currentPrice * 0.02);
  const potentialReward = atrValue * 1.5;
  const potentialRisk = atrValue * 0.75;
  const riskRewardRatio = Math.round((potentialReward / potentialRisk) * 100) / 100;
  
  return {
    originalConfidence,
    boostedConfidence: Math.round(boostedConfidence),
    boostPercent: Math.round(boostPercent),
    sentiment,
    volumeAnalysis,
    momentum,
    volatilityAdjustment,
    overallSignalStrength,
    tradingRecommendation,
    riskRewardRatio,
  };
}

export type { SignalBoost, SentimentResult, VolumeAnalysis, MomentumScore, VolatilityAdjustment };
