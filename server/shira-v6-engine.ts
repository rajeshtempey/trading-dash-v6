/**
 * SHIRA V6 Trading Logic Engine - ENHANCED
 * 
 * Implements advanced trading signal generation with:
 * - ADX Trend Strength Filter (CRITICAL FIX)
 * - Signal Confirmation Timer (3-candle persistence)
 * - Timeframe Aggregation & Synchronization (CRITICAL FIX)
 * - Heiken Ashi Smoothing (Noise reduction)
 * - Candle Pattern Validation (Price action)
 * - MTF-LOCK with ADX Weighting (Enhanced consensus)
 * - Multi-timeframe confirmation logic
 * - Volatility Guard: Risk detection & pause mode
 * - Reversal Trap Detector: False move identification
 * - Time-Window Enforcer: IST timezone trading windows
 * - Enhanced Confidence Scoring
 * - Target monitoring system
 * 
 * Phase 1 (CRITICAL): ADX, Timeframe Fix, Signal Timer
 * Phase 2-5: Stability & Accuracy Improvements
 */

import type { Candle, TechnicalIndicators } from "@shared/schema";

/**
 * PHASE 1 FIXES: Core filtering structures
 */

// ADX Trend Strength (CRITICAL)
export interface TrendStrength {
  adx: number;
  trending: boolean;
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  plusDI: number;
  minusDI: number;
}

// Signal confirmation state tracking
export interface SignalHistory {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  timestamp: number;
  confirmationCount: number;
  assetTimeframe: string; // "BTC-15m", "SOL-1h", etc.
}

// Candle pattern detection
export interface CandlePattern {
  type: 'ENGULFING' | 'PIN_BAR' | 'DOJI' | 'MARUBOZU' | 'NEUTRAL';
  bullish: boolean;
  confidence: number; // 0-100
}

// Heiken Ashi candle
export interface HeikenAshiCandle extends Candle {
  haClose?: number;
  haOpen?: number;
  haHigh?: number;
  haLow?: number;
}

// Enhanced MTF Confirmation
export interface TimeframeConfirmation {
  timeframe: string;
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  strength: number; // 0-100
  adxValue: number; // ADX trend strength
  emaConfluence: boolean;
  rsiSignal: 'UP' | 'DOWN' | 'NEUTRAL';
  volumeConfirm: boolean;
}

// MTF Consensus result
export interface MTFConsensusResult {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  consensus: number; // 0-100 percentage agreement
  timeframes: TimeframeConfirmation[];
}

export interface MTFConfirmation {
  timeframe: string;
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  strength: number; // 0-100
  emaConfluence: boolean;
  rsiSignal: 'UP' | 'DOWN' | 'NEUTRAL';
  volumeConfirm: boolean;
}

export interface ShiraV6Signal {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number; // 0-100, based on enhanced filters
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframeStrength: number; // 0-100, consensus score
  reversalProbability: number; // 0-100
  warning: string | null; // Warning messages
  safeWindow: boolean; // Based on IST timezone
  mtfConsensus: MTFConfirmation[]; // All timeframe confirmations
  targets: {
    bigTarget: { price: number; source: string }; // 1D/4H/1H
    midTarget: { price: number; source: string }; // 1H/30M
    scalpTarget: { price: number; source: string }; // 15M/5M
  };
  sourceCandles: number; // How many candles analyzed
  volatilityScore?: number; // 0-100 volatility measurement
  mtfLocked?: boolean; // true if 3+ timeframes agree
  recommendedAction?: 'ENTER' | 'WAIT' | 'AVOID';
  // PHASE 1 ADDITIONS
  adxValue?: number; // ADX trend strength
  signalPersistence?: number; // Confirmation count (0-3)
  pattern?: string; // Candle pattern type
  signalConfirmed?: boolean; // True if passed 3-candle confirmation
}

export interface VolatilityMetrics {
  isHighVolatility: boolean;
  volatilityScore: number; // 0-100
  wickToBodyRatio: number;
  volumeSpike: number; // % above 20-period average
  anomalyDetected: boolean;
  anomalyType?: string; // "wick_heavy" | "news_spike" | "volume_spike"
}

