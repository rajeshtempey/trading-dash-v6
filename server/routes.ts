import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  generateIndicators, 
  generateCondition, 
  generateMarketData,
  generateSignal,
  calculateTakeProfitStopLoss
} from "./indicators";
import { detectPatterns } from "./pattern-detection";
import { fetchRealCandles, fetchRealMarketData, startRealDataUpdates, getCachedPrice } from "./real-data-fetcher";
import { generateMLPredictions, getSignalBoost } from "./ml-engine";
import { calculateSignalBoost } from "./signal-boosters";
import { generateShiraV6Signal } from "./shira-v6-engine";
import type { Asset, Candle, WebSocketMessage } from "@shared/schema";

interface ClientSubscription {
  ws: WebSocket;
  asset: Asset;
  timeframe: string;
  currency: string;
  // optional start/end for custom or relative ranges (ISO strings)
  startDate?: string;
  endDate?: string;
}

const ASSETS: Asset[] = ['SOL', 'BTC', 'ETH', 'XAU'];

const assetCandles: Record<Asset, Candle[]> = {
  SOL: [],
  BTC: [],
  ETH: [],
  XAU: [],
};

// Map timeframes to Binance intervals
const TIMEFRAME_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1D': '1d',
  '1w': '1w',
  '1mo': '1M',
  '1y': '1y',
  'custom': '1d', // Default to daily for custom ranges
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Helper: aggregate 1m candles to target timeframe
  function aggregateCandles(candles: Candle[], timeframe: string): Candle[] {
    if (!candles || candles.length === 0) return [];

    // If timeframe is '1m' or unknown, just return original
    if (timeframe === '1m' || !timeframe || timeframe === 'custom' || timeframe === 'relative') {
      return candles;
    }

    // Map timeframe to minutes
    const tfMap: Record<string, number> = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1D': 1440,
      '1w': 10080,
    };

    const minutes = tfMap[timeframe] || 1;
    if (minutes === 1) return candles;

    // Group candles by time bucket (epoch minutes / minutes)
    const buckets: Map<number, Candle[]> = new Map();
    for (const c of candles) {
      const bucket = Math.floor(c.time / 60 / minutes);
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)!.push(c);
    }

    const aggregated: Candle[] = [];
    const sortedBuckets = Array.from(buckets.keys()).sort((a, b) => a - b);
    for (const b of sortedBuckets) {
      const group = buckets.get(b)!;
      const times = group.map(x => x.time);
      const opens = group.map(x => x.open);
      const highs = group.map(x => x.high);
      const lows = group.map(x => x.low);
      const closes = group.map(x => x.close);
      const volumes = group.map(x => x.volume || 0);

      aggregated.push({
        time: Math.max(...times),
        open: opens[0],
        high: Math.max(...highs),
        low: Math.min(...lows),
        close: closes[closes.length - 1],
        volume: volumes.reduce((a, b) => a + b, 0),
      });
    }

    return aggregated;
  }
  const clients: Set<ClientSubscription> = new Set();

  // START REAL DATA UPDATES
  startRealDataUpdates();

  // Initialize with REAL candle data from Binance
  console.log('🔄 Fetching real candlestick data from Binance...');
  for (const asset of ASSETS) {
    try {
      const candles = await fetchRealCandles(asset, '1m', 500);
      if (candles.length > 0) {
        assetCandles[asset] = candles;
        console.log(`✓ Loaded ${candles.length} real candles for ${asset}`);
      }
    } catch (error) {
      console.error(`Failed to fetch candles for ${asset}:`, error);
    }
  }

  wss.on('connection', (ws: WebSocket) => {
    let subscription: ClientSubscription = {
      ws,
      asset: 'BTC',
      timeframe: '1m',
      currency: 'USD',
    };
    clients.add(subscription);

    sendInitialData(subscription);

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribe') {
          subscription.asset = message.asset || 'BTC';
          subscription.timeframe = message.timeframe || '1m';
          subscription.currency = message.currency || 'USD';
          // capture optional start/end for custom/relative ranges
          if (message.startDate) subscription.startDate = message.startDate;
          if (message.endDate) subscription.endDate = message.endDate;
          sendInitialData(subscription);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(subscription);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(subscription);
    });
  });

  function sendInitialData(subscription: ClientSubscription) {
    const { ws, asset } = subscription;
    
    if (ws.readyState !== WebSocket.OPEN) return;

    let candles = assetCandles[asset];
    if (candles.length === 0) {
      ws.send(JSON.stringify({
        type: 'error',
        data: `No candle data available for ${asset}`,
      }));
      return;
    }

    // If custom or relative range provided, filter by start/end
    if (subscription.startDate && subscription.endDate) {
      try {
        const start = Math.floor(new Date(subscription.startDate).getTime() / 1000);
        const end = Math.floor(new Date(subscription.endDate).getTime() / 1000);
        candles = candles.filter(c => c.time >= start && c.time <= end);
      } catch (e) {
        // ignore parsing errors and use full candles
      }
    }

    // Aggregate according to subscription timeframe
    const aggregated = aggregateCandles(candles, subscription.timeframe);
    const sendCandles = aggregated.length > 0 ? aggregated : candles;

    const indicators = generateIndicators(sendCandles);
    const condition = generateCondition(indicators);
    const marketData = generateMarketData(asset, sendCandles);
    
    // Calculate TP/SL based on timeframe and signal
    const signal = generateSignal(asset, sendCandles, indicators, subscription.currency);
    const { takeProfit, stopLoss, riskReward } = calculateTakeProfitStopLoss(
      sendCandles,
      indicators,
      subscription.timeframe,
      signal?.type as 'BUY' | 'SELL' | 'SIDEWAYS'
    );
    
    // Extend indicators with TP/SL data
    const indicatorsWithTP = {
      ...indicators,
      takeProfit,
      stopLoss,
      riskReward,
    };

    // Send all candles (aggregated)
    sendCandles.forEach(candle => {
      const message: WebSocketMessage = {
        type: 'candle',
        asset,
        data: candle,
      };
      ws.send(JSON.stringify(message));
    });

    ws.send(JSON.stringify({
      type: 'indicators',
      asset,
      data: indicatorsWithTP,
    }));

    ws.send(JSON.stringify({
      type: 'condition',
      asset,
      data: condition,
    }));

    ws.send(JSON.stringify({
      type: 'marketData',
      asset,
      data: marketData,
    }));

    // Generate and send trading signal based on confluence analysis (on aggregated data)
    if (signal) {
      ws.send(JSON.stringify({
        type: 'signal',
        asset,
        data: {
          ...signal,
          takeProfit,
          stopLoss,
          riskReward,
        },
      }));
      console.log(`[SIGNAL] Generated ${signal.type} signal for ${asset} with ${signal.confidence}% confidence (TP: ${takeProfit}, SL: ${stopLoss}, R:R: ${riskReward}:1)`);
    }

    // Send detected patterns
    const patterns = detectPatterns(sendCandles.slice(-10));
    if (patterns.length > 0) {
      ws.send(JSON.stringify({
        type: 'patterns',
        asset,
        data: patterns,
      }));
    }

    // Generate and send ML predictions
    const mlPredictions = generateMLPredictions(asset, sendCandles);
    if (mlPredictions) {
      ws.send(JSON.stringify({
        type: 'mlPredictions',
        asset,
        data: mlPredictions,
      }));
      console.log(`[ML] Sent predictions for ${asset}: ${mlPredictions.ensemble.direction} (${mlPredictions.ensemble.signalStrength})`);
    }

    // Send signal boost data
    const signalBoost = calculateSignalBoost(
      asset,
      sendCandles,
      indicators,
      mlPredictions,
      signal?.confidence || 50
    );
    ws.send(JSON.stringify({
      type: 'signalBoost',
      asset,
      data: signalBoost,
    }));
  }

  // Real-time updates: Fetch new candles and broadcast every 60 seconds
  setInterval(async () => {
    for (const asset of ASSETS) {
      try {
        // Fetch latest candles from Binance
        const latestCandles = await fetchRealCandles(asset, '1m', 50);
        if (latestCandles.length > 0) {
          // Merge with existing candles (replace last 50, keep older ones)
          const existingOlder = assetCandles[asset].slice(0, -50);
          assetCandles[asset] = [...existingOlder, ...latestCandles].slice(-500);
        }

        const candles = assetCandles[asset];
        if (candles.length === 0) continue;

        // precompute global items from raw 1m candles
        const globalPatterns = detectPatterns(candles.slice(-10));
        const rawLatest = candles[candles.length - 1];

        // Broadcast to all subscribed clients (each subscription may request different timeframe/range)
        clients.forEach(subscription => {
          if (subscription.asset !== asset || subscription.ws.readyState !== WebSocket.OPEN) return;

          // Prepare subscriber-specific candle set
          let subCandles = candles;
          if (subscription.startDate && subscription.endDate) {
            try {
              const start = Math.floor(new Date(subscription.startDate).getTime() / 1000);
              const end = Math.floor(new Date(subscription.endDate).getTime() / 1000);
              subCandles = subCandles.filter(c => c.time >= start && c.time <= end);
            } catch (e) {
              // ignore parse errors
            }
          }

          const subAggregated = aggregateCandles(subCandles, subscription.timeframe);
          const sendSubCandles = subAggregated.length > 0 ? subAggregated : subCandles;
          const latest = sendSubCandles[sendSubCandles.length - 1] || rawLatest;

          // Compute indicators and condition on aggregated set
          const subIndicators = generateIndicators(sendSubCandles);
          const subCondition = generateCondition(subIndicators);
          const subMarketData = generateMarketData(asset, sendSubCandles);

          // Send latest aggregated candle
          subscription.ws.send(JSON.stringify({ type: 'candle', asset, data: latest }));

          // Send updated indicators (REAL-TIME)
          subscription.ws.send(JSON.stringify({ type: 'indicators', asset, data: subIndicators }));

          // Send market condition
          subscription.ws.send(JSON.stringify({ type: 'condition', asset, data: subCondition }));

          // Send market data
          subscription.ws.send(JSON.stringify({ type: 'marketData', asset, data: subMarketData }));

          // Generate trading signal for this aggregated view
          const subSignal = generateSignal(asset, sendSubCandles, subIndicators, subscription.currency);
          if (subSignal) {
            subscription.ws.send(JSON.stringify({ type: 'signal', asset, data: subSignal }));
            console.log(`[SIGNAL] Real-time ${subSignal.type} signal for ${asset} - ${subSignal.confidence}% confidence (tf=${subscription.timeframe})`);
          }

          // Generate SHIRA V6 signal (advanced trading logic)
          try {
            const shiraV6Signal = generateShiraV6Signal(asset, sendSubCandles, subIndicators, subscription.timeframe);
            if (shiraV6Signal) {
              subscription.ws.send(JSON.stringify({ type: 'shiraV6Signal', asset, data: shiraV6Signal }));
              console.log(`[SHIRA V6] ${shiraV6Signal.direction} signal for ${asset} - ${shiraV6Signal.confidence}% confidence, Risk: ${shiraV6Signal.riskLevel}`);
            }
          } catch (err) {
            console.error(`[SHIRA V6] Error generating signal for ${asset}:`, err);
          }

          // Send patterns (from aggregated or raw depending on size)
          if (globalPatterns.length > 0) {
            subscription.ws.send(JSON.stringify({ type: 'patterns', asset, data: globalPatterns }));
          }

          // Generate and send ML predictions (real-time)
          const mlPredictions = generateMLPredictions(asset, sendSubCandles);
          if (mlPredictions) {
            subscription.ws.send(JSON.stringify({
              type: 'mlPredictions',
              asset,
              data: mlPredictions,
            }));
          }

          // Send signal boost data (real-time)
          const signalBoost = calculateSignalBoost(
            asset,
            sendSubCandles,
            subIndicators,
            mlPredictions,
            subSignal?.confidence || 50
          );
          subscription.ws.send(JSON.stringify({
            type: 'signalBoost',
            asset,
            data: signalBoost,
          }));
        });
      } catch (error) {
        console.error(`Real-time update failed for ${asset}:`, error);
      }
    }
  }, 10000); // Update every 10 seconds (faster data refresh for TPP)

  // REST API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/candles/:asset', (req, res) => {
    const asset = req.params.asset.toUpperCase() as Asset;
    if (!ASSETS.includes(asset)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }
    const candles = assetCandles[asset];
    res.json(candles.slice(-100)); // Return last 100 candles
  });

  app.get('/api/indicators/:asset', (req, res) => {
    const asset = req.params.asset.toUpperCase() as Asset;
    if (!ASSETS.includes(asset)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }
    
    const candles = assetCandles[asset];
    if (candles.length === 0) {
      return res.status(404).json({ error: 'No data available' });
    }
    
    const indicators = generateIndicators(candles);
    res.json(indicators);
  });

  app.get('/api/condition/:asset', (req, res) => {
    const asset = req.params.asset.toUpperCase() as Asset;
    if (!ASSETS.includes(asset)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }
    
    const candles = assetCandles[asset];
    if (candles.length === 0) {
      return res.status(404).json({ error: 'No data available' });
    }
    
    const indicators = generateIndicators(candles);
    const condition = generateCondition(indicators);
    res.json(condition);
  });

  // Time-to-Profit Predictor (TPP) endpoint
  app.post('/api/tpp', (req, res) => {
    try {
      const { asset: a, targetDelta, targetPrice, targetType, lookbackMinutes } = req.body as any;
      const asset = (a || '').toUpperCase();
      if (!ASSETS.includes(asset as any)) {
        return res.status(400).json({ error: 'Invalid asset' });
      }

      const candles = assetCandles[asset as any];
      if (!candles || candles.length === 0) {
        return res.status(404).json({ error: 'No candle data available' });
      }

      const lookback = typeof lookbackMinutes === 'number' && lookbackMinutes > 0 ? Math.floor(lookbackMinutes) : 45;

      // current rate: prefer cached price, fallback to last candle close
      const cachedPrice = getCachedPrice(asset as any) || 0;
      const lastCandle = candles[candles.length - 1];
      const currentRate = cachedPrice > 0 ? cachedPrice : (lastCandle?.close || 0);

      // determine target rate
      let targetRate = 0;
      let delta = 0;
      if (typeof targetPrice === 'number') {
        targetRate = targetPrice;
        delta = targetRate - currentRate;
      } else if (typeof targetDelta === 'number') {
        if (targetType === 'percent') {
          targetRate = currentRate * (1 + targetDelta / 100);
        } else {
          targetRate = currentRate + targetDelta;
        }
        delta = targetRate - currentRate;
      } else {
        return res.status(400).json({ error: 'Provide targetDelta or targetPrice' });
      }

      const absDelta = Math.abs(delta);
      if (absDelta === 0) {
        return res.json({ currentRate, targetRate, estimatedMinMinutes: 0, estimatedMaxMinutes: 0, probability: 100 });
      }

      // Build sliding-window deltas over the historical candles using minute buckets (candles assumed 1m)
      const windowSize = Math.max(1, Math.floor(lookback)); // in minutes
      const deltas: number[] = [];
      for (let i = 0; i + windowSize - 1 < candles.length; i++) {
        const start = candles[i];
        const end = candles[i + windowSize - 1];
        const d = end.close - start.close;
        deltas.push(d);
      }

      if (deltas.length === 0) {
        return res.status(422).json({ error: 'Insufficient historical data for requested lookback' });
      }

      // For positive delta targets, focus on positive window deltas; for negative targets, focus on negative deltas
      const relevant = delta >= 0 ? deltas.filter(d => d > 0) : deltas.filter(d => d < 0).map(d => Math.abs(d));

      const countAchieved = deltas.filter(d => Math.abs(d) >= absDelta).length;
      const probability = Math.round((countAchieved / deltas.length) * 100);

      // velocity in price per minute
      const velocitiesPerMinute = relevant.map(d => Math.abs(d) / windowSize); // price change per minute

      const sum = velocitiesPerMinute.reduce((s, v) => s + v, 0);
      const avg = velocitiesPerMinute.length > 0 ? sum / velocitiesPerMinute.length : 0;
      const sorted = velocitiesPerMinute.slice().sort((a, b) => a - b);
      const median = sorted.length > 0 ? (sorted[Math.floor(sorted.length / 2)] || 0) : 0;
      const maxVel = velocitiesPerMinute.length > 0 ? Math.max(...velocitiesPerMinute) : 0;

      // estimated times in minutes
      const estimatedMinMinutes = maxVel > 0 ? Math.max( (absDelta / maxVel), 0 ) : Infinity;
      const estimatedAvgMinutes = avg > 0 ? Math.max( (absDelta / avg), 0 ) : Infinity;

      // Return reasonable fallback caps
      const capMinutes = 60 * 24 * 7; // 1 week cap
      const minM = Math.min(estimatedMinMinutes, capMinutes);
      const maxM = Math.min(estimatedAvgMinutes, capMinutes);

      return res.json({
        asset,
        currentRate,
        targetRate,
        targetDelta: delta,
        lookbackMinutes: windowSize,
        estimatedMinMinutes: Number(minM.toFixed(2)),
        estimatedMaxMinutes: Number(maxM === Infinity ? -1 : maxM.toFixed(2)),
        probability,
        samples: deltas.length,
      });
    } catch (error) {
      console.error('TPP calculation failed:', error);
      return res.status(500).json({ error: 'TPP calculation failed' });
    }
  });

  app.post('/api/simulate', (req, res) => {
    const { asset, capitalPercentage, targetPercentage } = req.body;
    
    if (!asset || !capitalPercentage || !targetPercentage) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const assetKey = String(asset).toUpperCase() as Asset;
    if (!ASSETS.includes(assetKey)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }

    const candles = assetCandles[assetKey];
    if (candles.length === 0) {
      return res.status(404).json({ error: 'No data available' });
    }

    const currentCandle = candles[candles.length - 1];
    const entryPrice = currentCandle.close;
    const positionValue = 10000 * (capitalPercentage / 100);
    const units = positionValue / entryPrice;
    
    const exitPriceUp = entryPrice * (1 + targetPercentage / 100);
    const profitUp = (exitPriceUp - entryPrice) * units;
    
    const exitPriceDown = entryPrice * (1 - targetPercentage / 100);
    const lossDown = (entryPrice - exitPriceDown) * units;
    
    const winProbability = 50 + (targetPercentage < 3 ? 10 : targetPercentage < 5 ? 5 : 0);
    const expectedReturn = (profitUp * (winProbability / 100)) - (lossDown * ((100 - winProbability) / 100));

    res.json({
      entryPrice,
      exitPrice: exitPriceUp,
      positionSize: units,
      capitalPercentage,
      profitLoss: profitUp,
      profitLossPercent: (profitUp / positionValue) * 100,
      breakeven: entryPrice,
      maxLoss: lossDown,
      expectedReturn,
      probability: winProbability,
    });
  });

  // ML Predictions API endpoint
  app.get('/api/ml-predictions/:asset', (req, res) => {
    const asset = req.params.asset.toUpperCase() as Asset;
    if (!ASSETS.includes(asset)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }
    
    const candles = assetCandles[asset];
    if (candles.length === 0) {
      return res.status(404).json({ error: 'No data available' });
    }
    
    const predictions = generateMLPredictions(asset, candles);
    if (!predictions) {
      return res.status(500).json({ error: 'Failed to generate predictions' });
    }
    
    res.json(predictions);
  });

  // Signal Boost API endpoint
  app.get('/api/signal-boost/:asset', (req, res) => {
    const asset = req.params.asset.toUpperCase() as Asset;
    if (!ASSETS.includes(asset)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }
    
    const candles = assetCandles[asset];
    if (candles.length === 0) {
      return res.status(404).json({ error: 'No data available' });
    }
    
    const indicators = generateIndicators(candles);
    const signal = generateSignal(asset, candles, indicators);
    const mlPredictions = generateMLPredictions(asset, candles);
    
    const signalBoost = calculateSignalBoost(
      asset,
      candles,
      indicators,
      mlPredictions,
      signal?.confidence || 50
    );
    
    res.json(signalBoost);
  });

  // Combined analysis endpoint (all ML models + signals + boost)
  app.get('/api/analysis/:asset', (req, res) => {
    const asset = req.params.asset.toUpperCase() as Asset;
    if (!ASSETS.includes(asset)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }
    
    const candles = assetCandles[asset];
    if (candles.length === 0) {
      return res.status(404).json({ error: 'No data available' });
    }
    
    const indicators = generateIndicators(candles);
    const condition = generateCondition(indicators);
    const marketData = generateMarketData(asset, candles);
    const signal = generateSignal(asset, candles, indicators);
    const patterns = detectPatterns(candles.slice(-10));
    const mlPredictions = generateMLPredictions(asset, candles);
    const signalBoost = calculateSignalBoost(
      asset,
      candles,
      indicators,
      mlPredictions,
      signal?.confidence || 50
    );
    
    res.json({
      asset,
      timestamp: Date.now(),
      currentPrice: candles[candles.length - 1].close,
      indicators,
      condition,
      marketData,
      signal,
      patterns,
      mlPredictions,
      signalBoost,
      dataPoints: candles.length,
    });
  });

  return httpServer;
}
