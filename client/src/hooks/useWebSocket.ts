import { useState, useEffect, useCallback, useRef } from "react";
import type { 
  Candle, 
  SignalMarker, 
  MarketData, 
  TechnicalIndicators, 
  MarketCondition,
  Asset,
  Timeframe,
  WebSocketMessage,
  MLPredictionResult,
  SignalBoost,
  PatternDetection,
  ShiraV6Signal
} from "@shared/schema";

interface WebSocketState {
  candles: Record<Asset, Candle[]>;
  signals: Record<Asset, SignalMarker[]>;
  marketData: Record<Asset, MarketData | undefined>;
  indicators: Record<Asset, TechnicalIndicators | null>;
  conditions: Record<Asset, MarketCondition | null>;
  mlPredictions: Record<Asset, MLPredictionResult | null>;
  signalBoost: Record<Asset, SignalBoost | null>;
  patterns: Record<Asset, PatternDetection[]>;
  shiraV6Signals: Record<Asset, ShiraV6Signal | null>;
  isConnected: boolean;
  error: string | null;
}

const initialState: WebSocketState = {
  candles: { SOL: [], BTC: [], ETH: [], XAU: [] },
  signals: { SOL: [], BTC: [], ETH: [], XAU: [] },
  marketData: { SOL: undefined, BTC: undefined, ETH: undefined, XAU: undefined },
  indicators: { SOL: null, BTC: null, ETH: null, XAU: null },
  conditions: { SOL: null, BTC: null, ETH: null, XAU: null },
  mlPredictions: { SOL: null, BTC: null, ETH: null, XAU: null },
  signalBoost: { SOL: null, BTC: null, ETH: null, XAU: null },
  patterns: { SOL: [], BTC: [], ETH: [], XAU: [] },
  shiraV6Signals: { SOL: null, BTC: null, ETH: null, XAU: null },
  isConnected: false,
  error: null,
};

export function useWebSocket(
  selectedAsset: Asset,
  timeframe: string,
  timeframeRange?: { startDate?: string; endDate?: string },
  currency: string = 'USD'
) {
  const [state, setState] = useState<WebSocketState>(initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const hostname = window.location.hostname || "localhost";
      const port = window.location.port;
      
      if (!hostname || hostname === "undefined") {
        setState(prev => ({ 
          ...prev, 
          error: "Invalid connection URL",
          isConnected: false 
        }));
        return;
      }
      
      // Connect to WebSocket - use same host/port as the page (Replit proxy handles it)
      const wsUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}/ws`;
      console.log("[WebSocket] Connecting to:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        const subMsg: any = { type: "subscribe", asset: selectedAsset, timeframe, currency };
        if (timeframeRange?.startDate) subMsg.startDate = timeframeRange.startDate;
        if (timeframeRange?.endDate) subMsg.endDate = timeframeRange.endDate;
        ws.send(JSON.stringify(subMsg));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          setState(prev => {
            const newState = { ...prev };
            
            switch (message.type) {
              case "candle":
                const candle = message.data as Candle;
                const existingCandles = [...(prev.candles[message.asset] || [])];
                const lastIndex = existingCandles.findIndex(c => c.time === candle.time);
                if (lastIndex >= 0) {
                  existingCandles[lastIndex] = candle;
                } else {
                  existingCandles.push(candle);
                }
                newState.candles = { ...prev.candles, [message.asset]: existingCandles };
                break;
                
              case "signal":
                const signal = message.data as SignalMarker;
                const existingSignals = [...(prev.signals[message.asset] || [])];
                existingSignals.push(signal);
                if (existingSignals.length > 50) {
                  existingSignals.shift();
                }
                newState.signals = { ...prev.signals, [message.asset]: existingSignals };
                break;
                
              case "marketData":
                newState.marketData = { 
                  ...prev.marketData, 
                  [message.asset]: message.data as MarketData 
                };
                break;
                
              case "indicators":
                newState.indicators = { 
                  ...prev.indicators, 
                  [message.asset]: message.data as TechnicalIndicators 
                };
                break;
                
              case "condition":
                newState.conditions = { 
                  ...prev.conditions, 
                  [message.asset]: message.data as MarketCondition 
                };
                break;

              case "mlPredictions":
                newState.mlPredictions = {
                  ...prev.mlPredictions,
                  [message.asset]: message.data as MLPredictionResult
                };
                break;

              case "signalBoost":
                newState.signalBoost = {
                  ...prev.signalBoost,
                  [message.asset]: message.data as SignalBoost
                };
                break;

              case "patterns":
                newState.patterns = {
                  ...prev.patterns,
                  [message.asset]: message.data as PatternDetection[]
                };
                break;

              case "shiraV6Signal":
                newState.shiraV6Signals = {
                  ...prev.shiraV6Signals,
                  [message.asset]: message.data as ShiraV6Signal
                };
                break;
            }
            
            return newState;
          });
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false }));
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        setState(prev => ({ 
          ...prev, 
          error: "WebSocket connection error",
          isConnected: false 
        }));
      };
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: "Failed to create WebSocket connection",
        isConnected: false 
      }));
    }
  }, [selectedAsset, timeframe, currency]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const changeSubscription = useCallback((asset: Asset, tf: string, startDate?: string, endDate?: string, curr: string = 'USD') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const msg: any = { type: "subscribe", asset, timeframe: tf, currency: curr };
      if (startDate) msg.startDate = startDate;
      if (endDate) msg.endDate = endDate;
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    // include timeframeRange and currency when changing subscription
    changeSubscription(selectedAsset, timeframe, timeframeRange?.startDate, timeframeRange?.endDate, currency);
  }, [selectedAsset, timeframe, timeframeRange, currency, changeSubscription]);

  return {
    ...state,
    connect,
    disconnect,
    changeSubscription,
  };
}