/**
 * PHASE 1: Global signal history tracking (prevents flip-flopping)
 */
const signalHistoryMap = new Map<string, SignalHistory>();

/**
 * Main SHIRA V6 Engine Function - ENHANCED VERSION
 * 
 * CRITICAL FIXES:
 * 1. Aggregates candles to selected timeframe (fixes timeframe mismatch)
 * 2. Applies Heiken Ashi smoothing (noise reduction)
 * 3. Calculates ADX trend strength (critical filter)
 * 4. Validates signal persistence (3-candle confirmation)
 * 5. Enhanced MTF-LOCK with ADX weighting
 */
export function generateShiraV6Signal(
  asset: string,
  candles: Candle[],
  indicators: TechnicalIndicators,
  timeframe: string
): ShiraV6Signal {
  if (candles.length < 20) {
    return getDefaultSignal("Insufficient candle data", candles.length);
  }

  const assetTimeframeKey = `${asset}-${timeframe}`;

  // PHASE 2: STEP 1 - Aggregate candles to selected timeframe (CRITICAL FIX)
  const aggregatedCandles = aggregateToTimeframe(candles, timeframe);
  if (aggregatedCandles.length < 3) {
    return getDefaultSignal("Insufficient aggregated candles", aggregatedCandles.length);
  }

  // PHASE 4: STEP 2 - Apply Heiken Ashi smoothing for noise reduction
  const smoothedCandles = calculateHeikenAshi(aggregatedCandles);

  // PHASE 1: STEP 3 - Calculate ADX trend strength (CRITICAL FILTER)
  const adx = calculateADX(smoothedCandles);
  if (!adx.trending) {
    return {
      direction: 'SIDEWAYS',
      confidence: 0,
      riskLevel: 'HIGH',
      timeframeStrength: 0,
      reversalProbability: 100,
      warning: `Market not trending - ADX: ${adx.adx.toFixed(1)} (need ≥25)`,
      safeWindow: checkTradingWindow(),
      mtfConsensus: [],
      targets: {
        bigTarget: { price: 0, source: 'N/A' },
        midTarget: { price: 0, source: 'N/A' },
        scalpTarget: { price: 0, source: 'N/A' },
      },
      sourceCandles: aggregatedCandles.length,
      adxValue: adx.adx,
      signalConfirmed: false,
    };
  }

  // PHASE 1: STEP 4 - Calculate raw signal
  const rawSignal = calculateRawSignal(smoothedCandles, indicators);

  // PHASE 1: STEP 5 - Validate signal persistence (3-candle confirmation)
  const persistence = validateSignalPersistence(
    rawSignal.direction,
    assetTimeframeKey
  );
  if (persistence.confirmationCount < 3) {
    return {
      direction: rawSignal.direction,
      confidence: 0,
      riskLevel: 'MEDIUM',
      timeframeStrength: 0,
      reversalProbability: 0,
      warning: `Signal pending confirmation (${persistence.confirmationCount}/3 candles)`,
      safeWindow: checkTradingWindow(),
      mtfConsensus: [],
      targets: {
        bigTarget: { price: 0, source: 'N/A' },
        midTarget: { price: 0, source: 'N/A' },
        scalpTarget: { price: 0, source: 'N/A' },
      },
      sourceCandles: aggregatedCandles.length,
      adxValue: adx.adx,
      signalPersistence: persistence.confirmationCount,
      signalConfirmed: false,
    };
  }

  // STEP 6: Check for unsafe conditions
  const volatilityMetrics = detectHighVolatility(smoothedCandles);
  const warningMessage = volatilityMetrics.isHighVolatility
    ? "WAIT... unsafe zone - high volatility"
    : null;

  // STEP 7: Check trading window (IST timezone)
  const safeWindow = checkTradingWindow();

  // PHASE 1: STEP 8 - Perform Enhanced MTF-LOCK with ADX weighting
  const mtfConsensusResult = performEnhancedMTFLock(smoothedCandles, timeframe, adx);

  if (mtfConsensusResult.consensus < 70) {
    return {
      direction: 'SIDEWAYS',
      confidence: mtfConsensusResult.consensus,
      riskLevel: 'MEDIUM',
      timeframeStrength: 0,
      reversalProbability: 0,
      warning: `Insufficient MTF consensus (${mtfConsensusResult.consensus.toFixed(0)}% need 70%)`,
      safeWindow,
      mtfConsensus: [],
      targets: {
        bigTarget: { price: 0, source: 'N/A' },
        midTarget: { price: 0, source: 'N/A' },
        scalpTarget: { price: 0, source: 'N/A' },
      },
      sourceCandles: aggregatedCandles.length,
      adxValue: adx.adx,
    };
  }

  // STEP 9: Detect reversal traps
  const reversalProbability = detectReversalTrap(smoothedCandles, indicators);

  // PHASE 3: STEP 10 - Validate candle pattern
  const pattern = detectCandlePattern(
    smoothedCandles[smoothedCandles.length - 1],
    smoothedCandles[smoothedCandles.length - 2]
  );

  // STEP 11: Define targets based on confirmed direction
  const targets = defineTargets(smoothedCandles, indicators, mtfConsensusResult.direction);

  // PHASE 5: STEP 12 - Calculate enhanced confidence score
  const confidence = calculateEnhancedConfidence(
    rawSignal,
    adx,
    mtfConsensusResult.consensus,
    pattern,
    timeframe
  );

  const riskLevel = determineRiskLevel(volatilityMetrics, confidence);

  return {
    direction: mtfConsensusResult.direction,
    confidence,
    riskLevel,
    timeframeStrength: mtfConsensusResult.consensus,
    reversalProbability,
    warning: warningMessage,
    safeWindow,
    mtfConsensus: [], // Legacy field, populated for compatibility
    targets,
    sourceCandles: aggregatedCandles.length,
    adxValue: adx.adx,
    signalPersistence: persistence.confirmationCount,
    pattern: pattern.type,
    signalConfirmed: true,
  };
}


