import type { 
  Candle, 
  TechnicalIndicators, 
  MarketCondition, 
  SignalMarker,
  Asset,
  BollingerBands,
  StochasticRSI,
  ATR,
} from "@shared/schema";

// Real prices from CoinGecko API (cached and updated periodically)
let ASSET_PRICES: Record<Asset, number> = {
  SOL: 124.34,
  BTC: 85152,
  ETH: 2744.35,
  XAU: 2650,
};

// Fetch real prices from CoinGecko API
export async function updateRealPrices() {
  try {
    const ids = ['solana', 'bitcoin', 'ethereum'];
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
    );
    const data = await response.json();
    
    if (data.solana?.usd) ASSET_PRICES.SOL = data.solana.usd;
    if (data.bitcoin?.usd) ASSET_PRICES.BTC = data.bitcoin.usd;
    if (data.ethereum?.usd) ASSET_PRICES.ETH = data.ethereum.usd;
    
    console.log('✓ Real-time prices updated:', ASSET_PRICES);
  } catch (error) {
    console.error('Failed to fetch real prices:', error);
  }
}

// Fetch gold price
export async function updateGoldPrice() {
  try {
    const response = await fetch('https://metals-api.com/api/latest?base=USD&symbols=XAU');
    const data = await response.json();
    if (data.rates?.XAU) {
      ASSET_PRICES.XAU = 1 / data.rates.XAU;
    }
  } catch (error) {
    console.log('Gold price fetch failed (using cached price)');
  }
}

updateRealPrices();
updateGoldPrice();
setInterval(updateRealPrices, 30000);
setInterval(updateGoldPrice, 300000);

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  const macdValues = prices.slice(-9).map(() => macd);
  const signal = calculateEMA(macdValues, 9);
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

export function calculateBollingerBands(prices: number[], period: number = 20, stdDevs: number = 2): BollingerBands {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0 };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDevs * stdDev;
  const lower = middle - stdDevs * stdDev;
  const bandwidth = ((upper - lower) / middle) * 100;
  const currentPrice = prices[prices.length - 1];
  const percentB = (currentPrice - lower) / (upper - lower);

  return { upper, middle, lower, bandwidth, percentB };
}

export function calculateStochasticRSI(prices: number[], period: number = 14, smoothK: number = 3, smoothD: number = 3): StochasticRSI {
  const rsiValues: number[] = [];
  
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(i - period, i);
    rsiValues.push(calculateRSI(slice, 14));
  }

  if (rsiValues.length < smoothK) {
    return { fastK: 50, fastD: 50, slowK: 50, slowD: 50 };
  }

  const minRSI = Math.min(...rsiValues.slice(-smoothK));
  const maxRSI = Math.max(...rsiValues.slice(-smoothK));
  const fastK = maxRSI === minRSI ? 50 : ((rsiValues[rsiValues.length - 1] - minRSI) / (maxRSI - minRSI)) * 100;
  const fastD = (rsiValues.slice(-smoothD).reduce((a, b) => a + b) / smoothD);
  const slowK = fastK;
  const slowD = fastD;

  return { fastK, fastD, slowK, slowD };
}

export function calculateATR(candles: Candle[], period: number = 14): ATR {
  if (candles.length < period) {
    return { value: 0, pips: 0 };
  }

  const trValues: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trValues.push(tr);
  }

  const atr = trValues.slice(-period).reduce((a, b) => a + b) / period;
  const pips = atr;

  return { value: atr, pips };
}

