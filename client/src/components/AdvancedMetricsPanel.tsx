import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, AlertTriangle, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ConfluenceScore {
  emaConfluence: number;
  rsiConfluence: number;
  bollingerConfluence: number;
  macdConfluence: number;
  volumeConfluence: number;
  overallScore: number;
}

interface MarketSentiment {
  score: number;
  label: string;
  volumeSentiment: number;
  priceSentiment: number;
}

interface RiskMetrics {
  drawdownRisk: number;
  volatilityRank: number;
  sharpeRatio: number;
  calmarRatio: number;
  profitFactor: number;
}

interface SupportResistance {
  strongestSupport: number;
  strongestResistance: number;
  supports: number[];
  resistances: number[];
}

interface AdvancedMetricsPanelProps {
  confluence?: ConfluenceScore;
  sentiment?: MarketSentiment;
  riskMetrics?: RiskMetrics;
  supportResistance?: SupportResistance;
}

export function AdvancedMetricsPanel({
  confluence,
  sentiment,
  riskMetrics,
  supportResistance,
}: AdvancedMetricsPanelProps) {
  if (!confluence && !sentiment && !riskMetrics && !supportResistance) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Advanced metrics loading...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Confluence Score */}
      {confluence && (
        <Card className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Indicator Confluence
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span>Overall Score</span>
              <Badge className={confluence.overallScore > 60 ? "" : "bg-orange-500"}>
                {confluence.overallScore.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={confluence.overallScore} className="h-2" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-secondary/50 rounded">
                <div className="text-muted-foreground">EMA</div>
                <div className="font-semibold">{confluence.emaConfluence.toFixed(0)}%</div>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded">
                <div className="text-muted-foreground">RSI</div>
                <div className="font-semibold">{confluence.rsiConfluence.toFixed(0)}%</div>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded">
                <div className="text-muted-foreground">BB</div>
                <div className="font-semibold">{confluence.bollingerConfluence.toFixed(0)}%</div>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded">
                <div className="text-muted-foreground">MACD</div>
                <div className="font-semibold">{confluence.macdConfluence.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Market Sentiment */}
      {sentiment && (
        <Card className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-3">Market Sentiment</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">{sentiment.label}</span>
              <Badge variant={
                sentiment.score > 50 ? "default" :
                sentiment.score < -50 ? "destructive" :
                "secondary"
              }>
                {sentiment.score.toFixed(0)}
              </Badge>
            </div>
            <Progress value={(sentiment.score + 100) / 2} className="h-2" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-muted-foreground">
                Volume: <span className="font-semibold text-foreground">{sentiment.volumeSentiment.toFixed(0)}</span>
              </div>
              <div className="text-muted-foreground">
                Price: <span className="font-semibold text-foreground">{sentiment.priceSentiment.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Risk Metrics */}
      {riskMetrics && (
        <Card className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Metrics
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className={`font-mono font-semibold ${riskMetrics.drawdownRisk > 20 ? 'text-red-500' : 'text-orange-500'}`}>
                {riskMetrics.drawdownRisk.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volatility</span>
              <span className="font-mono font-semibold">{riskMetrics.volatilityRank.toFixed(0)}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sharpe Ratio</span>
              <span className="font-mono font-semibold">{riskMetrics.sharpeRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit Factor</span>
              <span className={`font-mono font-semibold ${riskMetrics.profitFactor > 1.5 ? 'text-green-500' : 'text-orange-500'}`}>
                {riskMetrics.profitFactor.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Support & Resistance */}
      {supportResistance && (
        <Card className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-3">Support & Resistance</h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
              <div className="text-green-600 dark:text-green-400">Strongest Support</div>
              <div className="font-mono font-semibold text-foreground">${supportResistance.strongestSupport.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
              <div className="text-red-600 dark:text-red-400">Strongest Resistance</div>
              <div className="font-mono font-semibold text-foreground">${supportResistance.strongestResistance.toFixed(2)}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