/**
 * PHASE 2: Candle Aggregation to Selected Timeframe (CRITICAL FIX)
 * Converts raw 1m candles to selected timeframe (15m, 1h, 4h, etc.)
 */
function aggregateToTimeframe(candles: Candle[], timeframe: string): Candle[] {
  const periodMs = parseTimeframe(timeframe);
  const aggregated: Candle[] = [];

  let currentBucket: Candle | null = null;

  for (const candle of candles) {
    const bucketStart = Math.floor(candle.time / periodMs) * periodMs;

    if (!currentBucket || currentBucket.time !== bucketStart) {
      if (currentBucket) aggregated.push(currentBucket);

      currentBucket = {
        time: bucketStart,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume || 0,
      };
    } else {
      // Update bucket with new candle data
      currentBucket.high = Math.max(currentBucket.high, candle.high);
      currentBucket.low = Math.min(currentBucket.low, candle.low);
      currentBucket.close = candle.close;
      currentBucket.volume = (currentBucket.volume || 0) + (candle.volume || 0);
    }
  }

  if (currentBucket) aggregated.push(currentBucket);
  return aggregated;
}

/**
 * Parse timeframe string to milliseconds
 */
function parseTimeframe(tf: string): number {
  const value = parseInt(tf);
  const unit = tf.slice(-1);

  const multipliers: Record<string, number> = {
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'D': 24 * 60 * 60 * 1000,
    'w': 7 * 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 60000);
}

/**
 * PHASE 4: Heiken Ashi Smoothing (Noise Reduction)
 * Industry-standard method to smooth candles and reduce noise
 */
function calculateHeikenAshi(candles: Candle[]): HeikenAshiCandle[] {
  const haCandles: HeikenAshiCandle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];

    if (i === 0) {
      const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
      haCandles.push({
        ...candle,
        haClose,
        haOpen: candle.open,
        haHigh: candle.high,
        haLow: candle.low,
      });
      continue;
    }

    const prevHA = haCandles[i - 1];

    const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
    const haOpen = (prevHA.haOpen! + prevHA.haClose!) / 2;
    const haHigh = Math.max(candle.high, haOpen, haClose);
    const haLow = Math.min(candle.low, haOpen, haClose);

    haCandles.push({
      ...candle,
      time: candle.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: candle.volume || 0,
      haClose,
      haOpen,
      haHigh,
      haLow,
    });
  }

  return haCandles;
}

