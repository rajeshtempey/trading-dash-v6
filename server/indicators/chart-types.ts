// server/indicators/chart-types.ts
// 100% FREE Chart Type Implementations
// Heiken Ashi, Renko, Line Break, Kagi, Point & Figure

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============ Heiken Ashi ============
export function calculateHeikenAshi(candles: Candle[]): Candle[] {
  const haCandles: Candle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];

    if (i === 0) {
      haCandles.push({ ...candle });
      continue;
    }

    const prevHA = haCandles[i - 1];

    // Heiken Ashi formulas
    const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
    const haOpen = (prevHA.open + prevHA.close) / 2;
    const haHigh = Math.max(candle.high, haOpen, haClose);
    const haLow = Math.min(candle.low, haOpen, haClose);

    haCandles.push({
      timestamp: candle.timestamp,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: candle.volume
    });
  }

  return haCandles;
}

// ============ Renko ============
export interface RenkoBrick {
  open: number;
  close: number;
  color: 'GREEN' | 'RED';
  timestamp: number;
  brickSize: number;
}

export function convertToRenko(
  candles: Candle[],
  brickSize: number = 10
): RenkoBrick[] {
  const bricks: RenkoBrick[] = [];
  let currentBrick: RenkoBrick | null = null;

  for (const candle of candles) {
    if (!currentBrick) {
      currentBrick = {
        open: candle.open,
        close: candle.close,
        color: candle.close > candle.open ? 'GREEN' : 'RED',
        timestamp: candle.timestamp,
        brickSize
      };
      bricks.push(currentBrick);
      continue;
    }

    const priceMove = candle.close - currentBrick.close;
    const numBricks = Math.floor(Math.abs(priceMove) / brickSize);

    if (numBricks >= 1) {
      for (let i = 0; i < numBricks; i++) {
        const direction = Math.sign(priceMove);
        const newBrick: RenkoBrick = {
          open: currentBrick.close,
          close: currentBrick.close + (brickSize * direction),
          color: direction > 0 ? 'GREEN' : 'RED',
          timestamp: candle.timestamp,
          brickSize
        };
        bricks.push(newBrick);
        currentBrick = newBrick;
      }
    }
  }

  return bricks;
}

// ============ Line Break ============
export interface LineBreakCandle {
  open: number;
  close: number;
  color: 'GREEN' | 'RED';
  timestamp: number;
  lineNumber: number;
}

export function convertToLineBreak(
  candles: Candle[],
  lines: number = 3
): LineBreakCandle[] {
  const lineBreaks: LineBreakCandle[] = [];
  const history: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const color = candle.close > candle.open ? 'GREEN' : 'RED';

    if (history.length === 0) {
      history.push(candle.close);
      lineBreaks.push({
        open: candle.open,
        close: candle.close,
        color,
        timestamp: candle.timestamp,
        lineNumber: 1
      });
      continue;
    }

    const lastClose = history[history.length - 1];
    
    if (color === (lastClose < candle.close ? 'GREEN' : 'RED')) {
      // Same direction
      history.push(candle.close);
      lineBreaks.push({
        open: candle.open,
        close: candle.close,
        color,
        timestamp: candle.timestamp,
        lineNumber: history.length
      });
    } else if (history.length >= lines) {
      // Reversal after required lines
      history.push(candle.close);
      lineBreaks.push({
        open: candle.open,
        close: candle.close,
        color,
        timestamp: candle.timestamp,
        lineNumber: 1
      });
      history.splice(0, history.length - 1);
    }
  }

  return lineBreaks;
}

// ============ Kagi ============
export interface KagiTurn {
  price: number;
  type: 'TOP' | 'BOTTOM';
  timestamp: number;
  thickness: 'THIN' | 'THICK';
}

export function convertToKagi(
  candles: Candle[],
  reversalAmount: number = 0.02
): KagiTurn[] {
  const turns: KagiTurn[] = [];
  let currentPrice = candles[0].close;
  let trend: 'UP' | 'DOWN' = 'UP';

  for (const candle of candles) {
    const reversalThreshold = currentPrice * reversalAmount;

    if (trend === 'UP') {
      if (candle.high > currentPrice) {
        currentPrice = candle.high;
      }

      if (candle.low < currentPrice - reversalThreshold) {
        const lastTurn = turns[turns.length - 1];
        const isThick = lastTurn && lastTurn.type === 'TOP' ? true : false;

        turns.push({
          price: currentPrice,
          type: 'TOP',
          timestamp: candle.timestamp,
          thickness: isThick ? 'THICK' : 'THIN'
        });

        currentPrice = candle.low;
        trend = 'DOWN';
      }
    } else {
      if (candle.low < currentPrice) {
        currentPrice = candle.low;
      }

      if (candle.high > currentPrice + reversalThreshold) {
        const lastTurn = turns[turns.length - 1];
        const isThick = lastTurn && lastTurn.type === 'BOTTOM' ? true : false;

        turns.push({
          price: currentPrice,
          type: 'BOTTOM',
          timestamp: candle.timestamp,
          thickness: isThick ? 'THICK' : 'THIN'
        });

        currentPrice = candle.high;
        trend = 'UP';
      }
    }
  }

  return turns;
}