export function calculateVolumeProfile(candles: Candle[], bins: number = 10) {
  if (candles.length === 0) return [];

  const minPrice = Math.min(...candles.map(c => c.low));
  const maxPrice = Math.max(...candles.map(c => c.high));
  const binSize = (maxPrice - minPrice) / bins;

  const profile = new Map<number, number>();

  for (const candle of candles) {
    const binIndex = Math.floor((candle.close - minPrice) / binSize);
    const binPrice = minPrice + binIndex * binSize;
    profile.set(binPrice, (profile.get(binPrice) || 0) + candle.volume);
  }

  const maxVolume = Math.max(...Array.from(profile.values()));
  const poc = Array.from(profile.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

  return Array.from(profile.entries()).map(([price, volume]) => ({
    priceLevel: price,
    volume,
    poc: price === poc,
  }));
}

// Calculate full historical MACD series (returns array of MACD values for each candle)
export function calculateMACDSeries(candles: Candle[]): Array<{ time: number; macd: number; signal: number; histogram: number }> {
  if (candles.length < 26) return [];
  
  const closes = candles.map(c => c.close);
  const macdValues: number[] = [];
  
  // Calculate MACD line for each point starting from index 25 (need 26 prices for EMA26)
  for (let i = 25; i < closes.length; i++) {
    const ema12 = calculateEMA(closes.slice(0, i + 1), 12);
    const ema26 = calculateEMA(closes.slice(0, i + 1), 26);
    macdValues.push(ema12 - ema26);
  }
  
  // Calculate signal line (9-period EMA of MACD values) starting from index 33 (26 + 9 - 1)
  const signalValues: number[] = [];
  for (let i = 8; i < macdValues.length; i++) {
    const signal = calculateEMA(macdValues.slice(0, i + 1), 9);
    signalValues.push(signal);
  }
  
  // Build result array starting from where we have all three values (index 33 of original)
  const result: Array<{ time: number; macd: number; signal: number; histogram: number }> = [];
  for (let i = 8; i < macdValues.length; i++) {
    const candleIndex = i + 25;
    if (candleIndex < candles.length) {
      result.push({
        time: candles[candleIndex].time,
        macd: macdValues[i],
        signal: signalValues[i - 8],
        histogram: macdValues[i] - signalValues[i - 8],
      });
    }
  }
  
  return result;
}

// Calculate full historical RSI series
export function calculateRSISeries(candles: Candle[], period: number = 14): Array<{ time: number; value: number }> {
  if (candles.length < period + 1) return [];
  
  const closes = candles.map(c => c.close);
  const result: Array<{ time: number; value: number }> = [];
  
  for (let i = period; i < closes.length; i++) {
    const slice = closes.slice(0, i + 1);
    const rsi = calculateRSI(slice, period);
    result.push({
      time: candles[i].time,
      value: rsi,
    });
  }
  
  return result;
}

// FX rates cache (updated periodically)
let FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  INR: 83.12,
};

// Fetch real FX rates
export async function updateFXRates() {
  try {
    // Using exchangerate-api.com free tier (1500 req/month)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    if (data.rates) {
      FX_RATES = {
        USD: 1,
        EUR: data.rates.EUR || FX_RATES.EUR,
        GBP: data.rates.GBP || FX_RATES.GBP,
        JPY: data.rates.JPY || FX_RATES.JPY,
        AUD: data.rates.AUD || FX_RATES.AUD,
        CAD: data.rates.CAD || FX_RATES.CAD,
        CHF: data.rates.CHF || FX_RATES.CHF,
        INR: data.rates.INR || FX_RATES.INR,
      };
      console.log('✓ FX rates updated:', FX_RATES);
    }
  } catch (error) {
    console.log('FX rates fetch failed (using cached rates)', error instanceof Error ? error.message : '');
  }
}

// Convert price from USD to target currency
export function convertPrice(priceUSD: number, targetCurrency: string = 'USD'): number {
  const rate = FX_RATES[targetCurrency] || 1;
  return priceUSD * rate;
}

// Initialize FX rate updates every 6 hours
updateFXRates();
setInterval(updateFXRates, 6 * 60 * 60 * 1000);

export function generateIndicators(candles: Candle[]): TechnicalIndicators {
  const closes = candles.map(c => c.close);
  const price = closes[closes.length - 1] || 0;
  
  const ema8 = calculateEMA(closes, 8);
  const ema34 = calculateEMA(closes, 34);
  const rsi = calculateRSI(closes, 14);
  const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(closes);
  
  const recentCandles = candles.slice(-20);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const volatility = price > 0 ? ((maxHigh - minLow) / price) * 100 : 0;
  
  const trendStrength = price > 0 ? Math.abs((ema8 - ema34) / price) * 1000 : 0;
  
  // Advanced indicators
  const bollingerBands = calculateBollingerBands(closes);
  const stochasticRsi = calculateStochasticRSI(closes);
  const atr = calculateATR(candles);
  const volumeProfile = calculateVolumeProfile(candles, 8);
  
  // Calculate historical MACD and RSI series (only if we have enough data)
  const macdSeries = candles.length >= 34 ? calculateMACDSeries(candles) : undefined;
  const rsiSeries = candles.length >= 15 ? calculateRSISeries(candles) : undefined;
  
  return {
    ema8,
    ema34,
    rsi,
    rsi14: rsi,
    macd,
    macdSignal,
    macdHistogram,
    volume: candles[candles.length - 1]?.volume || 0,
    volatility,
    trendStrength: Math.min(100, trendStrength),
    support: minLow,
    resistance: maxHigh,
    bollingerBands,
    stochasticRsi,
    atr,
    volumeProfile,
    macdSeries,
    rsiSeries,
  };
}