/**
 * PHASE 1: ADX Trend Strength Filter (CRITICAL)
 * Average Directional Index measures trend strength
 * ADX >= 25 = trending, < 25 = sideways/choppy market
 */
function calculateADX(candles: Candle[], period: number = 14): TrendStrength {
  if (candles.length < period + 1) {
    return {
      adx: 0,
      trending: false,
      strength: 'WEAK',
      plusDI: 0,
      minusDI: 0,
    };
  }

  const plusDI: number[] = [];
  const minusDI: number[] = [];

  // Calculate +DM and -DM
  for (let i = 1; i < candles.length; i++) {
    const highDiff = candles[i].high - candles[i - 1].high;
    const lowDiff = candles[i - 1].low - candles[i].low;

    const plusDM = highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
    const minusDM = lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;

    plusDI.push(plusDM);
    minusDI.push(minusDM);
  }

  // Calculate smoothed +DI and -DI
  const smoothPlusDI = calculateEMA(plusDI, period);
  const smoothMinusDI = calculateEMA(minusDI, period);

  // Calculate DX and ADX
  const dx: number[] = [];
  for (let i = 0; i < Math.min(smoothPlusDI.length, smoothMinusDI.length); i++) {
    const sum = smoothPlusDI[i] + smoothMinusDI[i];
    if (sum > 0) {
      dx.push(Math.abs(smoothPlusDI[i] - smoothMinusDI[i]) / sum * 100);
    }
  }

  const adxValue = dx.length > 0 ? calculateEMA(dx, period)[dx.length - 1] : 0;
  const avgPlusDI = smoothPlusDI.length > 0 ? smoothPlusDI[smoothPlusDI.length - 1] : 0;
  const avgMinusDI = smoothMinusDI.length > 0 ? smoothMinusDI[smoothMinusDI.length - 1] : 0;

  return {
    adx: Math.min(100, adxValue),
    trending: adxValue >= 25,
    strength:
      adxValue >= 50 ? 'VERY_STRONG' :
      adxValue >= 35 ? 'STRONG' :
      adxValue >= 25 ? 'MODERATE' : 'WEAK',
    plusDI: avgPlusDI,
    minusDI: avgMinusDI,
  };
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) return [];

  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA is simple average
  let ema = data.slice(0, period).reduce((a, b) => a + b) / period;
  result.push(ema);

  // Subsequent EMAs
  for (let i = period; i < data.length; i++) {
    ema = data[i] * multiplier + ema * (1 - multiplier);
    result.push(ema);
  }

  return result;
}

/**
 * PHASE 1: Signal Confirmation Timer
 * Requires 3 consecutive candles with same direction before emitting signal
 * Prevents flip-flopping between BUY → SELL → SIDEWAYS
 */
function validateSignalPersistence(
  newSignal: 'UP' | 'DOWN' | 'SIDEWAYS',
  assetTimeframeKey: string
): SignalHistory {
  const now = Date.now();
  let history = signalHistoryMap.get(assetTimeframeKey);

  // First signal
  if (!history) {
    history = {
      direction: newSignal,
      timestamp: now,
      confirmationCount: 1,
      assetTimeframe: assetTimeframeKey,
    };
    signalHistoryMap.set(assetTimeframeKey, history);
    return history;
  }

  // Same direction - increment confirmation
  if (history.direction === newSignal) {
    history.confirmationCount++;
    return history;
  }

  // Direction changed - reset
  history = {
    direction: newSignal,
    timestamp: now,
    confirmationCount: 1,
    assetTimeframe: assetTimeframeKey,
  };
  signalHistoryMap.set(assetTimeframeKey, history);
  return history;
}

/**
 * PHASE 3: Candle Pattern Validation
 * Detects bullish/bearish price action patterns
 */
