import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Activity, 
  Target,
  ShieldAlert,
  Gauge,
  BarChart2,
  ArrowUpDown,
  AlertTriangle
} from "lucide-react";
import type { MarketCondition, TechnicalIndicators, MarketData } from "@shared/schema";

interface TradingInsightsProps {
  condition: MarketCondition | null;
  indicators: TechnicalIndicators | null;
  marketData: MarketData | null;
}

export function TradingInsights({ condition, indicators, marketData }: TradingInsightsProps) {
  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "BULLISH": return "bg-green-500";
      case "BEARISH": return "bg-red-500";
      case "SIDEWAYS": return "bg-yellow-500";
      default: return "bg-muted";
    }
  };

  const getConditionIcon = (cond: string) => {
    switch (cond) {
      case "BULLISH": return <TrendingUp className="h-5 w-5" />;
      case "BEARISH": return <TrendingDown className="h-5 w-5" />;
      case "SIDEWAYS": return <Minus className="h-5 w-5" />;
      default: return null;
    }
  };

  const getActionBadgeVariant = (action: string): "default" | "destructive" | "secondary" => {
    switch (action) {
      case "BUY": return "default";
      case "SELL": return "destructive";
      case "HOLD": return "secondary";
      default: return "secondary";
    }
  };

  const formatValue = (value: number | undefined, decimals: number = 2) => {
    if (value === undefined) return "—";
    return value.toFixed(decimals);
  };

  if (!condition && !indicators && !marketData) {
    return (
      <Card data-testid="trading-insights">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="font-semibold text-foreground mb-1">Market Closed</p>
          <p className="text-sm text-muted-foreground">Real-time market data is currently unavailable. The market may be closed or APIs are unreachable.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="trading-insights">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Market Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {condition && (
          <>
            <div className={`flex items-center justify-between p-4 rounded-lg text-white ${getConditionColor(condition.condition)}`}>
              <div className="flex items-center gap-3">
                {getConditionIcon(condition.condition)}
                <div>
                  <div className="font-bold text-lg">{condition.condition}</div>
                  <div className="text-sm opacity-90">Market Condition</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold">{condition.strength}%</div>
                <div className="text-xs opacity-90">Strength</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Recommended Action</span>
              </div>
              <Badge variant={getActionBadgeVariant(condition.recommendedAction)}>
                {condition.recommendedAction}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Holding Time</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {condition.holdingTimeRecommendation}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              {condition.reasoning}
            </div>
          </>
        )}

        {marketData && (
          <div className="pt-4 border-t space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              24h Statistics
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  24h High
                </div>
                <div className="font-mono text-sm font-medium" data-testid="high-24h">
                  ${formatValue(marketData.high24h)}
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  24h Low
                </div>
                <div className="font-mono text-sm font-medium" data-testid="low-24h">
                  ${formatValue(marketData.low24h)}
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" />
                  Volume
                </div>
                <div className="font-mono text-sm font-medium" data-testid="volume-24h">
                  ${(marketData.volume24h / 1e6).toFixed(2)}M
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  24h Change
                </div>
                <div className={`font-mono text-sm font-medium ${
                  marketData.changePercent24h >= 0 ? "text-green-500" : "text-red-500"
                }`} data-testid="change-24h">
                  {marketData.changePercent24h >= 0 ? "+" : ""}{marketData.changePercent24h.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {indicators && (
          <div className="pt-4 border-t space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Key Levels
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Target className="h-3 w-3 text-green-500" />
                  Support
                </div>
                <div className="font-mono text-sm font-medium text-green-500" data-testid="support-level">
                  ${formatValue(indicators.support)}
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-red-500" />
                  Resistance
                </div>
                <div className="font-mono text-sm font-medium text-red-500" data-testid="resistance-level">
                  ${formatValue(indicators.resistance)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Volatility</div>
                <div className="font-mono text-sm font-medium" data-testid="volatility">
                  {formatValue(indicators.volatility)}%
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Trend Strength</div>
                <div className="font-mono text-sm font-medium" data-testid="trend-strength">
                  {formatValue(indicators.trendStrength)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
