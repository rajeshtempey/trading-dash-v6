// Stable Indicator Cache - Prevents fluctuation on timeframe changes
import type { Candle, TechnicalIndicators, Asset } from "@shared/schema";

interface CachedIndicators {
  timestamp: number;
  timeframe: string;
  indicators: TechnicalIndicators;
}

// Cache for each asset + timeframe combination
const indicatorCache = new Map<string, CachedIndicators>();
const CACHE_DURATION = 5000; // 5 seconds - only recalculate if older

// Get cache key
function getCacheKey(asset: Asset, timeframe: string): string {
  return `${asset}_${timeframe}`;
}

// Check if cache is still valid
function isCacheValid(asset: Asset, timeframe: string): boolean {
  const key = getCacheKey(asset, timeframe);
  const cached = indicatorCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_DURATION;
}

// Get cached indicators
export function getCachedIndicators(
  asset: Asset,
  timeframe: string
): TechnicalIndicators | null {
  if (isCacheValid(asset, timeframe)) {
    const key = getCacheKey(asset, timeframe);
    return indicatorCache.get(key)?.indicators || null;
  }
  return null;
}

// Set cached indicators
export function setCachedIndicators(
  asset: Asset,
  timeframe: string,
  indicators: TechnicalIndicators
): void {
  const key = getCacheKey(asset, timeframe);
  indicatorCache.set(key, {
    timestamp: Date.now(),
    timeframe,
    indicators,
  });
}

// Clear cache for an asset
export function clearAssetCache(asset: Asset): void {
  const keysToDelete: string[] = [];
  indicatorCache.forEach((_, key) => {
    if (key.startsWith(asset)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => indicatorCache.delete(key));
}

// Clear all cache
export function clearAllCache(): void {
  indicatorCache.clear();
}

// Get cache stats
export function getCacheStats() {
  return {
    size: indicatorCache.size,
    entries: Array.from(indicatorCache.keys()),
  };
}