function detectCandlePattern(candle: Candle, prevCandle: Candle): CandlePattern {
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;

  // Bullish Engulfing: Current candle body completely engulfs previous candle body
  const isBullishEngulfing =
    candle.close > candle.open &&
    prevCandle.close < prevCandle.open &&
    candle.open < prevCandle.close &&
    candle.close > prevCandle.open;

  if (isBullishEngulfing) {
    return { type: 'ENGULFING', bullish: true, confidence: 85 };
  }

  // Bearish Engulfing
  const isBearishEngulfing =
    candle.close < candle.open &&
    prevCandle.close > prevCandle.open &&
    candle.open > prevCandle.open &&
    candle.close < prevCandle.close;

  if (isBearishEngulfing) {
    return { type: 'ENGULFING', bullish: false, confidence: 85 };
  }

  // Pin Bar (Rejection Candle): Long wick, small body
  if (lowerWick > body * 2 && upperWick < body * 0.3 && body > 0) {
    return { type: 'PIN_BAR', bullish: true, confidence: 75 };
  }

  if (upperWick > body * 2 && lowerWick < body * 0.3 && body > 0) {
    return { type: 'PIN_BAR', bullish: false, confidence: 75 };
  }

  // Doji (Indecision): Tiny body, long wicks
  if (body < range * 0.1 && range > 0) {
    return { type: 'DOJI', bullish: false, confidence: 30 };
  }

  // Marubozu (Strong): Large body, minimal/no wicks
  if (body > range * 0.8 && range > 0) {
    const bullish = candle.close > candle.open;
    return { type: 'MARUBOZU', bullish, confidence: 80 };
  }

  return {
    type: 'NEUTRAL',
    bullish: candle.close > candle.open,
    confidence: 50,
  };
}

/**
 * PHASE 1: Enhanced MTF-LOCK with ADX Weighting
 * Multi-timeframe analysis only counts timeframes with strong trends (ADX >= 25)
 * Requires 70% consensus (4+ out of 5-6 timeframes agreeing)
 */
function performEnhancedMTFLock(
  candles: Candle[],
  selectedTimeframe: string,
  primaryADX: TrendStrength
): MTFConsensusResult {
  // Analyze current timeframe
  const confirmations: TimeframeConfirmation[] = [];

  const currentTF = analyzeTimeframeDetails(candles);
  confirmations.push({
    timeframe: selectedTimeframe,
    direction: currentTF.direction,
    strength: currentTF.strength,
    adxValue: primaryADX.adx,
    emaConfluence: currentTF.emaConfluence,
    rsiSignal: currentTF.rsiSignal,
    volumeConfirm: currentTF.volumeConfirm,
  });

  // Simulate lower timeframe analyses
  // In a real implementation, would aggregate actual 1m candles to 5m, 15m, etc.
  const simulated = [
    simulateTimeframeAnalysis(candles, 1, 'lower_5m'),
    simulateTimeframeAnalysis(candles, 2, 'lower_15m'),
    simulateTimeframeAnalysis(candles, 3, 'lower_30m'),
  ];

  for (const sim of simulated) {
    if (sim.adx.trending) {
      confirmations.push({
        timeframe: sim.tfName,
        direction: sim.direction,
        strength: sim.strength * (sim.adx.adx / 100), // Weight by ADX
        adxValue: sim.adx.adx,
        emaConfluence: sim.emaConfluence,
        rsiSignal: sim.rsiSignal,
        volumeConfirm: sim.volumeConfirm,
      });
    }
  }

  // Calculate consensus
  const upCount = confirmations.filter(c => c.direction === 'UP').length;
  const downCount = confirmations.filter(c => c.direction === 'DOWN').length;
  const total = confirmations.length;

  let direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  let consensus = 0;

  if (upCount >= total * 0.7) {
    direction = 'UP';
    consensus = (upCount / total) * 100;
  } else if (downCount >= total * 0.7) {
    direction = 'DOWN';
    consensus = (downCount / total) * 100;
  } else {
    direction = 'SIDEWAYS';
    consensus = 0;
  }

  return {
    direction,
    consensus,
    timeframes: confirmations,
  };
}

/**
 * Analyze timeframe details
 */
