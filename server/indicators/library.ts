// server/indicators/library.ts
// 100% FREE Complete Indicator Library
// Master interface for all available indicators

import { calculateSuperTrend, SuperTrendResult } from './supertrend';
import { calculateIchimoku, IchimokuResult } from './ichimoku';
import * as AdditionalIndicators from './additional';
import * as ChartTypes from './chart-types';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Master Indicator Library
 * Contains ALL FREE trading indicators with no licensing requirements
 */
export interface IndicatorLibrary {
  // Trend indicators metadata
  [key: string]: any;
}

/**
 * Indicator Configuration & Defaults
 */
export const DEFAULT_INDICATOR_PARAMS: Record<string, any> = {
  // Trend
  SuperTrend: { period: 10, multiplier: 3 },
  IchimokuCloud: { conversionPeriod: 9, basePeriod: 26 },
  ADX: { period: 14 },
  
  // Momentum
  StochasticRSI: { rsiPeriod: 14, stochPeriod: 14 },
  MFI: { period: 14 },
  CCI: { period: 20 },
  
  // Volatility
  ATR: { period: 14 },
  KeltnerChannels: { period: 20, atrMultiplier: 2 },
  DonchianChannels: { period: 20 },
};

/**
 * Indicator Metadata
 */
export const INDICATOR_METADATA: Record<string, any> = {
  SuperTrend: {
    category: 'TREND',
    description: 'Identifies trend direction and strength',
    isFree: true
  },
  ADX: {
    category: 'TREND',
    description: 'Measures trend strength',
    isFree: true
  }
};

/**
 * Create complete indicator library
 */
export function createIndicatorLibrary(): IndicatorLibrary {
  return {
    SuperTrend: {
      calculate: calculateSuperTrend,
      params: DEFAULT_INDICATOR_PARAMS.SuperTrend
    },
    IchimokuCloud: {
      calculate: calculateIchimoku,
      params: DEFAULT_INDICATOR_PARAMS.IchimokuCloud
    }
  } as IndicatorLibrary;
}

/**
 * Get indicator by name
 */
export function getIndicator(name: string, library: IndicatorLibrary): any {
  return (library as any)[name];
}

/**
 * Get all indicators in category
 */
export function getIndicatorsByCategory(
  category: 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'VOLUME',
  library?: IndicatorLibrary
): string[] {
  return Object.entries(INDICATOR_METADATA)
    .filter(([_, meta]) => meta.category === category)
    .map(([name, _]) => name);
}

/**
 * Get quick indicator recommendations based on market condition
 */
export function recommendIndicators(condition: 'TRENDING' | 'RANGING' | 'VOLATILE'): string[] {
  const recommendations: Record<string, string[]> = {
    TRENDING: ['ADX', 'SuperTrend', 'IchimokuCloud'],
    RANGING: ['StochasticRSI', 'CCI'],
    VOLATILE: ['ATR', 'KeltnerChannels']
  };

  return recommendations[condition] || [];
}