// ============ Point & Figure ============
export interface PFBox {
  price: number;
  column: number;
  x: 'X' | 'O';  // X = up, O = down
}

export function convertToPointAndFigure(
  candles: Candle[],
  boxSize: number = 1,
  reversal: number = 3
): PFBox[] {
  const boxes: PFBox[] = [];
  let currentColumn = 0;
  let lastX: 'X' | 'O' = 'X';
  let currentPrice = candles[0].close;

  for (const candle of candles) {
    // Uptrend
    if (lastX === 'X') {
      if (candle.high >= currentPrice + boxSize) {
        const numBoxes = Math.floor((candle.high - currentPrice) / boxSize);
        for (let i = 0; i < numBoxes; i++) {
          boxes.push({
            price: currentPrice + ((i + 1) * boxSize),
            column: currentColumn,
            x: 'X'
          });
        }
        currentPrice = currentPrice + (numBoxes * boxSize);
      }

      // Check for reversal
      if (candle.low <= currentPrice - (reversal * boxSize)) {
        currentColumn++;
        currentPrice = candle.low;
        lastX = 'O';
        boxes.push({
          price: currentPrice,
          column: currentColumn,
          x: 'O'
        });
      }
    } else {
      // Downtrend
      if (candle.low <= currentPrice - boxSize) {
        const numBoxes = Math.floor((currentPrice - candle.low) / boxSize);
        for (let i = 0; i < numBoxes; i++) {
          boxes.push({
            price: currentPrice - ((i + 1) * boxSize),
            column: currentColumn,
            x: 'O'
          });
        }
        currentPrice = currentPrice - (numBoxes * boxSize);
      }

      // Check for reversal
      if (candle.high >= currentPrice + (reversal * boxSize)) {
        currentColumn++;
        currentPrice = candle.high;
        lastX = 'X';
        boxes.push({
          price: currentPrice,
          column: currentColumn,
          x: 'X'
        });
      }
    }
  }

  return boxes;
}

// ============ Hollow Candles (Variant) ============
export function createHollowCandles(candles: Candle[]): Candle[] {
  // Same as regular candles but with different rendering (open=close creates hollow effect)
  return candles.map(c => ({
    ...c,
    // Used by renderer to determine if candle is hollow
  }));
}

// ============ Baseline Chart (Variant) ============
export interface BaselineValue {
  timestamp: number;
  price: number;
  above_baseline: boolean;
}

export function createBaselineChart(
  candles: Candle[],
  baselineMA: number = 20
): BaselineValue[] {
  const baseline: BaselineValue[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - baselineMA + 1);
    const slice = candles.slice(start, i + 1);
    const maPrice = slice.reduce((sum, c) => sum + c.close, 0) / slice.length;

    baseline.push({
      timestamp: candles[i].timestamp,
      price: candles[i].close,
      above_baseline: candles[i].close > maPrice
    });
  }

  return baseline;
}

// ============ Volume Candles (Variant) ============
export interface VolumeCandle extends Candle {
  volumeColor: 'GREEN' | 'RED';
  volumeSize: number;
}

export function createVolumeCandles(candles: Candle[]): VolumeCandle[] {
  const maxVolume = Math.max(...candles.map(c => c.volume));

  return candles.map(candle => ({
    ...candle,
    volumeColor: candle.close > candle.open ? 'GREEN' : 'RED',
    volumeSize: (candle.volume / maxVolume) * 100
  }));
}

// ============ Footprint Chart ============
export interface FootprintData {
  timestamp: number;
  price: number;
  buyVolume: number;
  sellVolume: number;
  netFlow: number;
}

export function createFootprintChart(candles: Candle[]): FootprintData[] {
  const footprints: FootprintData[] = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const bodySize = Math.abs(candle.close - candle.open);
    const totalWick = (candle.high - candle.low) - bodySize;

    // Estimate buy/sell volume based on closing position and wicks
    const closeRatio = (candle.close - candle.low) / (candle.high - candle.low);
    const buyVolume = candle.volume * closeRatio;
    const sellVolume = candle.volume * (1 - closeRatio);
    const netFlow = buyVolume - sellVolume;

    footprints.push({
      timestamp: candle.timestamp,
      price: candle.close,
      buyVolume,
      sellVolume,
      netFlow
    });
  }

  return footprints;
}