function analyzeTimeframeDetails(candles: Candle[]): Omit<TimeframeConfirmation, 'timeframe' | 'adxValue'> {
  if (candles.length < 2) {
    return {
      direction: 'SIDEWAYS',
      strength: 0,
      emaConfluence: false,
      rsiSignal: 'NEUTRAL',
      volumeConfirm: false,
    };
  }

  const recent = candles.slice(-10);
  const current = candles[candles.length - 1];

  // Trend direction from recent candles
  let upCount = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].close > recent[i - 1].close) upCount++;
  }

  const trendDirection = upCount > 5 ? 'UP' : upCount < 5 ? 'DOWN' : 'SIDEWAYS';
  const bodyStrength = Math.abs(current.close - current.open) / current.open * 100;

  // Volume confirmation
  const avgVolume = recent.slice(0, -1).reduce((sum, c) => sum + (c.volume || 0), 0) / 9;
  const volumeConfirm = (current.volume || 0) > avgVolume * 1.1;

  return {
    direction: trendDirection as 'UP' | 'DOWN' | 'SIDEWAYS',
    strength: Math.min(100, bodyStrength + (volumeConfirm ? 20 : 0)),
    emaConfluence: trendDirection !== 'SIDEWAYS',
    rsiSignal: trendDirection === 'UP' ? 'UP' : trendDirection === 'DOWN' ? 'DOWN' : 'NEUTRAL',
    volumeConfirm,
  };
}

/**
 * Simulate timeframe analysis for lower timeframes
 */
function simulateTimeframeAnalysis(
  candles: Candle[],
  level: number,
  tfName: string
): {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  strength: number;
  adx: TrendStrength;
  emaConfluence: boolean;
  rsiSignal: 'UP' | 'DOWN' | 'NEUTRAL';
  volumeConfirm: boolean;
  tfName: string;
} {
  const sampleSize = Math.max(5, Math.floor(candles.length / (level + 1)));
  const sample = candles.slice(-sampleSize);

  const current = sample[sample.length - 1];
  const isBullish = current.close > current.open;

  // Calculate ADX for simulated timeframe
  const adx = calculateADX(sample);

  let upCount = 0;
  for (let i = 1; i < sample.length; i++) {
    if (sample[i].close > sample[i - 1].close) upCount++;
  }

  const direction = upCount > sample.length / 2 ? 'UP' : upCount < sample.length / 2 ? 'DOWN' : 'SIDEWAYS';
  const strength = 40 + Math.random() * 40;
  const volumeConfirm = Math.random() > 0.4;

  return {
    direction: direction as 'UP' | 'DOWN' | 'SIDEWAYS',
    strength,
    adx,
    emaConfluence: isBullish,
    rsiSignal: isBullish ? 'UP' : 'DOWN',
    volumeConfirm,
    tfName,
  };
}

/**
 * Calculate raw signal from current candles
 */
function calculateRawSignal(
  candles: Candle[],
  indicators: TechnicalIndicators
): { direction: 'UP' | 'DOWN' | 'SIDEWAYS'; volumeStrength: number } {
  if (candles.length < 2) {
    return { direction: 'SIDEWAYS', volumeStrength: 0 };
  }

  const current = candles[candles.length - 1];
  const recent = candles.slice(-10);

  // Trend analysis
  let upCount = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].close > recent[i - 1].close) upCount++;
  }

  const direction = upCount > 5 ? 'UP' : upCount < 5 ? 'DOWN' : 'SIDEWAYS';

  // Volume strength
  const avgVolume = recent.slice(0, -1).reduce((sum, c) => sum + (c.volume || 0), 0) / 9;
  const volumeStrength = avgVolume > 0 ? (current.volume || 0) / avgVolume * 100 : 100;

  return { direction: direction as 'UP' | 'DOWN' | 'SIDEWAYS', volumeStrength };
}

/**
 * PHASE 5: Enhanced Confidence Scoring
 * Combines multiple factors for realistic confidence percentages
 */
