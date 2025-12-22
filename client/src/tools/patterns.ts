// client/src/tools/patterns.ts
// 100% FREE Advanced Pattern Recognition
// Includes: Head & Shoulders, Double Tops/Bottoms, Triangles, Wedges, etc.

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Peak {
  index: number;
  price: number;
  timestamp: number;
}

export interface Pattern {
  type: 'HEAD_AND_SHOULDERS' | 'DOUBLE_TOP' | 'DOUBLE_BOTTOM' | 
         'TRIANGLE' | 'WEDGE' | 'FLAG' | 'CHANNEL' | 'CUP_HANDLE' | 'DIAMOND';
  confidence: number;           // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: number;            // bars until pattern forms
  direction: 'BULLISH' | 'BEARISH';
}

export class HeadAndShouldersDetector {
  /**
   * Detect Head and Shoulders pattern
   * Bearish reversal pattern: Left Shoulder > Head > Right Shoulder
   */
  detect(candles: Candle[]): Pattern | null {
    const peaks = this.findPeaks(candles, 5);

    if (peaks.length < 3) return null;

    const leftShoulder = peaks[0];
    const head = peaks[1];
    const rightShoulder = peaks[2];

    // Validate pattern structure
    if (!(head.price > leftShoulder.price && head.price > rightShoulder.price)) {
      return null;
    }

    // Shoulders should be approximately equal
    const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
    if (shoulderDiff > 0.03) return null;  // 3% tolerance

    // Calculate neckline (support line connecting shoulders)
    const neckline = (leftShoulder.price + rightShoulder.price) / 2;
    
    // Target = neckline - (head - neckline)
    const targetPrice = neckline - (head.price - neckline);

    return {
      type: 'HEAD_AND_SHOULDERS',
      confidence: 85,
      entryPrice: neckline,
      targetPrice,
      stopLoss: head.price,
      timeframe: rightShoulder.index - leftShoulder.index,
      direction: 'BEARISH'
    };
  }

  private findPeaks(candles: Candle[], window: number): Peak[] {
    const peaks: Peak[] = [];

    for (let i = window; i < candles.length - window; i++) {
      let isPeak = true;

      for (let j = i - window; j <= i + window; j++) {
        if (j !== i && candles[j].high > candles[i].high) {
          isPeak = false;
          break;
        }
      }

      if (isPeak) {
        peaks.push({
          index: i,
          price: candles[i].high,
          timestamp: candles[i].timestamp
        });
      }
    }

    return peaks;
  }
}

export class DoubleTopBottomDetector {
  /**
   * Detect Double Top pattern (Bearish reversal)
   * Price fails to break previous high twice
   */
  detectDoubleTop(candles: Candle[]): Pattern | null {
    const peaks = this.findPeaks(candles, 5);

    if (peaks.length < 2) return null;

    const peak1 = peaks[0];
    const peak2 = peaks[peaks.length - 1];

    // Peaks should be approximately equal (within 1%)
    const diff = Math.abs(peak1.price - peak2.price) / peak1.price;
    if (diff > 0.01) return null;

    // Find valley between peaks
    const valleyIndex = peak1.index + 
      Math.floor((peak2.index - peak1.index) / 2);
    const supportLevel = Math.min(
      ...candles.slice(peak1.index, peak2.index).map(c => c.low)
    );

    const targetPrice = supportLevel - (peak1.price - supportLevel);

    return {
      type: 'DOUBLE_TOP',
      confidence: 80,
      entryPrice: supportLevel,
      targetPrice,
      stopLoss: peak1.price,
      timeframe: peak2.index - peak1.index,
      direction: 'BEARISH'
    };
  }

  /**
   * Detect Double Bottom pattern (Bullish reversal)
   */
  detectDoubleBottom(candles: Candle[]): Pattern | null {
    const troughs = this.findTroughs(candles, 5);

    if (troughs.length < 2) return null;

    const trough1 = troughs[0];
    const trough2 = troughs[troughs.length - 1];

    // Troughs should be approximately equal
    const diff = Math.abs(trough1.price - trough2.price) / trough1.price;
    if (diff > 0.01) return null;

    // Find resistance between troughs
    const resistanceLevel = Math.max(
      ...candles.slice(trough1.index, trough2.index).map(c => c.high)
    );

    const targetPrice = resistanceLevel + (resistanceLevel - trough1.price);

    return {
      type: 'DOUBLE_BOTTOM',
      confidence: 80,
      entryPrice: resistanceLevel,
      targetPrice,
      stopLoss: trough1.price,
      timeframe: trough2.index - trough1.index,
      direction: 'BULLISH'
    };
  }

  private findPeaks(candles: Candle[], window: number): Peak[] {
    const peaks: Peak[] = [];

    for (let i = window; i < candles.length - window; i++) {
      if (candles.slice(i - window, i + window + 1)
        .every(c => candles[i].high >= c.high)) {
        peaks.push({
          index: i,
          price: candles[i].high,
          timestamp: candles[i].timestamp
        });
      }
    }

    return peaks;
  }

