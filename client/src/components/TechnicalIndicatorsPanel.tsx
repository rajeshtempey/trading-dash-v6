import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Activity, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import type { TechnicalIndicators } from "@shared/schema";

interface TechnicalIndicatorsPanelProps {
  indicators: TechnicalIndicators | null;
  showEma8: boolean;
  showEma34: boolean;
  showVolume: boolean;
  onToggleEma8: (value: boolean) => void;
  onToggleEma34: (value: boolean) => void;
  onToggleVolume: (value: boolean) => void;
}

export function TechnicalIndicatorsPanel({
  indicators,
  showEma8,
  showEma34,
  showVolume,
  onToggleEma8,
  onToggleEma34,
  onToggleVolume,
}: TechnicalIndicatorsPanelProps) {
  const getRsiColor = (rsi: number) => {
    if (rsi >= 70) return "text-red-500";
    if (rsi <= 30) return "text-green-500";
    return "text-yellow-500";
  };

  const getRsiLabel = (rsi: number) => {
    if (rsi >= 70) return "Overbought";
    if (rsi <= 30) return "Oversold";
    return "Neutral";
  };

  const getMacdSignal = (macd: number, signal: number) => {
    if (macd > signal) return { label: "Bullish", color: "text-green-500" };
    if (macd < signal) return { label: "Bearish", color: "text-red-500" };
    return { label: "Neutral", color: "text-yellow-500" };
  };

  const formatValue = (value: number | undefined, decimals: number = 2) => {
    if (value === undefined) return "—";
    return value.toFixed(decimals);
  };

  return (
    <Card data-testid="technical-indicators-panel">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <LineChart className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Technical Indicators</span>
          <span className="sm:hidden">Indicators</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-4">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <Label htmlFor="ema8" className="text-xs sm:text-sm cursor-pointer">EMA 8</Label>
            </div>
            <div className="flex items-center gap-2">
              {indicators && showEma8 && (
                <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                  {formatValue(indicators.ema8)}
                </span>
              )}
              <Switch
                id="ema8"
                checked={showEma8}
                onCheckedChange={onToggleEma8}
                data-testid="toggle-ema8"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500 flex-shrink-0" />
              <Label htmlFor="ema34" className="text-xs sm:text-sm cursor-pointer">EMA 34</Label>
            </div>
            <div className="flex items-center gap-2">
              {indicators && showEma34 && (
                <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                  {formatValue(indicators.ema34)}
                </span>
              )}
              <Switch
                id="ema34"
                checked={showEma34}
                onCheckedChange={onToggleEma34}
                data-testid="toggle-ema34"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-muted-foreground" />
              <Label htmlFor="volume" className="text-xs sm:text-sm cursor-pointer">Volume</Label>
            </div>
            <div className="flex items-center gap-2">
              {indicators && showVolume && (
                <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                  {(indicators.volume / 1e6).toFixed(2)}M
                </span>
              )}
              <Switch
                id="volume"
                checked={showVolume}
                onCheckedChange={onToggleVolume}
                data-testid="toggle-volume"
              />
            </div>
          </div>
        </div>

        {indicators && (
          <div className="pt-2 sm:pt-4 border-t space-y-2 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-xs sm:text-sm font-medium">RSI (14)</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className={`font-mono text-xs sm:text-sm font-medium ${getRsiColor(indicators.rsi)}`}>
                    {formatValue(indicators.rsi, 1)}
                  </span>
                  <Badge variant="outline" className={`text-xs ${getRsiColor(indicators.rsi)}`}>
                    {getRsiLabel(indicators.rsi)}
                  </Badge>
                </div>
              </div>
              <div className="relative">
                <Progress value={indicators.rsi} className="h-1.5 sm:h-2" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground text-[10px] sm:text-xs">
                  <span>0</span>
                  <span className="text-green-500">30</span>
                  <span className="text-yellow-500">50</span>
                  <span className="text-red-500">70</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-xs sm:text-sm font-medium">MACD</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getMacdSignal(indicators.macd, indicators.macdSignal).color}`}
                >
                  {getMacdSignal(indicators.macd, indicators.macdSignal).label}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                <div className="p-1.5 sm:p-2 rounded bg-muted/30">
                  <div className="text-xs text-muted-foreground">MACD</div>
                  <div className={`font-mono text-xs ${indicators.macd >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatValue(indicators.macd, 4)}
                  </div>
                </div>
                <div className="p-1.5 sm:p-2 rounded bg-muted/30">
                  <div className="text-xs text-muted-foreground">Signal</div>
                  <div className="font-mono text-xs">
                    {formatValue(indicators.macdSignal, 4)}
                  </div>
                </div>
                <div className="p-1.5 sm:p-2 rounded bg-muted/30">
                  <div className="text-xs text-muted-foreground">Hist</div>
                  <div className={`font-mono text-xs ${indicators.macdHistogram >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatValue(indicators.macdHistogram, 4)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">EMA Crossover</span>
                {indicators.ema8 > indicators.ema34 ? (
                  <Badge className="bg-green-500 text-white">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Bullish
                  </Badge>
                ) : (
                  <Badge className="bg-red-500 text-white">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Bearish
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