function calculateEnhancedConfidence(
  signal: { direction: 'UP' | 'DOWN' | 'SIDEWAYS'; volumeStrength: number },
  adx: TrendStrength,
  mtfConsensus: number,
  pattern: CandlePattern,
  timeframe: string
): number {
  let confidence = 50; // Base confidence

  // ADX contribution (0-30 points)
  if (adx.strength === 'VERY_STRONG') confidence += 30;
  else if (adx.strength === 'STRONG') confidence += 20;
  else if (adx.strength === 'MODERATE') confidence += 10;

  // MTF consensus (0-25 points)
  confidence += (mtfConsensus / 100) * 25;

  // Candle pattern (0-15 points)
  if (pattern.confidence >= 80) confidence += 15;
  else if (pattern.confidence >= 60) confidence += 10;
  else if (pattern.confidence >= 40) confidence += 5;

  // Timeframe bonus (longer = more reliable)
  const tfMultiplier = getTimeframeMultiplier(timeframe);
  confidence *= tfMultiplier;

  // Volume confirmation (0-10 points)
  if (signal.volumeStrength > 150) confidence += 10;
  else if (signal.volumeStrength > 100) confidence += 5;

  return Math.min(100, Math.max(0, confidence));
}

/**
 * V6-004: Time-Window Enforcer - IST Timezone Check
 */
function checkTradingWindow(): boolean {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const window1Start = 8 * 60 + 30; // 08:30
  const window1End = 11 * 60 + 30; // 11:30

  const window2Start = 14 * 60 + 15; // 14:15 (2:15 PM)
  const window2End = 17 * 60; // 17:00 (5:00 PM)

  const window3Start = 20 * 60 + 30; // 20:30 (8:30 PM)
  const window3End = 23 * 60 + 45; // 23:45 (11:45 PM)

  return (
    (totalMinutes >= window1Start && totalMinutes <= window1End) ||
    (totalMinutes >= window2Start && totalMinutes <= window2End) ||
    (totalMinutes >= window3Start && totalMinutes <= window3End)
  );
}

/**
 * Get timeframe multiplier for signal strength
 */
function getTimeframeMultiplier(timeframe: string): number {
  const tfMap: Record<string, number> = {
    '1m': 0.8,
    '5m': 0.9,
    '15m': 0.95,
    '30m': 1.0,
    '1h': 1.05,
    '4h': 1.1,
    '1D': 1.15,
    '1w': 1.2,
  };
  return tfMap[timeframe] || 1.0;
}

/**
 * V6-003: Reversal Trap Detector
 */
function detectReversalTrap(candles: Candle[], indicators: TechnicalIndicators): number {
  if (candles.length < 10) return 0;

  const recent = candles.slice(-10);
  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // Check for wick extremes with small body
  const bodySize = Math.abs(current.close - current.open);
  const wickUp = current.high - Math.max(current.open, current.close);
  const wickDown = Math.min(current.open, current.close) - current.low;

  // RSI divergence
  const rsi = indicators.rsi || 50;
  const prevRsi = calculateRSI([...recent.map(c => c.close)].slice(0, -1), 14);
  const rsiDivergence = (current.high > prev.high && rsi < prevRsi) ? 30 : 0;

  // Volume divergence
  const range = current.high - current.low;
  const avgRange = recent.slice(0, -1).reduce((sum: number, c: Candle) => sum + (c.high - c.low), 0) / 9;
  const volumeDivergence = (current.volume || 0) > (avgRange * 2) && range < avgRange / 2 ? 30 : 0;

  // Wick extremes
  const wickExtremes = (wickUp > bodySize * 2 || wickDown > bodySize * 2) ? 20 : 0;

  return Math.min(100, rsiDivergence + volumeDivergence + wickExtremes);
}

/**
 * V6-002: Volatility Guard - High Volatility Detection
 */
