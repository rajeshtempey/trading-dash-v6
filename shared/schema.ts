import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Trading signals table
export const tradingSignals = pgTable("trading_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asset: text("asset").notNull(), // SOL, BTC, ETH, XAU
  signalType: text("signal_type").notNull(), // BUY, SELL, SIDEWAYS
  price: real("price").notNull(),
  confidence: real("confidence").notNull(), // 0-100
  holdingTime: text("holding_time").notNull(), // e.g., "2h", "1d", "30m"
  takeProfit: real("take_profit"),
  stopLoss: real("stop_loss"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertTradingSignalSchema = createInsertSchema(tradingSignals).omit({
  id: true,
  timestamp: true,
});

export type InsertTradingSignal = z.infer<typeof insertTradingSignalSchema>;
export type TradingSignal = typeof tradingSignals.$inferSelect;

// Backtesting results table
export const backTestResults = pgTable("back_test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asset: text("asset").notNull(),
  timeframe: text("timeframe").notNull(),
  totalTrades: integer("total_trades").notNull(),
  winTrades: integer("win_trades").notNull(),
  lossTrades: integer("loss_trades").notNull(),
  winRate: real("win_rate").notNull(),
  profitFactor: real("profit_factor").notNull(),
  totalProfit: real("total_profit").notNull(),
  maxDrawdown: real("max_drawdown").notNull(),
  sharpeRatio: real("sharpe_ratio").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertBackTestResultSchema = createInsertSchema(backTestResults).omit({
  id: true,
  timestamp: true,
});

export type InsertBackTestResult = z.infer<typeof insertBackTestResultSchema>;
export type BackTestResult = typeof backTestResults.$inferSelect;

// TypeScript interfaces for real-time data
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  asset: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  source?: 'coingecko' | 'binance' | 'coinbase';
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export interface StochasticRSI {
  fastK: number;
  fastD: number;
  slowK: number;
  slowD: number;
}

export interface ATR {
  value: number;
  pips: number;
}

export interface VolumeProfile {
  priceLevel: number;
  volume: number;
  poc?: boolean; // Point of Control
}

export interface TechnicalIndicators {
  ema8: number;
  ema34: number;
  rsi: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  volume: number;
  volatility: number;
  trendStrength: number;
  support: number;
  resistance: number;
  
  // Advanced indicators
  bollingerBands?: BollingerBands;
  stochasticRsi?: StochasticRSI;
  atr?: ATR;
  volumeProfile?: VolumeProfile[];
  
  // Historical series (optional, sent from server when available)
  macdSeries?: Array<{ time: number; macd: number; signal: number; histogram: number }>;
  rsiSeries?: Array<{ time: number; value: number }>;
}

export interface MarketCondition {
  condition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  strength: number; // 0-100
  recommendedAction: 'BUY' | 'SELL' | 'HOLD';
  holdingTimeRecommendation: string;
  reasoning: string;
}

export interface PositionSize {
  lotSize: number;
  units: number;
  valueInUsd: number;
  riskAmount: number;
  potentialProfit: number;
  potentialLoss: number;
  riskRewardRatio: number;
  kellyPercentage?: number;
}

export interface SimulationResult {
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  capitalPercentage: number;
  profitLoss: number;
  profitLossPercent: number;
  breakeven: number;
  maxLoss: number;
  expectedReturn: number;
  probability: number;
}

export interface SignalMarker {
  time: number;
  price: number;
  type: 'BUY' | 'SELL' | 'SIDEWAYS';
  label: string;
  holdingTime: string;
  confidence: number;
  takeProfit?: number;
  stopLoss?: number;
  pattern?: string;
  size?: number; // Signal size in USD
  currency?: string; // Currency symbol (default USD)
}

export interface PatternDetection {
  name: string;
  confidence: number;
  description: string;
  predictedTarget?: number;
  breakoutLevel?: number;
}

export type Asset = 'SOL' | 'BTC' | 'ETH' | 'XAU';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

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
  confidence: number; // 0-100, based on MTF consensus
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframeStrength: number; // 0-100, consensus score
  reversalProbability: number; // 0-100
  warning: string | null; // "WAIT... unsafe zone" if volatility high
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
}

export interface WebSocketMessage {
  type: 'candle' | 'signal' | 'marketData' | 'indicators' | 'condition' | 'mlPredictions' | 'signalBoost' | 'patterns' | 'shiraV6Signal';
  asset: Asset;
  data: Candle | SignalMarker | MarketData | TechnicalIndicators | MarketCondition | MLPredictionResult | SignalBoost | PatternDetection[] | ShiraV6Signal;
}

// ML Prediction Types
export interface ModelPrediction {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  prediction: {
    price: number;
    confidence: number;
    direction: 'UP' | 'DOWN' | 'NEUTRAL';
    percentChange: number;
  };
  lastUpdated: number;
  trainingDataPoints: number;
}

export interface EnsemblePrediction {
  weightedPrice: number;
  weightedConfidence: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  percentChange: number;
  agreementScore: number;
  models: ModelPrediction[];
  signalStrength: 'STRONG' | 'MODERATE' | 'WEAK';
}

export interface TimeframePrediction {
  timeframe: string;
  prediction: number;
  confidence: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
}

export interface MLPredictionResult {
  asset: Asset;
  currentPrice: number;
  predictions: TimeframePrediction[];
  modelPerformance: ModelPrediction[];
  ensemble: EnsemblePrediction;
  timestamp: number;
  dataQuality: number;
}

// Signal Boost Types
export interface SentimentResult {
  score: number;
  label: 'VERY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'VERY_BEARISH';
  factors: string[];
  confidence: number;
}

export interface VolumeAnalysis {
  volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  volumeStrength: number;
  unusualActivity: boolean;
  buyingPressure: number;
  sellingPressure: number;
}

export interface MomentumScore {
  overall: number;
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
  divergence: 'BULLISH' | 'BEARISH' | 'NONE';
}

export interface VolatilityAdjustment {
  adjustedConfidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  volatilityPercent: number;
  recommendedPositionSize: number;
}

export interface SignalBoost {
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
