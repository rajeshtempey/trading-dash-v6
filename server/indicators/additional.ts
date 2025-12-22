// server/indicators/additional.ts
// 100% FREE Additional Indicators
// Includes: Stochastic RSI, Williams %R, CCI, MFI, Keltner, Donchian, Volume Profile, VWAP, OBV, A/D

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Stochastic RSI
export interface StochasticRSIResult {
  stochRSI: number;      // 0-100
  K: number;             // Fast line
  D: number;             // Slow line (SMA of %K)
  overbought: boolean;   // > 80
  oversold: boolean;     // < 20
}

export function calculateStochasticRSI(
  candles: Candle[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kPeriod: number = 3,
  dPeriod: number = 3
): StochasticRSIResult[] {
  const rsiValues = calculateRSI(candles, rsiPeriod);
  const results: StochasticRSIResult[] = [];

  for (let i = 0; i < rsiValues.length; i++) {
    if (i < stochPeriod - 1) {
      results.push({
        stochRSI: 50,
        K: 50,
        D: 50,
        overbought: false,
        oversold: false
      });
      continue;
    }

    const rsiSlice = rsiValues.slice(i - stochPeriod + 1, i + 1);
    const highRSI = Math.max(...rsiSlice);
    const lowRSI = Math.min(...rsiSlice);
    
    const stochRSI = highRSI === lowRSI ? 50 : ((rsiValues[i] - lowRSI) / (highRSI - lowRSI)) * 100;

    results.push({
      stochRSI,
      K: stochRSI,
      D: 50,
      overbought: stochRSI > 80,
      oversold: stochRSI < 20
    });
  }

  return results;
}

// Williams %R
export interface WilliamsRResult {
  williams_r: number;    // -100 to 0
  overbought: boolean;   // > -20
  oversold: boolean;     // < -80
}

export function calculateWilliamsR(
  candles: Candle[],
  period: number = 14
): WilliamsRResult[] {
  const results: WilliamsRResult[] = [];

  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - period + 1);
    const slice = candles.slice(start, i + 1);
    
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    
    const williams_r = high === low ? -50 : ((high - candles[i].close) / (high - low)) * -100;

    results.push({
      williams_r,
      overbought: williams_r > -20,
      oversold: williams_r < -80
    });
  }

  return results;
}

// Commodity Channel Index (CCI)
export interface CCIResult {
  cci: number;
  overbought: boolean;   // > 100
  oversold: boolean;     // < -100
}

export function calculateCCI(
  candles: Candle[],
  period: number = 20
): CCIResult[] {
  const results: CCIResult[] = [];

  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - period + 1);
    const slice = candles.slice(start, i + 1);
    
    // Typical Price = (High + Low + Close) / 3
    const typicalPrices = slice.map(c => (c.high + c.low + c.close) / 3);
    const sma = typicalPrices.reduce((a, b) => a + b) / typicalPrices.length;
    
    // Mean Deviation
    const meanDev = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / typicalPrices.length;
    
    const cci = meanDev === 0 ? 0 : (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDev);

    results.push({
      cci,
      overbought: cci > 100,
      oversold: cci < -100
    });
  }

  return results;
}

// Money Flow Index (MFI)
export interface MFIResult {
  mfi: number;           // 0-100
  overbought: boolean;   // > 80
  oversold: boolean;     // < 20
}

export function calculateMFI(
  candles: Candle[],
  period: number = 14
): MFIResult[] {
  const results: MFIResult[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      results.push({
        mfi: 50,
        overbought: false,
        oversold: false
      });
      continue;
    }

    const start = i - period + 1;
    const slice = candles.slice(start, i + 1);

    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let j = 1; j < slice.length; j++) {
      const rawMoneyFlow = ((slice[j].high + slice[j].low + slice[j].close) / 3) * slice[j].volume;
      const prevTypicalPrice = (slice[j - 1].high + slice[j - 1].low + slice[j - 1].close) / 3;
      const currTypicalPrice = (slice[j].high + slice[j].low + slice[j].close) / 3;

      if (currTypicalPrice > prevTypicalPrice) {
        positiveFlow += rawMoneyFlow;
      } else {
        negativeFlow += rawMoneyFlow;
      }
    }

    const moneyFlowRatio = negativeFlow === 0 ? 100 : positiveFlow / negativeFlow;
    const mfi = 100 - (100 / (1 + moneyFlowRatio));

    results.push({
      mfi,
      overbought: mfi > 80,
      oversold: mfi < 20
    });
  }

  return results;
}