export function generateCondition(indicators: TechnicalIndicators): MarketCondition {
  const { ema8, ema34, rsi, macd, trendStrength, bollingerBands, stochasticRsi } = indicators;
  
  let condition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  let recommendedAction: 'BUY' | 'SELL' | 'HOLD';
  let reasoning: string;
  let holdingTime: string;
  
  // Enhanced logic with advanced indicators
  const bollingerSignal = bollingerBands ? 
    (rsi < 30 && bollingerBands.percentB < 0.2 ? 'BULLISH' : 
     rsi > 70 && bollingerBands.percentB > 0.8 ? 'BEARISH' : 'NEUTRAL') : 'NEUTRAL';
  
  const stochasticSignal = stochasticRsi ? 
    (stochasticRsi.fastK < 20 && stochasticRsi.fastD < 20 ? 'BULLISH' :
     stochasticRsi.fastK > 80 && stochasticRsi.fastD > 80 ? 'BEARISH' : 'NEUTRAL') : 'NEUTRAL';

  if (ema8 > ema34 && rsi < 70 && macd > 0 && bollingerSignal !== 'BEARISH' && stochasticSignal !== 'BEARISH') {
    condition = 'BULLISH';
    recommendedAction = 'BUY';
    reasoning = `EMA ${ema8 > ema34 ? '✓' : '✗'}, RSI ${rsi < 70 ? '✓' : '✗'}, MACD ${macd > 0 ? '✓' : '✗'}, Bollinger ${bollingerSignal} - Strong uptrend.`;
    holdingTime = trendStrength > 50 ? '4h-1d' : '1h-4h';
  } else if (ema8 < ema34 && rsi > 30 && macd < 0 && bollingerSignal !== 'BULLISH' && stochasticSignal !== 'BULLISH') {
    condition = 'BEARISH';
    recommendedAction = 'SELL';
    reasoning = `EMA ${ema8 < ema34 ? '✓' : '✗'}, RSI ${rsi > 30 ? '✓' : '✗'}, MACD ${macd < 0 ? '✓' : '✗'}, Bollinger ${bollingerSignal} - Downtrend.`;
    holdingTime = trendStrength > 50 ? '4h-1d' : '1h-4h';
  } else {
    condition = 'SIDEWAYS';
    recommendedAction = 'HOLD';
    reasoning = `Mixed signals. Bollinger ${bollingerSignal}, Stochastic ${stochasticSignal}. Wait for breakout.`;
    holdingTime = 'Wait for breakout';
  }
  
  // Calculate strength as direct trendStrength percentage (already capped at 100 in generateIndicators)
  // This preserves the full range from 0-100 without collapsing values
  return {
    condition,
    strength: Math.round(trendStrength),
    recommendedAction,
    holdingTimeRecommendation: holdingTime,
    reasoning,
  };
}

