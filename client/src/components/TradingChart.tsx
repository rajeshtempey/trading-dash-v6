import { useEffect, useRef, useState } from "react";
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  CandlestickSeries,
  LineSeries,
  HistogramSeries
} from "lightweight-charts";
import { useTheme } from "./ThemeProvider";
import type { Candle, SignalMarker, TechnicalIndicators } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Target, ShieldAlert, ArrowRight, Pencil, Trash2 } from "lucide-react";

function getSignalColor(type: 'BUY'|'SELL'|'SIDEWAYS') {
  if (type === 'BUY') return 'text-green-500';
  if (type === 'SELL') return 'text-red-500';
  return 'text-yellow-500';
}

function getSignalIcon(type: 'BUY'|'SELL'|'SIDEWAYS') {
  if (type === 'BUY') return <TrendingUp className="h-4 w-4" />;
  if (type === 'SELL') return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

interface TradingChartProps {
  candles: Candle[];
  signals: SignalMarker[];
  indicators: TechnicalIndicators | null;
  showEma8: boolean;
  showEma34: boolean;
  showVolume: boolean;
  takeProfit?: number;
  stopLoss?: number;
  currentPrice?: number;
  fillParent?: boolean;
  timeframe?: string;
}

export function TradingChart({
  candles,
  signals,
  indicators,
  showEma8,
  showEma34,
  showVolume,
  takeProfit,
  stopLoss,
  fillParent,
  timeframe = '1m',
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seriesRef = useRef<any>({});
  const previousCandleLengthRef = useRef<number>(0);
  const emaStateRef = useRef<{ ema8: number; ema34: number }>({ ema8: 0, ema34: 0 });
  // overlay removed — using native chart markers instead for proper anchoring
  const [labelPositions, setLabelPositions] = useState<Array<{ time: number; x: number; y: number; type: 'BUY'|'SELL'|'SIDEWAYS'; label: string }>>([]);
  const { theme } = useTheme();
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [latestSignal, setLatestSignal] = useState<SignalMarker | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolColor, setToolColor] = useState('#2962FF');
  const [drawings, setDrawings] = useState<any[]>([]);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; text: string; show: boolean }>({ x: 0, y: 0, text: '', show: false });

  useEffect(() => {
    if (signals.length > 0) setLatestSignal(signals[signals.length - 1]);
  }, [signals]);

  // Handle timeframe changes by clearing chart data and resetting state
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    const { candleSeries, ema8Series, ema34Series, volumeSeries, tpSeries, slSeries } = seriesRef.current;

    // Clear all series data when timeframe changes
    try {
      candleSeries.setData([]);
      ema8Series.setData([]);
      ema34Series.setData([]);
      volumeSeries.setData([]);
      tpSeries.setData([]);
      slSeries.setData([]);
    } catch (e) {
      // Ignore errors during clearing
    }

    // Reset tracking state
    previousCandleLengthRef.current = 0;
    emaStateRef.current = { ema8: 0, ema34: 0 };
  }, [timeframe]);

  // Handle responsive resizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        const width = containerRef.current.clientWidth;
        let height = window.innerWidth < 768 ? 300 : window.innerWidth < 1024 ? 400 : 500;
        // no-op
        // if requested, fill parent container height
        if ((fillParent) && containerRef.current) {
          const parent = containerRef.current.parentElement;
          if (parent) {
            const parentRect = parent.getBoundingClientRect();
            height = Math.max(200, parentRect.height - 20);
          }
        }
        setChartSize({ width, height });
        chartRef.current.applyOptions({ width, height });
      }
    };

    window.addEventListener("resize", handleResize);
    // small timeout to allow layout to settle
    setTimeout(handleResize, 50);
    return () => window.removeEventListener("resize", handleResize);
  }, [fillParent]);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const isDark = theme === "dark";
    const chart = createChart(containerRef.current, {
      width: chartSize.width || 800,
      height: chartSize.height || 500,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#e5e7eb" : "#374151",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const ema8Series = chart.addSeries(LineSeries, { color: "#3b82f6", lineWidth: 2 });
    const ema34Series = chart.addSeries(LineSeries, { color: "#f97316", lineWidth: 2 });
    const volumeSeries = chart.addSeries(HistogramSeries, { 
      color: isDark ? "rgba(100,100,100,0.5)" : "rgba(150,150,150,0.5)",
      priceScaleId: "volume",
    });
    const tpSeries = chart.addSeries(LineSeries, { color: "#22c55e", lineWidth: 1, lineStyle: 2 });
    const slSeries = chart.addSeries(LineSeries, { color: "#ef4444", lineWidth: 1, lineStyle: 2 });

    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    seriesRef.current = { candleSeries, ema8Series, ema34Series, volumeSeries, tpSeries, slSeries };

    chart.subscribeCrosshairMove((param: any) => {
      if (param.time) {
        const candle = candles.find((c) => c.time === param.time);
        setHoveredCandle(candle || null);
      }
    });

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [theme, chartSize]);

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    const { candleSeries, ema8Series, ema34Series, volumeSeries, tpSeries, slSeries } = seriesRef.current;
    const prevLength = previousCandleLengthRef.current;
    const isInitial = prevLength === 0;

    // Helper function to calculate EMA incrementally
    const calculateEMAIncremental = (currentEMA: number, newValue: number, period: number) => {
      const k = 2 / (period + 1);
      return newValue * k + currentEMA * (1 - k);
    };

    if (isInitial) {
      // First load: set all historical data at once
      const chartData = candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeries.setData(chartData);

      const volumeData = candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
      }));
      volumeSeries.setData(volumeData);

      // Calculate initial EMAs
      const closes = candles.map(c => c.close);
      let ema8 = closes[0];
      let ema34 = closes[0];
      const k8 = 2 / (8 + 1);
      const k34 = 2 / (34 + 1);

      const ema8Data: Array<{ time: number; value: number }> = [{ time: candles[0].time, value: ema8 }];
      const ema34Data: Array<{ time: number; value: number }> = [{ time: candles[0].time, value: ema34 }];

      for (let i = 1; i < closes.length; i++) {
        ema8 = closes[i] * k8 + ema8 * (1 - k8);
        ema34 = closes[i] * k34 + ema34 * (1 - k34);
        ema8Data.push({ time: candles[i].time, value: ema8 });
        ema34Data.push({ time: candles[i].time, value: ema34 });
      }

      emaStateRef.current = { ema8, ema34 };
      ema8Series.setData(ema8Data);
      ema34Series.setData(ema34Data);

      // Set TP/SL lines
      if (candles.length > 1) {
        const startTime = candles[0].time;
        const endTime = candles[candles.length - 1].time;
        if (takeProfit) {
          tpSeries.setData([{ time: startTime, value: takeProfit }, { time: endTime, value: takeProfit }]);
        }
        if (stopLoss) {
          slSeries.setData([{ time: startTime, value: stopLoss }, { time: endTime, value: stopLoss }]);
        }
      }

      // Only fit content on initial load
      chartRef.current.timeScale().fitContent();
    } else if (candles.length > prevLength) {
      // Incremental update: only add new candles
      const newCandles = candles.slice(prevLength);
      
      // Update candlestick data incrementally
      newCandles.forEach((c) => {
        const newCandle = {
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        };
        candleSeries.update(newCandle);
      });

      // Update volume incrementally
      newCandles.forEach((c) => {
        const volumePoint = {
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
        };
        volumeSeries.update(volumePoint);
      });

      // Update EMAs incrementally
      let ema8 = emaStateRef.current.ema8;
      let ema34 = emaStateRef.current.ema34;
      const k8 = 2 / (8 + 1);
      const k34 = 2 / (34 + 1);

      newCandles.forEach((c) => {
        ema8 = c.close * k8 + ema8 * (1 - k8);
        ema34 = c.close * k34 + ema34 * (1 - k34);
        ema8Series.update({ time: c.time, value: ema8 });
        ema34Series.update({ time: c.time, value: ema34 });
      });

      emaStateRef.current = { ema8, ema34 };

      // Update TP/SL lines only if they changed
      if (candles.length > 1) {
        const startTime = candles[0].time;
        const endTime = candles[candles.length - 1].time;
        if (takeProfit) {
          tpSeries.setData([{ time: startTime, value: takeProfit }, { time: endTime, value: takeProfit }]);
        }
        if (stopLoss) {
          slSeries.setData([{ time: startTime, value: stopLoss }, { time: endTime, value: stopLoss }]);
        }
      }

      // Do NOT call fitContent() on incremental updates to preserve viewport
    }

    previousCandleLengthRef.current = candles.length;
  }, [candles, takeProfit, stopLoss]);

  // Use chart-native markers so arrows/markers move correctly with zoom/pan.
  // Deduplicate signals per candle time so only one marker appears per candle.
  useEffect(() => {
    if (!seriesRef.current || !seriesRef.current.candleSeries) return;
    const candleSeries = seriesRef.current.candleSeries;

    let cleanup = () => {};
    try {
      if (!Array.isArray(signals) || signals.length === 0) {
        candleSeries.setMarkers([]);
        return;
      }

      // Group signals by time and pick a single signal per time.
      const byTime = new Map<number, typeof signals[0]>();
      const precedence: Record<string, number> = { 'BUY': 3, 'SELL': 2, 'SIDEWAYS': 1 };
      for (const s of signals) {
        const existing = byTime.get(s.time);
        if (!existing) {
          byTime.set(s.time, s);
          continue;
        }
        // Choose by higher confidence first, then by precedence
        if ((s.confidence ?? 0) > (existing.confidence ?? 0)) {
          byTime.set(s.time, s);
        } else if ((s.confidence ?? 0) === (existing.confidence ?? 0)) {
          if ((precedence[s.type] ?? 0) > (precedence[existing.type] ?? 0)) {
            byTime.set(s.time, s);
          }
        }
      }

      const uniqueSignals = Array.from(byTime.values()).sort((a, b) => a.time - b.time);

      const markers = uniqueSignals.map((s) => {
        const color = s.type === 'BUY' ? '#16a34a' : s.type === 'SELL' ? '#dc2626' : '#f59e0b';
        // BUY: upward arrow below candle (green)
        if (s.type === 'BUY') {
          return { time: s.time as any, position: 'below' as any, color, shape: 'arrowUp' as any, text: 'BUY' } as any;
        }
        // SELL: downward arrow above candle (red)
        if (s.type === 'SELL') {
          return { time: s.time as any, position: 'above' as any, color, shape: 'arrowDown' as any, text: 'SELL' } as any;
        }
        // SIDEWAYS: yellow/orange circle with label positioned below
        return { time: s.time as any, position: 'below' as any, color, shape: 'circle' as any, text: 'SIDEWAYS' } as any;
      });

      // Debug: log markers being set and whether setMarkers exists (don't include full marker payload in prod)
      let nativeSupported = typeof candleSeries.setMarkers === 'function';
      try {
        // eslint-disable-next-line no-console
        console.debug('[TradingChart] setting native markers', { count: markers.length, nativeSupported });
      } catch (e) {}

      if (nativeSupported) {
        try {
          candleSeries.setMarkers(markers);
        } catch (e) {
          nativeSupported = false;
          try { // eslint-disable-next-line no-console
            console.warn('[TradingChart] native setMarkers failed, falling back to overlay');
          } catch (err) {}
        }
      }

      // If native markers are not available, compute overlay positions and subscribe to updates.
      if (!nativeSupported) {
        let scheduled = false;
        const computePositionsThrottled = () => {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(() => {
            scheduled = false;
            try {
              const chartApi = chartRef.current;
              const seriesApi = seriesRef.current.candleSeries;
              const timeScale = chartApi?.timeScale?.();
              if (!chartApi || !seriesApi || !timeScale) return;

              const positions: Array<{ time: number; x: number; y: number; type: 'BUY'|'SELL'|'SIDEWAYS'; label: string }> = [];
              const container = containerRef.current;
              if (!container) return;

              for (const s of uniqueSignals) {
                if (typeof timeScale.timeToCoordinate !== 'function' || typeof seriesApi.priceToCoordinate !== 'function') continue;
                const x = timeScale.timeToCoordinate(s.time as any);
                const price = typeof s.price === 'number' ? s.price : candles.find(c => c.time === s.time)?.close;
                if (price == null) continue;
                const y = seriesApi.priceToCoordinate(price as any);
                if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
                  positions.push({ time: s.time, x, y, type: s.type, label: s.label ?? s.type });
                }
              }

              setLabelPositions(positions);
              try {
                // eslint-disable-next-line no-console
                console.debug('[TradingChart] computed overlay positions (fallback)', { count: positions.length, containerRect: container.getBoundingClientRect?.() });
              } catch (e) {}
            } catch (e) {
              // ignore
            }
          });
        };

        // initial compute
        computePositionsThrottled();

        // subscribe to chart updates
        const chartApi = chartRef.current;
        const timeScale = chartApi?.timeScale?.();
        const unsubTime = timeScale?.subscribeVisibleTimeRangeChange?.(computePositionsThrottled) ?? (() => {});
        const unsubSize = chartApi?.subscribeSizeChange?.(computePositionsThrottled) ?? (() => {});
        window.addEventListener('resize', computePositionsThrottled);

        cleanup = () => {
          try { unsubTime && typeof unsubTime === 'function' && unsubTime(); } catch (e) {}
          try { unsubSize && typeof unsubSize === 'function' && unsubSize(); } catch (e) {}
          window.removeEventListener('resize', computePositionsThrottled);
        };
      } else {
        // native markers used — clear any overlay labels
        setLabelPositions([]);
        cleanup = () => {};
      }

      // attach cleanup to effect lifecycle
      // (we'll return cleanup at end of useEffect)
    } catch (e) {
      // ignore marker errors
    }
    return cleanup;
  }, [signals, candles]);

  // Initialize canvas when active tool changes
  useEffect(() => {
    if (!activeTool || !canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match container
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw existing drawings
    drawings.forEach((drawing) => {
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(drawing.startX, drawing.startY);
      ctx.lineTo(drawing.endX, drawing.endY);
      ctx.stroke();
    });
  }, [activeTool, drawings]);

  const drawingState = useRef<{ startX: number; startY: number; isDrawing: boolean }>({ startX: 0, startY: 0, isDrawing: false });

  const handleDrawStart = (e: React.MouseEvent) => {
    if (!activeTool) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    drawingState.current = {
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      isDrawing: true,
    };
  };

  const handleDrawMove = (e: React.MouseEvent) => {
    if (!drawingState.current.isDrawing || !canvasRef.current || !activeTool) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear and redraw
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw all previous drawings
    drawings.forEach((drawing) => {
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(drawing.startX, drawing.startY);
      ctx.lineTo(drawing.endX, drawing.endY);
      ctx.stroke();
    });

    // Draw current drawing being made
    ctx.strokeStyle = toolColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(drawingState.current.startX, drawingState.current.startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  };

  const handleDrawEnd = (e: React.MouseEvent | null) => {
    if (!drawingState.current.isDrawing) return;
    drawingState.current.isDrawing = false;

    if (!e || !canvasRef.current || !activeTool) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const newDrawing = {
      id: Date.now(),
      type: activeTool,
      startX: drawingState.current.startX,
      startY: drawingState.current.startY,
      endX,
      endY,
      color: toolColor,
    };

    setDrawings([...drawings, newDrawing]);
  };

  return (
    <Card className="p-3 sm:p-4 w-full transition-all duration-300 hover-elevate" data-testid="trading-chart">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto pb-2 sm:pb-0">
          {/* Drawing Tools Toolbar */}
          <div className="flex items-center gap-1 bg-secondary/50 p-2 rounded-lg border border-secondary">
            <Button
              variant={activeTool === 'trendline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool(activeTool === 'trendline' ? null : 'trendline')}
              className="h-8 w-8 p-0"
              title="Trend Line"
            >
              <ArrowRight className="h-4 w-4 rotate-45" />
            </Button>
            <Button
              variant={activeTool === 'horizontal' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool(activeTool === 'horizontal' ? null : 'horizontal')}
              className="h-8 w-8 p-0"
              title="Horizontal Line"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'arrow' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool(activeTool === 'arrow' ? null : 'arrow')}
              className="h-8 w-8 p-0"
              title="Arrow"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'annotation' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool(activeTool === 'annotation' ? null : 'annotation')}
              className="h-8 w-8 p-0"
              title="Text Annotation"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <div className="w-8 h-8 rounded border border-secondary cursor-pointer" style={{ backgroundColor: toolColor }}>
              <input
                type="color"
                value={toolColor}
                onChange={(e) => setToolColor(e.target.value)}
                className="w-full h-full cursor-pointer opacity-0"
                title="Tool Color"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDrawings([]);
                setActiveTool(null);
              }}
              className="h-8 w-8 p-0"
              title="Clear All"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {takeProfit !== undefined && (
            <div className="flex items-center gap-1 text-green-500 text-xs sm:text-sm">
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">TP:</span>
              <span className="font-mono">${takeProfit.toFixed(0)}</span>
            </div>
          )}
          {stopLoss !== undefined && (
            <div className="flex items-center gap-1 text-red-500 text-xs sm:text-sm">
              <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">SL:</span>
              <span className="font-mono">${stopLoss.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>

      {latestSignal && (
        <div className={`flex items-center gap-2 mb-4 p-2 sm:p-3 rounded-lg text-sm transition-all ${
          latestSignal.type === "BUY" ? "bg-green-500/10 border border-green-500/20" :
          latestSignal.type === "SELL" ? "bg-red-500/10 border border-red-500/20" :
          "bg-yellow-500/10 border border-yellow-500/20"
        }`}>
          <div className={getSignalColor(latestSignal.type)}>
            {getSignalIcon(latestSignal.type)}
          </div>
          <span className={`font-semibold ${getSignalColor(latestSignal.type)}`}>
            {latestSignal.type}
          </span>
          <Badge variant="secondary" className="text-xs">
            {latestSignal.holdingTime}
          </Badge>
          <Badge variant="outline" className="text-xs ml-auto">
            {latestSignal.confidence}%
          </Badge>
        </div>
      )}

      {/* Candle Signal Legend */}
      <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-secondary">
        <div className="text-xs font-semibold text-muted-foreground mb-2">CANDLE SIGNALS & LINES:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Candle Signals */}
          <div className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
            <span className="text-green-600 dark:text-green-400 font-semibold">BUY</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <span className="text-red-600 dark:text-red-400 font-semibold">SELL</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">SIDEWAYS</span>
          </div>

          {/* TP/SL Lines */}
          <div 
            className="flex items-center gap-2 text-xs cursor-help group relative"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPos({ x: rect.left, y: rect.top - 30, text: 'Take Profit Target Level', show: true });
            }}
            onMouseLeave={() => setTooltipPos({ ...tooltipPos, show: false })}
          >
            <span className="h-0.5 w-4 bg-green-500" style={{ borderTop: '2px dashed #22c55e' }}></span>
            <span className="text-green-600 dark:text-green-400 font-semibold">TP</span>
          </div>

          <div 
            className="flex items-center gap-2 text-xs cursor-help group relative"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPos({ x: rect.left, y: rect.top - 30, text: 'Stop Loss Protection Level', show: true });
            }}
            onMouseLeave={() => setTooltipPos({ ...tooltipPos, show: false })}
          >
            <span className="h-0.5 w-4 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }}></span>
            <span className="text-red-600 dark:text-red-400 font-semibold">SL</span>
          </div>

          <div 
            className="flex items-center gap-2 text-xs cursor-help group relative"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPos({ x: rect.left, y: rect.top - 30, text: 'Exponential Moving Average (8)', show: true });
            }}
            onMouseLeave={() => setTooltipPos({ ...tooltipPos, show: false })}
          >
            <span className="h-0.5 w-4 bg-blue-500"></span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">EMA8</span>
          </div>

          <div 
            className="flex items-center gap-2 text-xs cursor-help group relative"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPos({ x: rect.left, y: rect.top - 30, text: 'Exponential Moving Average (34)', show: true });
            }}
            onMouseLeave={() => setTooltipPos({ ...tooltipPos, show: false })}
          >
            <span className="h-0.5 w-4 bg-orange-500"></span>
            <span className="text-orange-600 dark:text-orange-400 font-semibold">EMA34</span>
          </div>
        </div>
      </div>

      <div className="relative w-full rounded-lg">
        <div ref={containerRef} className="w-full rounded-lg overflow-hidden trading-chart-container relative" data-testid="chart-container" />
        {/* Canvas overlay for drawing tools */}
        {activeTool && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair z-40 rounded-lg"
            style={{ pointerEvents: 'auto' }}
            onMouseDown={(e) => handleDrawStart(e)}
            onMouseMove={(e) => handleDrawMove(e)}
            onMouseUp={(e) => handleDrawEnd(e)}
            onMouseLeave={() => {
              if (drawingState.current.isDrawing) {
                handleDrawEnd(null);
              }
            }}
          />
        )}
        <div className="absolute inset-0 pointer-events-none">
          {labelPositions.map((m, idx) => {
            const isSell = m.type === 'SELL';
            const offsetY = isSell ? -20 : -6; // SELL label above marker, BUY/SIDEWAYS slightly above/below as needed
            const bg = m.type === 'BUY' ? 'bg-green-500' : m.type === 'SELL' ? 'bg-red-500' : 'bg-yellow-500';
            const textCol = m.type === 'BUY' ? 'text-green-800' : m.type === 'SELL' ? 'text-red-700' : 'text-yellow-700';

            return (
              <div
                key={`label-${idx}-${m.time}`}
                style={{ left: `${m.x}px`, top: `${m.y + offsetY}px`, transform: 'translate(-50%, -100%)' }}
                className="absolute flex flex-col items-center pointer-events-none z-30"
              >
                <div className={`text-xs font-semibold ${textCol} drop-shadow-sm`}>{m.label}</div>
                <div className="mt-1">
                  {m.type === 'SIDEWAYS' ? (
                    <span className={`${bg} h-4 w-4 rounded-full inline-block`} />
                  ) : (
                    <div className={`${bg} text-white h-5 w-5 rounded flex items-center justify-center`}>{m.type === 'BUY' ? '↑' : '↓'}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip for legend items */}
        {tooltipPos.show && (
          <div
            className="absolute bg-black text-white text-xs py-1 px-2 rounded shadow-lg z-50 whitespace-nowrap pointer-events-none"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {tooltipPos.text}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent border-t-black"></div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
