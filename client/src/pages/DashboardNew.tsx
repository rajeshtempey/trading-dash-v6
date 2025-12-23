import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { TradingChart } from "@/components/TradingChart";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Asset } from "@shared/schema";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Brain,
  AlertCircle,
  Menu,
  X,
  Settings,
  BarChart3,
} from "lucide-react";

type TabType = "chart" | "indicators" | "signals" | "analysis";

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>("SOL");
  const [timeframe, setTimeframe] = useState<string>("1m");
  const [showEma8, setShowEma8] = useState(true);
  const [showEma34, setShowEma34] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("chart");
  const chartRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  const wsData = useWebSocket(selectedAsset, timeframe, undefined, "USD");
  const marketData = (wsData?.marketData || {}) as Record<Asset, any>;
  const candles = (wsData?.candles || {}) as Record<Asset, any>;
  const signals = (wsData?.signals || {}) as Record<Asset, any>;
  const indicators = (wsData?.indicators || {}) as Record<Asset, any>;
  const conditions = (wsData?.conditions || {}) as Record<Asset, any>;
  const shiraV6Signals = (wsData?.shiraV6Signals || {}) as Record<Asset, any>;
  const isConnected = wsData?.isConnected ?? true;
  const error = wsData?.error ?? null;

  const currentCandles = candles[selectedAsset] || [];
  const currentSignals = signals[selectedAsset] || [];
  const currentIndicators = indicators[selectedAsset] || null;
  const currentCondition = conditions[selectedAsset] || null;
  const currentPrice = marketData[selectedAsset]?.price || 0;
  const currentShiraV6 = shiraV6Signals[selectedAsset] || null;

  const takeProfit = currentIndicators?.takeProfit || 0;
  const stopLoss = currentIndicators?.stopLoss || 0;
  const riskReward = currentIndicators?.riskReward || 0;

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
  };

  // Get latest signal
  const latestSignal = currentSignals?.[currentSignals.length - 1] || null;

  // Format price
  const formatPrice = (price: number) => {
    if (price > 100) return price.toFixed(2);
    return price.toFixed(4);
  };

  // Format change percentage
  const formatChange = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <Header
        selectedAsset={selectedAsset}
        onAssetChange={setSelectedAsset}
        marketData={marketData}
        onExportPdf={() => {}}
        takeProfit={takeProfit}
        stopLoss={stopLoss}
        riskReward={riskReward}
        currentPrice={currentPrice}
        timeframe={timeframe}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Left Panel */}
        <div
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } transition-all duration-300 overflow-hidden border-r border-slate-700 bg-slate-800/50 backdrop-blur-sm flex flex-col`}
        >
          {/* Market Info Card */}
          <div className="p-4 border-b border-slate-700">
            <div className="space-y-3">
              {/* Price Display */}
              <div>
                <div className="text-xs text-slate-400 mb-1">Current Price</div>
                <div className="text-3xl font-bold text-emerald-400">
                  ${formatPrice(currentPrice)}
                </div>
              </div>

              {/* Change Info */}
              {marketData[selectedAsset] && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-xs text-slate-400">24h Change</div>
                    <div
                      className={`text-sm font-semibold ${
                        marketData[selectedAsset].changePercent24h >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatChange(marketData[selectedAsset].changePercent24h)}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="text-xs text-slate-400">24h High</div>
                    <div className="text-sm font-semibold">
                      ${formatPrice(marketData[selectedAsset].high24h)}
                    </div>
                  </div>
                </div>
              )}

              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/30">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-xs">
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          {/* Signal Card */}
          {latestSignal && (
            <div className="p-4 border-b border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Latest Signal</div>
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  {latestSignal.type === "BUY" ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <Badge
                    variant={
                      latestSignal.type === "BUY" ? "outline" : "destructive"
                    }
                  >
                    {latestSignal.type}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-300">
                    {latestSignal.confidence}%
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {latestSignal.description || "Confluence-based signal"}
                </div>
              </div>
            </div>
          )}

          {/* Indicators Display */}
          {currentIndicators && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                <BarChart3 className="w-3 h-3" />
                Key Indicators
              </div>

              <div className="space-y-2">
                {/* RSI */}
                {currentIndicators.rsi && (
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400">RSI(14)</span>
                      <span className="font-semibold">
                        {currentIndicators.rsi.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded h-1.5">
                      <div
                        className={`h-full rounded transition-all ${
                          currentIndicators.rsi > 70
                            ? "bg-red-500"
                            : currentIndicators.rsi < 30
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, currentIndicators.rsi)
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Oversold</span>
                      <span>Overbought</span>
                    </div>
                  </div>
                )}

                {/* MACD */}
                {currentIndicators.macd && (
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="text-xs font-semibold mb-1 text-slate-300">
                      MACD
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Line</span>
                        <span
                          className={
                            currentIndicators.macd.macdLine >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {currentIndicators.macd.macdLine.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Signal</span>
                        <span className="text-slate-300">
                          {currentIndicators.macd.signal.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bollinger Bands */}
                {currentIndicators.bollingerBands && (
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="text-xs font-semibold mb-1 text-slate-300">
                      Bollinger Bands
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Upper</span>
                        <span className="text-slate-300">
                          {currentIndicators.bollingerBands.upper.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Middle</span>
                        <span className="text-slate-300">
                          {currentIndicators.bollingerBands.middle.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lower</span>
                        <span className="text-slate-300">
                          {currentIndicators.bollingerBands.lower.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ATR */}
                {currentIndicators.atr && (
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">ATR</span>
                      <span className="font-semibold">
                        {currentIndicators.atr.value.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-400 hover:text-white"
              >
                {sidebarOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </Button>

              <TimeframeSelector
                selectedTimeframe={timeframe}
                onTimeframeChange={handleTimeframeChange}
              />

              <div className="flex gap-2">
                <Button
                  variant={showEma8 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowEma8(!showEma8)}
                  className="text-xs"
                >
                  EMA 8
                </Button>
                <Button
                  variant={showEma34 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowEma34(!showEma34)}
                  className="text-xs"
                >
                  EMA 34
                </Button>
                <Button
                  variant={showVolume ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowVolume(!showVolume)}
                  className="text-xs"
                >
                  Volume
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400">
                  {error.substring(0, 50)}...
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabType)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="w-full rounded-none border-b border-slate-700 bg-slate-800/50 justify-start px-4">
              <TabsTrigger value="chart" className="text-xs sm:text-sm">
                <Activity className="w-4 h-4 mr-2" />
                Chart
              </TabsTrigger>
              <TabsTrigger value="indicators" className="text-xs sm:text-sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Indicators
              </TabsTrigger>
              <TabsTrigger value="signals" className="text-xs sm:text-sm">
                <Zap className="w-4 h-4 mr-2" />
                Signals
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs sm:text-sm">
                <Brain className="w-4 h-4 mr-2" />
                Analysis
              </TabsTrigger>
            </TabsList>

            {/* Chart Tab */}
            <TabsContent
              value="chart"
              className="flex-1 overflow-hidden data-[state=inactive]:hidden"
            >
              <div ref={chartRef} className="w-full h-full">
                <TradingChart
                  candles={currentCandles}
                  signals={currentSignals}
                  indicators={currentIndicators}
                  showEma8={showEma8}
                  showEma34={showEma34}
                  showVolume={showVolume}
                  fillParent={true}
                  takeProfit={takeProfit}
                  stopLoss={stopLoss}
                  currentPrice={currentPrice}
                  timeframe={timeframe}
                />
              </div>
            </TabsContent>

            {/* Indicators Tab */}
            <TabsContent
              value="indicators"
              className="flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Complete Technical Indicators
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentIndicators && (
                      <>
                        {/* RSI */}
                        <Card className="bg-slate-700/30 border-slate-600">
                          <div className="p-3">
                            <div className="text-xs text-slate-400 mb-1">
                              RSI(14)
                            </div>
                            <div className="text-2xl font-bold">
                              {currentIndicators.rsi?.toFixed(1) || "N/A"}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {currentIndicators.rsi && (
                                currentIndicators.rsi > 70
                                  ? "Overbought"
                                  : currentIndicators.rsi < 30
                                  ? "Oversold"
                                  : "Neutral"
                              )}
                            </div>
                          </div>
                        </Card>

                        {/* MACD */}
                        <Card className="bg-slate-700/30 border-slate-600">
                          <div className="p-3">
                            <div className="text-xs text-slate-400 mb-1">
                              MACD
                            </div>
                            <div className="text-sm space-y-1">
                              <div>
                                Line:{" "}
                                <span className="font-semibold">
                                  {currentIndicators.macd?.macdLine.toFixed(4) ||
                                    "N/A"}
                                </span>
                              </div>
                              <div>
                                Signal:{" "}
                                <span className="font-semibold">
                                  {currentIndicators.macd?.signal.toFixed(4) ||
                                    "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Stochastic RSI */}
                        {currentIndicators.stochasticRSI && (
                          <Card className="bg-slate-700/30 border-slate-600">
                            <div className="p-3">
                              <div className="text-xs text-slate-400 mb-1">
                                Stochastic RSI
                              </div>
                              <div className="text-sm space-y-1">
                                <div>
                                  K:{" "}
                                  <span className="font-semibold">
                                    {currentIndicators.stochasticRSI.fastK.toFixed(
                                      1
                                    )}
                                  </span>
                                </div>
                                <div>
                                  D:{" "}
                                  <span className="font-semibold">
                                    {currentIndicators.stochasticRSI.fastD.toFixed(
                                      1
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* ATR */}
                        <Card className="bg-slate-700/30 border-slate-600">
                          <div className="p-3">
                            <div className="text-xs text-slate-400 mb-1">ATR</div>
                            <div className="text-2xl font-bold">
                              {currentIndicators.atr?.value.toFixed(4) || "N/A"}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Volatility: {currentIndicators.atr?.pips.toFixed(1)}
                            </div>
                          </div>
                        </Card>

                        {/* Bollinger Bands */}
                        {currentIndicators.bollingerBands && (
                          <Card className="bg-slate-700/30 border-slate-600 sm:col-span-2">
                            <div className="p-3">
                              <div className="text-xs text-slate-400 mb-2">
                                Bollinger Bands
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Upper:</span>
                                  <span className="font-semibold">
                                    {currentIndicators.bollingerBands.upper.toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Middle (SMA):</span>
                                  <span className="font-semibold">
                                    {currentIndicators.bollingerBands.middle.toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Lower:</span>
                                  <span className="font-semibold">
                                    {currentIndicators.bollingerBands.lower.toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-600">
                                  <span>Bandwidth:</span>
                                  <span>
                                    {currentIndicators.bollingerBands.bandwidth.toFixed(
                                      2
                                    )}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Signals Tab */}
            <TabsContent
              value="signals"
              className="flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
            >
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Trading Signals ({currentSignals.length})
                </h3>

                {currentSignals.length > 0 ? (
                  currentSignals
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((signal, idx) => (
                      <Card
                        key={idx}
                        className="bg-slate-700/30 border-slate-600"
                      >
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {signal.type === "BUY" ? (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-400" />
                              )}
                              <Badge
                                variant={
                                  signal.type === "BUY"
                                    ? "outline"
                                    : "destructive"
                                }
                              >
                                {signal.type}
                              </Badge>
                            </div>
                            <span className="text-xs font-semibold text-slate-400">
                              {signal.confidence}%
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(signal.timestamp * 1000).toLocaleString()}
                          </div>
                        </div>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No signals yet. Waiting for market data...
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent
              value="analysis"
              className="flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
            >
              <div className="space-y-4">
                {currentShiraV6 && (
                  <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        SHIRA V6 Advanced Analysis
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Direction</span>
                          <Badge variant="outline">
                            {currentShiraV6.direction}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Confidence</span>
                          <span className="font-semibold">
                            {currentShiraV6.confidence}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Risk Level</span>
                          <Badge variant="outline">
                            {currentShiraV6.riskLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {currentCondition && (
                  <Card className="bg-slate-700/30 border-slate-600">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold mb-3">
                        Market Condition
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Trend</span>
                          <Badge variant="outline">
                            {currentCondition.trend}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Strength</span>
                          <span className="font-semibold">
                            {currentCondition.strength}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Volatility</span>
                          <span
                            className={
                              currentCondition.volatility === "High"
                                ? "text-red-400"
                                : currentCondition.volatility === "Low"
                                ? "text-green-400"
                                : "text-yellow-400"
                            }
                          >
                            {currentCondition.volatility}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Risk/Reward */}
                {takeProfit && stopLoss && (
                  <Card className="bg-slate-700/30 border-slate-600">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold mb-3">
                        Risk Management
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Take Profit</span>
                          <span className="font-semibold text-green-400">
                            ${formatPrice(takeProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Stop Loss</span>
                          <span className="font-semibold text-red-400">
                            ${formatPrice(stopLoss)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-600 pt-2 mt-2">
                          <span className="text-slate-400">Risk/Reward</span>
                          <span className="font-semibold text-blue-400">
                            {riskReward.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