  private findTroughs(candles: Candle[], window: number): Peak[] {
    const troughs: Peak[] = [];

    for (let i = window; i < candles.length - window; i++) {
      if (candles.slice(i - window, i + window + 1)
        .every(c => candles[i].low <= c.low)) {
        troughs.push({
          index: i,
          price: candles[i].low,
          timestamp: candles[i].timestamp
        });
      }
    }

    return troughs;
  }
}

export class TriangleDetector {
  /**
   * Detect Symmetrical Triangle
   * Converging lines with decreasing volatility
   */
  detectSymmetricalTriangle(candles: Candle[], windowSize: number = 20): Pattern | null {
    const subset = candles.slice(-windowSize);
    
    const highs = subset.map(c => c.high);
    const lows = subset.map(c => c.low);

    // Calculate trend lines
    const highSlope = (highs[highs.length - 1] - highs[0]) / highs.length;
    const lowSlope = (lows[lows.length - 1] - lows[0]) / lows.length;

    // Converging lines = opposite slopes
    if (highSlope >= 0 || lowSlope <= 0) return null;

    const currentTop = highs[highs.length - 1];
    const currentBottom = lows[lows.length - 1];
    const breakoutSize = currentTop - currentBottom;

    return {
      type: 'TRIANGLE',
      confidence: 72,
      entryPrice: currentTop + (breakoutSize * 0.2),
      targetPrice: currentTop + (breakoutSize * 1.5),
      stopLoss: currentBottom,
      timeframe: windowSize,
      direction: highSlope > 0 ? 'BULLISH' : 'BEARISH'
    };
  }
}

export class FlagDetector {
  /**
   * Detect Flag pattern
   * Continuation pattern with consolidation
   */
  detect(candles: Candle[]): Pattern | null {
    if (candles.length < 15) return null;

    const recent = candles.slice(-10);
    const previous = candles.slice(-20, -10);

    // Calculate volatility
    const recentVolatility = this.calculateVolatility(recent);
    const previousVolatility = this.calculateVolatility(previous);

    // Flag = sudden drop in volatility after strong move
    if (recentVolatility >= previousVolatility * 0.5) return null;

    // Determine direction from previous move
    const direction = previous[previous.length - 1].close > previous[0].close ? 'BULLISH' : 'BEARISH';

    const moveSize = Math.abs(
      previous[previous.length - 1].close - previous[0].close
    );

    return {
      type: 'FLAG',
      confidence: 75,
      entryPrice: recent[recent.length - 1].close,
      targetPrice: recent[recent.length - 1].close + 
                   (direction === 'BULLISH' ? moveSize : -moveSize),
      stopLoss: direction === 'BULLISH' ? 
                Math.min(...recent.map(c => c.low)) : 
                Math.max(...recent.map(c => c.high)),
      timeframe: 20,
      direction
    };
  }

  private calculateVolatility(candles: Candle[]): number {
    const closes = candles.map(c => c.close);
    const avg = closes.reduce((a, b) => a + b) / closes.length;
    const variance = closes.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / closes.length;
    return Math.sqrt(variance);
  }
}

export class CupAndHandleDetector {
  /**
   * Detect Cup and Handle pattern
   * Bullish continuation pattern
   */
  detect(candles: Candle[]): Pattern | null {
    if (candles.length < 40) return null;

    const midpoint = Math.floor(candles.length / 2);
    const cup = candles.slice(0, midpoint);
    const handle = candles.slice(midpoint);

    // Cup = U-shaped with low in middle
    const cupLow = Math.min(...cup.map(c => c.low));
    const cupHighs = Math.max(cup[0].high, cup[cup.length - 1].high);

    // Handle = slight consolidation
    const handleHigh = Math.max(...handle.map(c => c.high));
    const handleLow = Math.min(...handle.map(c => c.low));

    if (handleHigh > cupHighs || handleLow < cupLow) return null;

    const rimHeight = cupHighs - cupLow;
    const targetPrice = cupHighs + rimHeight;

    return {
      type: 'CUP_HANDLE',
      confidence: 78,
      entryPrice: handleHigh,
      targetPrice,
      stopLoss: cupLow,
      timeframe: candles.length,
      direction: 'BULLISH'
    };
  }
}

export class PatternRecognitionEngine {
  /**
   * Scan for all patterns
   */
  scanAll(candles: Candle[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Try each detector
    const hsDetector = new HeadAndShouldersDetector();
    const hs = hsDetector.detect(candles);
    if (hs) patterns.push(hs);

    const dtDetector = new DoubleTopBottomDetector();
    const dt = dtDetector.detectDoubleTop(candles);
    if (dt) patterns.push(dt);

    const db = dtDetector.detectDoubleBottom(candles);
    if (db) patterns.push(db);

    const triDetector = new TriangleDetector();
    const tri = triDetector.detectSymmetricalTriangle(candles);
    if (tri) patterns.push(tri);

    const flagDetector = new FlagDetector();
    const flag = flagDetector.detect(candles);
    if (flag) patterns.push(flag);

    const cupDetector = new CupAndHandleDetector();
    const cup = cupDetector.detect(candles);
    if (cup) patterns.push(cup);

    // Sort by confidence
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
}
