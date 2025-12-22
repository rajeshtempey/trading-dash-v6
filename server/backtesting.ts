// Backtesting engine for strategy validation
import type { Candle, Asset, BackTestResult } from "@shared/schema";
import { randomUUID } from "crypto";
import { generateSignal, generateIndicators } from "./indicators";

export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  riskPercentage: number;
  useBinanceData?: boolean;
}

export interface Trade {
  entry: number;
  exit: number;
  entryTime: number;
  exitTime: number;
  profit: number;
  profitPercent: number;
  isWinning: boolean;
}

export function backtest(
  candles: Candle[],
  config: BacktestConfig
): { trades: Trade[]; stats: BackTestResult } {
  const trades: Trade[] = [];
  let capital = config.initialCapital;
  let inPosition = false;
  let entryPrice = 0;
  let entryTime = 0;

  for (let i = 0; i < candles.length - 1; i++) {
    const currentCandle = candles[i];
    const recentCandles = candles.slice(Math.max(0, i - 100), i + 1);
    
    const indicators = generateIndicators(recentCandles);
    const signal = generateSignal("BTC", recentCandles, indicators);

    // Entry signal
    if (!inPosition && signal?.type === "BUY" && (signal.confidence ?? 0) > 65) {
      const riskAmount = capital * (config.riskPercentage / 100);
      const stopLossPrice = signal.stopLoss ?? currentCandle.close;
      const distance = Math.abs(currentCandle.close - stopLossPrice) || 1;
      const positionSize = riskAmount / distance;

      entryPrice = currentCandle.close;
      entryTime = currentCandle.time;
      inPosition = true;
    }

    // Exit signal
    if (inPosition && signal?.type === "SELL") {
      const exitPrice = currentCandle.close;
      const profit = (exitPrice - entryPrice) * (capital / entryPrice);
      const profitPercent = ((exitPrice - entryPrice) / entryPrice) * 100;

      trades.push({
        entry: entryPrice,
        exit: exitPrice,
        entryTime,
        exitTime: currentCandle.time,
        profit,
        profitPercent,
        isWinning: profit > 0,
      });

      capital += profit;
      inPosition = false;
    }
  }

  // Calculate statistics
  const stats = calculateBacktestStats(trades, candles, config);
  return { trades, stats };
}

function calculateBacktestStats(
  trades: Trade[],
  candles: Candle[],
  config: BacktestConfig
): BackTestResult {
  const totalTrades = trades.length;
  const winTrades = trades.filter(t => t.isWinning).length;
  const lossTrades = totalTrades - winTrades;
  const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const grossProfit = trades
    .filter(t => t.isWinning)
    .reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = Math.abs(
    trades
      .filter(t => !t.isWinning)
      .reduce((sum, t) => sum + t.profit, 0)
  );

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 1;

  // Sharpe Ratio (simplified)
  const returns = trades.map(t => t.profitPercent);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    returns.length || 1;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Max Drawdown
  let maxDrawdown = 0;
  let peak = config.initialCapital;
  let runningBalance = config.initialCapital;

  for (const trade of trades) {
    runningBalance += trade.profit;
    if (runningBalance > peak) {
      peak = runningBalance;
    }
    const drawdown = ((peak - runningBalance) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    id: randomUUID(),
    asset: "BTC",
    timeframe: "1m",
    totalTrades,
    winTrades,
    lossTrades,
    winRate,
    profitFactor,
    totalProfit,
    maxDrawdown,
    sharpeRatio,
    startDate: new Date(candles[0].time * 1000),
    endDate: new Date(candles[candles.length - 1].time * 1000),
    timestamp: new Date(),
  };
}
