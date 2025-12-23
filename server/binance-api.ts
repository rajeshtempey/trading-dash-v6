// Binance API integration for real market data
import type { Asset, Candle, MarketData } from "@shared/schema";

const BINANCE_API = "https://api.binance.com/api/v3";

const SYMBOL_MAP: Record<Asset, string> = {
  SOL: "SOLUSDT",
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  XAU: "PAXGUSDT", // Gold-backed crypto token
};

// Fetch current price from Binance
export async function getBinancePrice(asset: Asset): Promise<number | null> {
  try {
    const symbol = SYMBOL_MAP[asset];
    if (!symbol) return null;

    const response = await fetch(
      `${BINANCE_API}/ticker/price?symbol=${symbol}`
    );
    const data = await response.json();
    return parseFloat(data.price) || null;
  } catch (error) {
    console.error(`Failed to fetch Binance price for ${asset}:`, error);
    return null;
  }
}

// Fetch 24h ticker data
export async function getBinance24hStats(asset: Asset): Promise<Partial<MarketData> | null> {
  try {
    const symbol = SYMBOL_MAP[asset];
    if (!symbol) return null;

    const response = await fetch(
      `${BINANCE_API}/ticker/24hr?symbol=${symbol}`
    );
    const data = await response.json();

    return {
      asset,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.quoteAssetVolume),
      source: 'binance',
    };
  } catch (error) {
    console.error(`Failed to fetch Binance 24h stats for ${asset}:`, error);
    return null;
  }
}

// Fetch historical candlestick data
export async function getBinanceCandles(
  asset: Asset,
  interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" = "1m",
  limit: number = 100
): Promise<Candle[]> {
  try {
    const symbol = SYMBOL_MAP[asset];
    if (!symbol) return [];

    const response = await fetch(
      `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    const data = await response.json();

    return data.map((candle: any[]) => ({
      time: Math.floor(candle[0] / 1000),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[7]),
    }));
  } catch (error) {
    console.error(`Failed to fetch Binance candles for ${asset}:`, error);
    return [];
  }
}

// Fetch order book depth
export async function getBinanceOrderBook(
  asset: Asset,
  limit: number = 20
): Promise<{ bids: [number, number][]; asks: [number, number][] } | null> {
  try {
    const symbol = SYMBOL_MAP[asset];
    if (!symbol) return null;

    const response = await fetch(
      `${BINANCE_API}/depth?symbol=${symbol}&limit=${limit}`
    );
    const data = await response.json();

    return {
      bids: data.bids.map((b: any[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: data.asks.map((a: any[]) => [parseFloat(a[0]), parseFloat(a[1])]),
    };
  } catch (error) {
    console.error(`Failed to fetch order book for ${asset}:`, error);
    return null;
  }
}