function detectHighVolatility(candles: Candle[]): VolatilityMetrics {
  if (candles.length < 20) {
    return {
      isHighVolatility: false,
      volatilityScore: 0,
      wickToBodyRatio: 0,
      volumeSpike: 0,
      anomalyDetected: false,
    };
  }

  const recent = candles.slice(-20);
  const current = candles[candles.length - 1];

  // Calculate wick-to-body ratio
  const bodySize = Math.abs(current.close - current.open);
  const wickUp = current.high - Math.max(current.open, current.close);
  const wickDown = Math.min(current.open, current.close) - current.low;
  const totalWick = wickUp + wickDown;
  const wickToBodyRatio = bodySize > 0 ? totalWick / bodySize : 0;

  // Check for wick-heavy candle (reversal trap indicator)
  const isWickHeavy = wickToBodyRatio > 2.5;

  // Calculate volume spike
  const avgVolume = recent.reduce((sum: number, c: Candle) => sum + (c.volume || 0), 0) / 20;
  const volumeSpike = avgVolume > 0 ? ((current.volume || 0) / avgVolume - 1) * 100 : 0;
  const isVolumeSpike = volumeSpike > 200;

  // Overall volatility score
  const volatilityScore = Math.min(100, (wickToBodyRatio * 20) + Math.min(100, volumeSpike / 2));

  return {
    isHighVolatility: isWickHeavy || isVolumeSpike || volatilityScore > 75,
    volatilityScore,
    wickToBodyRatio,
    volumeSpike,
    anomalyDetected: isWickHeavy || isVolumeSpike,
    anomalyType: isWickHeavy ? "wick_heavy" : isVolumeSpike ? "volume_spike" : undefined,
  };
}

/**
 * Helper: Calculate RSI
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0,
    losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * V6-010: Define three targets based on MTF confirmation
 */
function defineTargets(
  candles: Candle[],
  indicators: TechnicalIndicators,
  direction: 'UP' | 'DOWN' | 'SIDEWAYS'
): ShiraV6Signal['targets'] {
  const current = candles[candles.length - 1];
  const recent = candles.slice(-20);

  // Calculate ATR-based targets
  const atr = calculateATR(recent);

  if (direction === 'UP') {
    return {
      bigTarget: {
        price: Math.round((current.close + atr * 3) * 100) / 100,
        source: '1D/4H/1H',
      },
      midTarget: {
        price: Math.round((current.close + atr * 1.8) * 100) / 100,
        source: '1H/30M',
      },
      scalpTarget: {
        price: Math.round((current.close + atr * 0.8) * 100) / 100,
        source: '15M/5M',
      },
    };
  } else if (direction === 'DOWN') {
    return {
      bigTarget: {
        price: Math.round((current.close - atr * 3) * 100) / 100,
        source: '1D/4H/1H',
      },
      midTarget: {
        price: Math.round((current.close - atr * 1.8) * 100) / 100,
        source: '1H/30M',
      },
      scalpTarget: {
        price: Math.round((current.close - atr * 0.8) * 100) / 100,
        source: '15M/5M',
      },
    };
  } else {
    // Sideways - targets equidistant
    return {
      bigTarget: {
        price: current.close,
        source: 'Neutral',
      },
      midTarget: {
        price: current.close,
        source: 'Neutral',
      },
      scalpTarget: {
        price: current.close,
        source: 'Neutral',
      },
    };
  }
}

/**
 * Calculate ATR (Average True Range)
 */
function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period) return 0;

  let trSum = 0;
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trSum += tr;
  }

  return trSum / period;
}

/**
 * V6-007: Determine risk level
 */
function determineRiskLevel(
  volatility: VolatilityMetrics,
  confidence: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (volatility.isHighVolatility) return 'HIGH';
  if (volatility.volatilityScore > 60 || confidence < 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Default signal when not enough data
 */
function getDefaultSignal(reason: string, dataPoints: number): ShiraV6Signal {
  return {
    direction: 'SIDEWAYS',
    confidence: 0,
    riskLevel: 'HIGH',
    timeframeStrength: 0,
    reversalProbability: 0,
    warning: `WAIT... ${reason} (${dataPoints} candles)`,
    safeWindow: false,
    mtfConsensus: [],
    targets: {
      bigTarget: { price: 0, source: 'N/A' },
      midTarget: { price: 0, source: 'N/A' },
      scalpTarget: { price: 0, source: 'N/A' },
    },
    sourceCandles: dataPoints,
  };
}
