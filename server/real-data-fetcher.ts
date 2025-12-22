// REAL DATA ONLY - No mock data, ever
import type { Candle, Asset, MarketData } from "@shared/schema";

const BINANCE_API = "https://api.binance.com/api/v3";
const COINGECKO_API = "https://api.coingecko.com/api/v3";

const SYMBOL_MAP: Record<Asset, string> = {
  SOL: "SOLUSDT",
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  XAU: "PAXGUSDT", // PAXG is a gold-backed crypto token on Binance
};

const COINGECKO_IDS: Record<Asset, string> = {
  SOL: "solana",
  BTC: "bitcoin",
  ETH: "ethereum",
  XAU: "pax-gold", // PAXG gold-backed token
};

let priceCache: Record<Asset, number> = {
  SOL: 0,
  BTC: 0,
  ETH: 0,
  XAU: 0,
};

export async function fetchRealCandles(
  asset: Asset,
  interval: string = "1m",
  limit: number = 500
): Promise<Candle[]> {
  try {
    const symbol = SYMBOL_MAP[asset];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.warn(`[REAL DATA] Binance API ${response.status} for ${asset} - No mock fallback, market may be closed`);
      return [];
    }
    
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[REAL DATA] Binance returned empty data for ${asset}`);
      return [];
    }
    
    return data.map((candle: any[]) => ({
      time: Math.floor(candle[0] / 1000),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[7]),
    }));
  } catch (error) {
    console.warn(`[REAL DATA] Failed to fetch real candles for ${asset}: ${error}`);
    return [];
  }
}

export async function fetchRealPrice(asset: Asset): Promise<number | null> {
  try {
    const cgId = COINGECKO_IDS[asset];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${cgId}&vs_currencies=usd`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.warn(`[REAL DATA] CoinGecko API ${response.status} for ${asset}`);
      return priceCache[asset] || null;
    }
    
    const data = await response.json();
    const price = data[cgId]?.usd;
    
    if (price && price > 0) {
      priceCache[asset] = price;
      return price;
    }
    
    return priceCache[asset] || null;
  } catch (error) {
    console.warn(`[REAL DATA] Price fetch failed for ${asset}`);
    return priceCache[asset] || null;
  }
}

export async function fetchRealMarketData(asset: Asset): Promise<Partial<MarketData> | null> {
  try {
    const symbol = SYMBOL_MAP[asset];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      `${BINANCE_API}/ticker/24hr?symbol=${symbol}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.warn(`[REAL DATA] Binance 24hr ticker ${response.status} for ${asset}`);
      return null;
    }
    
    const data = await response.json();
    const price = await fetchRealPrice(asset);
    
    return {
      asset,
      price: price || 0,
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.quoteAssetVolume),
      source: 'binance',
    };
  } catch (error) {
    console.warn(`[REAL DATA] Market data fetch failed for ${asset}`);
    return null;
  }
}

export function startRealDataUpdates() {
  const ASSETS: Asset[] = ['SOL', 'BTC', 'ETH', 'XAU'];
  
  const updatePrices = async () => {
    for (const asset of ASSETS) {
      try {
        const price = await fetchRealPrice(asset);
        if (price) {
          console.debug(`[REAL DATA] Updated price for ${asset}: $${price}`);
        }
      } catch (error) {
        console.debug(`[REAL DATA] Price update skipped for ${asset}`);
      }
    }
  };

  updatePrices();
  setInterval(updatePrices, 10000); // Update every 10 seconds (faster price updates for TPP)
}

export function getCachedPrice(asset: Asset): number {
  return priceCache[asset] || 0;
}

export function clearPriceCache() {
  Object.keys(priceCache).forEach(key => {
    priceCache[key as Asset] = 0;
  });
}
