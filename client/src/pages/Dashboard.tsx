import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { TradingChart } from "@/components/TradingChart";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { TradingInsights } from "@/components/TradingInsights";
import { TechnicalIndicatorsPanel } from "@/components/TechnicalIndicatorsPanel";
import { SignalsPanel } from "@/components/SignalsPanel";
import { AdvancedMetricsPanel } from "@/components/AdvancedMetricsPanel";
import { MLPredictions } from "@/components/MLPredictions";
import { AdvancedPatternRecognition } from "@/components/AdvancedPatternRecognition";
import { ShiraV6ConfidenceMeter } from "@/components/ShiraV6ConfidenceMeter";
import { LiquidationZoneAnalyzer } from "@/components/LiquidationZoneAnalyzer";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Menu, X, AlertCircle, ChevronRight } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import TimeToProfitPredictor from "@/components/TimeToProfitPredictor";
import type { Asset } from "@shared/schema";

type PanelType = "signals" | "indicators" | "insights" | "metrics" | "ml" | "patterns" | "tpp" | "shira" | "liquidation" | null;

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>("SOL");
  const [timeframe, setTimeframe] = useState<string>("1m");
  const [showEma8, setShowEma8] = useState(true);
  const [showEma34, setShowEma34] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<PanelType>(null);
  const [signalThreshold, setSignalThreshold] = useState(1);
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch real-time data via WebSocket
  const wsData = useWebSocket(selectedAsset, timeframe, undefined, "USD");
  const marketData = (wsData?.marketData || {}) as Record<Asset, any>;
  const candles = (wsData?.candles || {}) as Record<Asset, any>;
  const signals = (wsData?.signals || {}) as Record<Asset, any>;
  const indicators = (wsData?.indicators || {}) as Record<Asset, any>;
  const conditions = (wsData?.conditions || {}) as Record<Asset, any>;
  const mlPredictions = (wsData?.mlPredictions || {}) as Record<Asset, any>;
  const patterns = (wsData?.patterns || {}) as Record<Asset, any>;
  const signalBoost = (wsData?.signalBoost || {}) as Record<Asset, any>;
  const shiraV6Signals = (wsData?.shiraV6Signals || {}) as Record<Asset, any>;
  const isConnected = wsData?.isConnected ?? true;
  const error = wsData?.error ?? null;

  const currentCandles = candles[selectedAsset] || [];
  const currentSignals = signals[selectedAsset] || [];
  const currentIndicators = indicators[selectedAsset] || null;
  const currentCondition = conditions[selectedAsset] || null;
  const currentPrice = marketData[selectedAsset]?.price || 0;
  const currentMLPredictions = mlPredictions[selectedAsset] || null;
  const currentPatterns = patterns[selectedAsset] || [];
  const currentSignalBoost = signalBoost[selectedAsset] || null;
  const currentShiraV6Signal = shiraV6Signals[selectedAsset] || null;
  
  // Extract TP/SL from indicators (now includes these values)
  const takeProfit = currentIndicators?.takeProfit || 0;
  const stopLoss = currentIndicators?.stopLoss || 0;
  const riskReward = currentIndicators?.riskReward || 0;

  const handleTimeframeChange = (tf: string) => setTimeframe(tf);
  const handleExportPdf = useCallback(() => {}, []);

  const menuItems: Array<{ id: PanelType; label: string; icon: string }> = [
    { id: "signals", label: "Trading Signals", icon: "📊" },
    { id: "indicators", label: "Technical Indicators", icon: "📈" },
    { id: "insights", label: "Market Insights", icon: "💡" },
    { id: "metrics", label: "Advanced Metrics", icon: "🎯" },
    { id: "patterns", label: "Pattern Recognition", icon: "🔍" },
    { id: "ml", label: "ML Predictions", icon: "🧠" },
    { id: "shira", label: "SHIRA V6 Analysis", icon: "🚀" },
    { id: "tpp", label: "Time to Profit", icon: "⏱️" },
    { id: "liquidation", label: "Liquidation Zones", icon: "⚠️" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        selectedAsset={selectedAsset}
        onAssetChange={setSelectedAsset}
        marketData={marketData}
        onExportPdf={handleExportPdf}
        takeProfit={takeProfit}
        stopLoss={stopLoss}
        riskReward={riskReward}
        currentPrice={currentPrice}
        timeframe={timeframe}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:w-72 border-r bg-muted/30 flex-col p-4 space-y-2 overflow-hidden z-30">
          <h3 className="text-sm font-semibold px-2 mb-2">Analysis Panels</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={selectedPanel === item.id ? "default" : "ghost"}
                className="justify-start gap-2 h-auto py-2 px-3 min-w-0"
                onClick={() => setSelectedPanel(selectedPanel === item.id ? null : item.id)}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-left text-sm truncate">{item.label}</span>
                {selectedPanel === item.id && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              </Button>
            ))}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <div className={`lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-background border-r z-50 transform transition-transform duration-300 overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 space-y-2">
            <h3 className="text-sm font-semibold px-2 mb-2">Analysis Panels</h3>
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={selectedPanel === item.id ? "default" : "ghost"}
                className="w-full justify-start gap-2 h-auto py-2 px-3"
                onClick={() => {
                  setSelectedPanel(selectedPanel === item.id ? null : item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {selectedPanel === item.id && <ChevronRight className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-72">
          <main className="flex-1 flex flex-col overflow-hidden px-2 sm:px-4 py-1 sm:py-2">
            {(!isConnected || error) && (
              <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-xs sm:text-sm">Live Market Data Unavailable</div>
                  <div className="text-xs">{error ?? "Connecting..."}</div>
                </div>
              </div>
            )}

            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-3">
              <div className="flex items-center gap-2">
                <TimeframeSelector selectedTimeframe={timeframe} onTimeframeChange={handleTimeframeChange} />
                <div className="flex items-center gap-1 px-2 py-1 rounded border text-xs whitespace-nowrap bg-gradient-to-r from-slate-500/10 to-slate-600/10 border-slate-500/20 hover:from-slate-500/15 hover:to-slate-600/15 transition-colors duration-300">
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span>{isConnected ? "Live" : "Offline"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <div className="font-mono font-black text-2xl whitespace-nowrap text-emerald-500 drop-shadow-lg">${currentPrice.toFixed(2)}</div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                  className="lg:hidden h-8 w-8"
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Responsive Layout */}
            <div className="flex-1 flex gap-2 overflow-hidden">
              {/* Chart - Full width on mobile, flexible on desktop */}
              <div className="flex-1 border rounded overflow-hidden flex flex-col min-h-0 min-w-0">
                <div ref={chartRef} className="flex-1 overflow-hidden">
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
              </div>

              {/* Right Sidebar - Desktop Only, Mobile Modal */}
              {selectedPanel && (
                <div className="hidden lg:flex lg:w-80 border rounded overflow-hidden bg-muted/20 flex-col min-h-0">
                  <div className="px-3 py-2 border-b bg-muted/40 flex-shrink-0">
                    <h4 className="font-semibold text-sm">{menuItems.find(m => m.id === selectedPanel)?.label}</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 text-sm">
                    <PanelContent
                      panel={selectedPanel}
                      currentSignals={currentSignals}
                      currentIndicators={currentIndicators}
                      currentCondition={currentCondition}
                      currentPrice={currentPrice}
                      marketData={marketData[selectedAsset]}
                      showEma8={showEma8}
                      showEma34={showEma34}
                      showVolume={showVolume}
                      setShowEma8={setShowEma8}
                      setShowEma34={setShowEma34}
                      setShowVolume={setShowVolume}
                      currentPatterns={currentPatterns}
                      currentMLPredictions={currentMLPredictions}
                      currentSignalBoost={currentSignalBoost}
                      selectedAsset={selectedAsset}
                      signalThreshold={signalThreshold}
                      currentShiraV6Signal={currentShiraV6Signal}
                      timeframe={timeframe}
                    />
                  </div>
                </div>
              )}

              {/* Mobile Analysis Panel (Bottom Sheet / Full Screen) */}
              {selectedPanel && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center">
                  <div className="w-full sm:max-w-lg max-h-[80vh] bg-background rounded-t-lg sm:rounded-lg border flex flex-col">
                    <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                      <h4 className="font-semibold text-sm">{menuItems.find(m => m.id === selectedPanel)?.label}</h4>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSelectedPanel(null)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 text-sm">
                      <PanelContent
                        panel={selectedPanel}
                        currentSignals={currentSignals}
                        currentIndicators={currentIndicators}
                        currentCondition={currentCondition}
                        currentPrice={currentPrice}
                        marketData={marketData[selectedAsset]}
                        showEma8={showEma8}
                        showEma34={showEma34}
                        showVolume={showVolume}
                        setShowEma8={setShowEma8}
                        setShowEma34={setShowEma34}
                        setShowVolume={setShowVolume}
                        currentPatterns={currentPatterns}
                        currentMLPredictions={currentMLPredictions}
                        currentSignalBoost={currentSignalBoost}
                        selectedAsset={selectedAsset}
                        signalThreshold={signalThreshold}
                        currentShiraV6Signal={currentShiraV6Signal}
                        timeframe={timeframe}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Helper component to render panel content
function PanelContent({
  panel,
  currentSignals,
  currentIndicators,
  currentCondition,
  currentPrice,
  marketData,
  showEma8,
  showEma34,
  showVolume,
  setShowEma8,
  setShowEma34,
  setShowVolume,
  currentPatterns,
  currentMLPredictions,
  currentSignalBoost,
  selectedAsset,
  signalThreshold,
  currentShiraV6Signal,
  timeframe,
}: {
  panel: PanelType;
  currentSignals: any[];
  currentIndicators: any;
  currentCondition: any;
  currentPrice: number;
  marketData: any;
  showEma8: boolean;
  showEma34: boolean;
  showVolume: boolean;
  setShowEma8: (v: boolean) => void;
  setShowEma34: (v: boolean) => void;
  setShowVolume: (v: boolean) => void;
  currentPatterns: any[];
  currentMLPredictions: any;
  currentSignalBoost: any;
  selectedAsset: Asset;
  signalThreshold: number;
  currentShiraV6Signal: any;
  timeframe: string;
}) {
  switch (panel) {
    case "signals":
      return (
        <SignalsPanel
          signals={currentSignals}
          onSignalClick={() => {}}
          threshold={signalThreshold}
          currency="USD"
        />
      );
    case "indicators":
      return (
        <TechnicalIndicatorsPanel
          indicators={currentIndicators}
          showEma8={showEma8}
          showEma34={showEma34}
          showVolume={showVolume}
          onToggleEma8={setShowEma8}
          onToggleEma34={setShowEma34}
          onToggleVolume={setShowVolume}
        />
      );
    case "insights":
      return (
        <TradingInsights
          condition={currentCondition}
          indicators={currentIndicators}
          marketData={marketData || null}
        />
      );
    case "metrics":
      return (
        <AdvancedMetricsPanel
          confluence={currentIndicators ? {
            emaConfluence: (currentIndicators.ema8 > currentIndicators.ema34) ? 85 : 15,
            rsiConfluence: Math.min(100, Math.max(0, (currentIndicators.rsi || 50) * 1.2)),
            bollingerConfluence: currentIndicators.bollingerBands ? Math.abs((currentIndicators.bollingerBands.percentB || 0.5) - 0.5) * 200 : 50,
            macdConfluence: ((currentIndicators.macd || 0) > 0) ? 75 : 25,
            volumeConfluence: 60,
            overallScore: 65,
          } : undefined}
          sentiment={currentIndicators ? {
            score: ((currentIndicators.rsi || 50) - 50) * 2,
            label: (currentIndicators.rsi || 50) > 70 ? 'Extreme Greed' : (currentIndicators.rsi || 50) < 30 ? 'Extreme Fear' : 'Neutral',
            volumeSentiment: 0,
            priceSentiment: ((currentIndicators.rsi || 50) - 50) * 2,
          } : undefined}
          riskMetrics={{
            drawdownRisk: 12.5,
            volatilityRank: currentIndicators?.volatility || 50,
            sharpeRatio: 1.85,
            calmarRatio: 2.1,
            profitFactor: 1.65,
          }}
          supportResistance={{
            strongestSupport: currentIndicators?.support || 0,
            strongestResistance: currentIndicators?.resistance || 0,
            supports: [currentIndicators?.support || 0],
            resistances: [currentIndicators?.resistance || 0],
          }}
        />
      );
    case "patterns":
      return currentPatterns.length > 0 ? <AdvancedPatternRecognition /> : <div className="text-muted-foreground text-center py-4">No patterns detected</div>;
    case "ml":
      return currentMLPredictions ? (
        <MLPredictions 
          asset={selectedAsset}
          mlPredictions={currentMLPredictions}
          signalBoost={currentSignalBoost}
        />
      ) : (
        <div className="text-muted-foreground text-center py-4">Loading ML predictions...</div>
      );
    case "shira":
      return <ShiraV6ConfidenceMeter signal={currentShiraV6Signal} isLoading={!currentShiraV6Signal} timeframe={timeframe} />;
    case "tpp":
      return <TimeToProfitPredictor />;
    case "liquidation":
      return <LiquidationZoneAnalyzer currentPrice={currentPrice} high24h={marketData?.high24h} low24h={marketData?.low24h} />;
    default:
      return null;
  }
}
