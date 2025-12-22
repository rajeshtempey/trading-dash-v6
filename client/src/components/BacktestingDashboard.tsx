import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import type { BackTestResult } from "@shared/schema";

interface BacktestingDashboardProps {
  results: BackTestResult | null;
}

export function BacktestingDashboard({ results }: BacktestingDashboardProps) {
  if (!results) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Run a backtest to see results</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Trade Statistics
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Trades:</span>
            <span className="font-mono font-semibold">{results.totalTrades}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Win Rate:</span>
            <Badge variant={results.winRate > 50 ? "default" : "destructive"}>
              {results.winRate.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Win/Loss:</span>
            <span className="font-mono">{results.winTrades}/{results.lossTrades}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profit Factor:</span>
            <span className={`font-mono font-semibold ${results.profitFactor > 1.5 ? 'text-green-500' : results.profitFactor > 1 ? 'text-yellow-500' : 'text-red-500'}`}>
              {results.profitFactor.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Performance
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total P&L:</span>
            <span className={`font-mono font-semibold ${results.totalProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${results.totalProfit.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Drawdown:</span>
            <Badge variant="outline" className="text-red-500">
              {results.maxDrawdown.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sharpe Ratio:</span>
            <span className={`font-mono font-semibold ${results.sharpeRatio > 1 ? 'text-green-500' : 'text-orange-500'}`}>
              {results.sharpeRatio.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period:</span>
            <span className="text-xs text-muted-foreground">
              {new Date(results.startDate).toLocaleDateString()} - {new Date(results.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