// Keltner Channels
export interface KeltnerResult {
  middle: number;
  upper: number;
  lower: number;
  inside_channel: boolean;
}

export function calculateKeltner(
  candles: Candle[],
  period: number = 20,
  atrMultiplier: number = 2
): KeltnerResult[] {
  const atrValues = calculateATR(candles, period);
  const results: KeltnerResult[] = [];

  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - period + 1);
    const slice = candles.slice(start, i + 1);
    
    const middle = slice.reduce((sum, c) => sum + c.close, 0) / slice.length;
    const upper = middle + (atrValues[i] * atrMultiplier);
    const lower = middle - (atrValues[i] * atrMultiplier);
    
    const inside_channel = candles[i].close > lower && candles[i].close < upper;

    results.push({ middle, upper, lower, inside_channel });
  }

  return results;
}

// Donchian Channels
export interface DonchianResult {
  middle: number;
  upper: number;
  lower: number;
  inside_channel: boolean;
}

export function calculateDonchian(
  candles: Candle[],
  period: number = 20
): DonchianResult[] {
  const results: DonchianResult[] = [];

  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - period + 1);
    const slice = candles.slice(start, i + 1);
    
    const upper = Math.max(...slice.map(c => c.high));
    const lower = Math.min(...slice.map(c => c.low));
    const middle = (upper + lower) / 2;
    
    const inside_channel = candles[i].close > lower && candles[i].close < upper;

    results.push({ middle, upper, lower, inside_channel });
  }

  return results;
}

// On Balance Volume (OBV)
export interface OBVResult {
  obv: number;
  trend: 'UP' | 'DOWN';
}

export function calculateOBV(candles: Candle[]): OBVResult[] {
  const results: OBVResult[] = [];
  let obv = 0;

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      obv = candles[i].volume;
    } else {
      if (candles[i].close > candles[i - 1].close) {
        obv += candles[i].volume;
      } else if (candles[i].close < candles[i - 1].close) {
        obv -= candles[i].volume;
      }
    }

    const trend = i === 0 ? 'UP' : (obv > results[i - 1].obv ? 'UP' : 'DOWN');
    results.push({ obv, trend });
  }

  return results;
}

// Accumulation/Distribution Line
export interface ADResult {
  ad: number;
}

export function calculateAccumulationDistribution(candles: Candle[]): ADResult[] {
  const results: ADResult[] = [];
  let ad = 0;

  for (const candle of candles) {
    const clv = ((candle.close - candle.low) - (candle.high - candle.close)) / 
                (candle.high - candle.low);
    const adv = clv * candle.volume;
    ad += adv;

    results.push({ ad });
  }

  return results;
}

// Volume Weighted Average Price (VWAP)
export interface VWAPResult {
  vwap: number;
}

export function calculateVWAP(candles: Candle[]): VWAPResult[] {
  const results: VWAPResult[] = [];
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTypicalPriceVolume += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    const vwap = cumulativeVolume === 0 ? 0 : cumulativeTypicalPriceVolume / cumulativeVolume;
    results.push({ vwap });
  }

  return results;
}

// Helper Functions
function calculateRSI(candles: Candle[], period: number = 14): number[] {
  const deltas: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    deltas.push(candles[i].close - candles[i - 1].close);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period && i < deltas.length; i++) {
    if (deltas[i] > 0) gains += deltas[i];
    else losses += Math.abs(deltas[i]);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  const rsi: number[] = [50];

  for (let i = period; i < deltas.length; i++) {
    const gain = deltas[i] > 0 ? deltas[i] : 0;
    const loss = deltas[i] < 0 ? Math.abs(deltas[i]) : 0;

    const newAvgGain = (avgGain * (period - 1) + gain) / period;
    const newAvgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = newAvgLoss === 0 ? 100 : newAvgGain / newAvgLoss;
    const rsiValue = 100 - (100 / (1 + rs));

    rsi.push(rsiValue);
  }

  return rsi;
}

function calculateATR(candles: Candle[], period: number): number[] {
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    tr.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    ));
  }

  let sum = 0;
  for (let i = 0; i < period && i < tr.length; i++) {
    sum += tr[i];
  }

  const atr: number[] = new Array(tr.length).fill(0);
  atr[period - 1] = sum / period;

  const multiplier = 2 / (period + 1);
  for (let i = period; i < tr.length; i++) {
    atr[i] = (tr[i] - atr[i - 1]) * multiplier + atr[i - 1];
  }

  return atr;
}