export function generateSignal(
  asset: Asset, 
  candles: Candle[], 
  indicators: TechnicalIndicators,
  currency: string = 'USD'
): SignalMarker | null {
  if (candles.length < 5) return null;
  
  const lastCandle = candles[candles.length - 1];
  const { ema8, ema34, rsi, macd, bollingerBands, stochasticRsi, atr } = indicators;
  
  // Calculate confluence score based on multiple indicators
  let bullishCount = 0;
  let bearishCount = 0;
  const totalIndicators = 5;
  
  // 1. EMA Trend
  if (ema8 > ema34) bullishCount++;
  else if (ema8 < ema34) bearishCount++;
  
  // 2. RSI Momentum (more relaxed thresholds)
  if (rsi < 45) bullishCount++; // Room to grow
  else if (rsi > 55) bearishCount++; // Room to fall
  
  // 3. MACD Direction
  if (macd > 0) bullishCount++;
  else if (macd < 0) bearishCount++;
  
  // 4. Bollinger Bands position (relaxed thresholds)
  if (bollingerBands) {
    if (bollingerBands.percentB < 0.4) bullishCount++; // Near lower band
    else if (bollingerBands.percentB > 0.6) bearishCount++; // Near upper band
  }
  
  // 5. Stochastic RSI (relaxed thresholds)
  if (stochasticRsi) {
    if (stochasticRsi.fastK < 40) bullishCount++;
    else if (stochasticRsi.fastK > 60) bearishCount++;
  }
  
  // Determine signal based on indicator agreement
  const maxCount = Math.max(bullishCount, bearishCount);
  const confluenceScore = (maxCount / totalIndicators) * 100;
  
  // Generate signal if at least 2/5 indicators agree (40% confluence)
  if (confluenceScore < 40) return null;
  
  let type: 'BUY' | 'SELL' | 'SIDEWAYS';
  let holdingTime: string;
  
  if (bullishCount > bearishCount && bullishCount >= 2) {
    type = 'BUY';
    holdingTime = bullishCount >= 4 ? '1h-4h' : bullishCount >= 3 ? '30m-1h' : '15m-30m';
  } else if (bearishCount > bullishCount && bearishCount >= 2) {
    type = 'SELL';
    holdingTime = bearishCount >= 4 ? '1h-4h' : bearishCount >= 3 ? '30m-1h' : '15m-30m';
  } else {
    type = 'SIDEWAYS';
    holdingTime = 'Wait for breakout';
  }
  
  // Calculate TP/SL based on ATR (Average True Range)
  const price = lastCandle.close;
  const atrValue = atr?.value || (lastCandle.high - lastCandle.low);
  const tpPercent = (atrValue / price) * 1.5; // TP at 1.5 ATR
  const slPercent = (atrValue / price) * 0.75; // SL at 0.75 ATR
  
  // Calculate signal size in target currency based on ATR
  const signalSizeUSD = atrValue * Math.max(2, confluenceScore / 25);
  const signalSize = convertPrice(signalSizeUSD, currency);
  
  // Convert price levels to target currency
  const convertedPrice = convertPrice(price, currency);
  const convertedTP = convertPrice(
    type === 'BUY' ? price * (1 + tpPercent) : price * (1 - tpPercent),
    currency
  );
  const convertedSL = convertPrice(
    type === 'BUY' ? price * (1 - slPercent) : price * (1 + slPercent),
    currency
  );
  
  return {
    time: lastCandle.time,
    price: convertedPrice,
    type,
    label: `${type} Signal - ${asset} (${Math.round(confluenceScore)}% confluence)`,
    holdingTime,
    confidence: Math.round(confluenceScore),
    takeProfit: convertedTP,
    stopLoss: convertedSL,
    size: signalSize,
    currency,
  };
}

export function generateCandles(asset: Asset, count: number = 100): Candle[] {
  const candles: Candle[] = [];
  const realPrice = ASSET_PRICES[asset];
  const now = Math.floor(Date.now() / 1000);
  const interval = 60;
  
  let price = realPrice * (0.98 + Math.random() * 0.04);
  const priceChange = (realPrice - price) / count;
  
  for (let i = count; i >= 0; i--) {
    const time = now - (i * interval);
    const volatilityFactor = i / count;
    const volatility = realPrice * 0.002 * volatilityFactor;
    const change = priceChange + (Math.random() - 0.5) * volatility * 2;
    
    const open = price;
    price = open + change;
    const high = Math.max(open, price) + Math.random() * volatility * 0.5;
    const low = Math.min(open, price) - Math.random() * volatility * 0.5;
    const close = price;
    const volume = Math.floor(100000 + Math.random() * 500000);
    
    candles.push({ time, open, high, low, close, volume });
  }
  
  const lastCandle = candles[candles.length - 1];
  lastCandle.close = realPrice;
  lastCandle.high = Math.max(lastCandle.high, realPrice);
  lastCandle.low = Math.min(lastCandle.low, realPrice);
  
  return candles;
}

export function updateCandle(candles: Candle[], asset: Asset): Candle[] {
  if (candles.length === 0) return generateCandles(asset, 100);
  
  const newCandles = [...candles];
  const lastCandle = newCandles[newCandles.length - 1];
  const realPrice = ASSET_PRICES[asset];
  const now = Math.floor(Date.now() / 1000);
  const volatility = realPrice * 0.001;
  
  const priceDiff = realPrice - lastCandle.close;
  const change = priceDiff * 0.1 + (Math.random() - 0.5) * volatility;
  
  if (now - lastCandle.time >= 60) {
    const newCandle: Candle = {
      time: now,
      open: lastCandle.close,
      high: Math.max(lastCandle.close, lastCandle.close + change) + Math.random() * volatility * 0.5,
      low: Math.min(lastCandle.close, lastCandle.close + change) - Math.random() * volatility * 0.5,
      close: lastCandle.close + change,
      volume: Math.floor(100000 + Math.random() * 500000),
    };
    newCandles.push(newCandle);
    if (newCandles.length > 500) {
      newCandles.shift();
    }
  } else {
    lastCandle.close += change;
    lastCandle.high = Math.max(lastCandle.high, lastCandle.close);
    lastCandle.low = Math.min(lastCandle.low, lastCandle.close);
  }
  
  return newCandles;
}

