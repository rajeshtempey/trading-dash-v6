// Real-time indicator and signal broadcasting
import { WebSocket } from "ws";
import { detectPatterns } from "./pattern-detection";
import { backtest, type BacktestConfig } from "./backtesting";
import type { Candle, Asset, TechnicalIndicators, PatternDetection, BackTestResult } from "@shared/schema";
import { generateIndicators, generateCondition, generateSignal, generateMarketData, calculateTakeProfitStopLoss } from "./indicators";

export interface ClientSubscription {
  ws: WebSocket;
  asset: Asset;
  timeframe: string;
  customStart?: string;
  customEnd?: string;
}

export function setupRealtimeUpdates(
  clients: Set<ClientSubscription>,
  assetCandles: Record<Asset, Candle[]>,
  ASSETS: Asset[]
) {
  // Broadcast updates every second for real-time experience
  setInterval(() => {
    ASSETS.forEach(asset => {
      const candles = assetCandles[asset];
      if (candles.length === 0) return;

      const indicators = generateIndicators(candles);
      const condition = generateCondition(indicators);
      const marketData = generateMarketData(asset, candles);
      const signal = generateSignal(asset, candles, indicators);
      const patterns = detectPatterns(candles.slice(-10));

      clients.forEach(subscription => {
        if (subscription.asset !== asset || subscription.ws.readyState !== WebSocket.OPEN) return;

        // Calculate TP/SL with timeframe awareness
        const { takeProfit, stopLoss, riskReward } = calculateTakeProfitStopLoss(
          candles,
          indicators,
          subscription.timeframe,
          signal?.type as 'BUY' | 'SELL' | 'SIDEWAYS'
        );
        
        // Extend indicators with TP/SL
        const indicatorsWithTP = {
          ...indicators,
          takeProfit,
          stopLoss,
          riskReward,
        };

        // Send latest candle
        const latestCandle = candles[candles.length - 1];
        if (latestCandle) {
          subscription.ws.send(JSON.stringify({
            type: "candle",
            asset,
            data: latestCandle,
          }));
        }

        // Send indicators with TP/SL (REAL-TIME)
        subscription.ws.send(JSON.stringify({
          type: "indicators",
          asset,
          data: indicatorsWithTP,
        }));

        // Send condition
        subscription.ws.send(JSON.stringify({
          type: "condition",
          asset,
          data: condition,
        }));

        // Send market data
        subscription.ws.send(JSON.stringify({
          type: "marketData",
          asset,
          data: marketData,
        }));

        // Send signal with TP/SL if exists
        if (signal) {
          subscription.ws.send(JSON.stringify({
            type: "signal",
            asset,
            data: {
              ...signal,
              takeProfit,
              stopLoss,
              riskReward,
            },
          }));
        }

        // Send patterns if exist
        if (patterns.length > 0) {
          subscription.ws.send(JSON.stringify({
            type: "patterns",
            asset,
            data: patterns,
          }));
        }
      });
    });
  }, 1000); // Update every second
}

export function handleBacktestRequest(
  candles: Candle[],
  asset: Asset
): BackTestResult | null {
  if (candles.length < 50) return null;

  try {
    const config: BacktestConfig = {
      startDate: new Date(candles[0].time * 1000),
      endDate: new Date(candles[candles.length - 1].time * 1000),
      initialCapital: 10000,
      riskPercentage: 2,
      useBinanceData: true,
    };

    const { stats } = backtest(candles, config);
    return stats;
  } catch (error) {
    console.error(`Backtest error for ${asset}:`, error);
    return null;
  }
}
