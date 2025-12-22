import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Activity } from "lucide-react";
import type { TechnicalIndicators, PatternDetection } from "@shared/schema";

interface AdvancedIndicatorsPanelProps {
  indicators: TechnicalIndicators | null;
  patterns?: PatternDetection[];
}

export function AdvancedIndicatorsPanel({ indicators, patterns }: AdvancedIndicatorsPanelProps) {
  if (!indicators) return null;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Advanced Indicators
      </h3>

      {/* Bollinger Bands */}
      {indicators.bollingerBands && (
        <div className="space-y-2 text-sm border-b pb-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Bollinger Bands</span>
            <Badge variant={
              indicators.bollingerBands.percentB < 0.2 ? "destructive" :
              indicators.bollingerBands.percentB > 0.8 ? "default" :
              "secondary"
            }>
              {(indicators.bollingerBands.percentB * 100).toFixed(0)}%
            </Badge>
          </div>
          <div className="grid grid-cols-3 text-xs gap-1">
            <div className="bg-secondary/50 p-2 rounded">
              <span className="text-muted-foreground block">Upper</span>
              <span className="font-mono font-semibold">${indicators.bollingerBands.upper.toFixed(2)}</span>
            </div>
            <div className="bg-secondary/50 p-2 rounded">
              <span className="text-muted-foreground block">Mid</span>
              <span className="font-mono font-semibold">${indicators.bollingerBands.middle.toFixed(2)}</span>
            </div>
            <div className="bg-secondary/50 p-2 rounded">
              <span className="text-muted-foreground block">Lower</span>
              <span className="font-mono font-semibold">${indicators.bollingerBands.lower.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stochastic RSI */}
      {indicators.stochasticRsi && (
        <div className="space-y-2 text-sm border-b pb-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Stochastic RSI</span>
            <Badge variant={
              indicators.stochasticRsi.fastK < 20 ? "destructive" :
              indicators.stochasticRsi.fastK > 80 ? "default" :
              "secondary"
            }>
              {indicators.stochasticRsi.fastK.toFixed(0)} / {indicators.stochasticRsi.fastD.toFixed(0)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 bg-secondary/50 rounded h-2 relative">
              <div 
                className="bg-primary h-full rounded transition-all"
                style={{ width: `${Math.min(100, Math.max(0, indicators.stochasticRsi.fastK))}%` }}
              />
            </div>
            <span className="text-muted-foreground">FastK: {indicators.stochasticRsi.fastK.toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* ATR */}
      {indicators.atr && (
        <div className="space-y-2 text-sm border-b pb-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ATR (14)</span>
            <Badge variant="outline">
              ${indicators.atr.value.toFixed(2)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Average True Range for volatility measurement
          </p>
        </div>
      )}

      {/* Patterns */}
      {patterns && patterns.length > 0 && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            Pattern Detected
          </div>
          {patterns.map((pattern, i) => (
            <div key={i} className="bg-secondary/50 p-2 rounded text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{pattern.name}</span>
                <Badge variant="outline">{pattern.confidence.toFixed(0)}%</Badge>
              </div>
              <p className="text-muted-foreground">{pattern.description}</p>
              {pattern.predictedTarget && (
                <div className="text-foreground font-mono">
                  Target: ${pattern.predictedTarget.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