export function generateMarketData(asset: Asset, candles: Candle[]) {
  const realPrice = ASSET_PRICES[asset];
  
  if (candles.length === 0) {
    return {
      asset,
      price: realPrice,
      change24h: 0,
      changePercent24h: 0,
      high24h: realPrice,
      low24h: realPrice,
      volume24h: 0,
      marketCap: realPrice * 1e9,
    };
  }
  
  const currentCandle = candles[candles.length - 1];
  const dayAgoCandle = candles[Math.max(0, candles.length - 1440)] || candles[0];
  
  const price = realPrice;
  const change24h = price - dayAgoCandle.close;
  const changePercent24h = (change24h / dayAgoCandle.close) * 100;
  
  const last24h = candles.slice(-1440);
  const high24h = Math.max(...last24h.map(c => c.high), price);
  const low24h = Math.min(...last24h.map(c => c.low), price);
  const volume24h = last24h.reduce((sum, c) => sum + c.volume, 0);
  
  return {
    asset,
    price,
    change24h,
    changePercent24h,
    high24h,
    low24h,
    volume24h,
    marketCap: price * 1e9,
  };
}

// Calculate Take Profit and Stop Loss based on timeframe-aware volatility
export function calculateTakeProfitStopLoss(
  candles: Candle[],
  indicators: TechnicalIndicators,
  timeframe: string = '1m',
  signal?: 'BUY' | 'SELL' | 'SIDEWAYS'
): { takeProfit: number; stopLoss: number; riskReward: number } {
  if (!candles.length) {
    return { takeProfit: 0, stopLoss: 0, riskReward: 0 };
  }

  const currentPrice = candles[candles.length - 1].close;
  const volatility = indicators.volatility || 0;
  const atr = indicators.atr?.value || 0;

  // Timeframe-based volatility multipliers (account for candle size)
  const tfMultipliers: Record<string, number> = {
    '1m': 0.3,
    '5m': 0.6,
    '15m': 1.0,
    '1h': 2.0,
    '4h': 3.5,
    '1D': 5.0,
    '1w': 8.0,
  };

  const multiplier = tfMultipliers[timeframe] || 1.0;
  
  // Calculate distance based on volatility and timeframe
  const volatilityDistance = (volatility / 100) * currentPrice * multiplier;
  const atrDistance = atr || volatilityDistance;
  
  // Use whichever is larger for more conservative stops
  const distance = Math.max(volatilityDistance, atrDistance);

  let takeProfit: number;
  let stopLoss: number;

  if (signal === 'BUY') {
    // For buy signals: TP above, SL below
    takeProfit = currentPrice + distance * 1.5; // 1.5x the risk
    stopLoss = currentPrice - distance * 0.8;
  } else if (signal === 'SELL') {
    // For sell signals: TP below, SL above
    takeProfit = currentPrice - distance * 1.5;
    stopLoss = currentPrice + distance * 0.8;
  } else {
    // For sideways: symmetric around price
    takeProfit = currentPrice + distance;
    stopLoss = currentPrice - distance;
  }

  const risk = Math.abs(currentPrice - stopLoss);
  const reward = Math.abs(takeProfit - currentPrice);
  const riskReward = risk > 0 ? reward / risk : 0;

  return {
    takeProfit: Math.round(takeProfit * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    riskReward: Math.round(riskReward * 100) / 100,
  };
}

// Advanced indicators integration
export function getAdvancedMetrics(candles: Candle[], indicators: TechnicalIndicators) {
  const { calculateConfluence, calculateSupportResistance, calculateMarketSentiment, calculateRiskMetrics } = require('./advanced-indicators');
  
  return {
    confluence: calculateConfluence(indicators),
    supportResistance: calculateSupportResistance(candles),
    sentiment: calculateMarketSentiment(candles, indicators),
    riskMetrics: calculateRiskMetrics(candles),
  };
}
