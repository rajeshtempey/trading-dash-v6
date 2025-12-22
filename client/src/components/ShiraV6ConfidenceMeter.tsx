import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, BarChart3, Target } from 'lucide-react';
import type { ShiraV6Signal, MTFConfirmation } from '@shared/schema';

interface ShiraV6MeterProps {
  signal: ShiraV6Signal | null;
  isLoading?: boolean;
  timeframe?: string;
}

export function ShiraV6ConfidenceMeter({ signal, isLoading, timeframe = '1m' }: ShiraV6MeterProps) {
  if (isLoading || !signal) {
    return (
      <Card className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>🎯 SHIRA V6 Analysis</span>
            <span className="text-xs text-muted-foreground font-normal">{timeframe.toUpperCase()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <div className="animate-pulse">Analyzing {timeframe} market...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'UP':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'DOWN':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
      case 'HIGH':
        return 'bg-red-500/20 text-red-700 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🎯 SHIRA V6 Confidence Meter</span>
          <span className="text-xs text-muted-foreground font-normal bg-muted/50 px-2 py-1 rounded">{timeframe.toUpperCase()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Banner */}
        {signal.warning && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-red-700">{signal.warning}</div>
              <div className="text-xs text-red-600 mt-1">All signals paused - market conditions unsafe</div>
            </div>
          </div>
        )}

        {/* Direction & Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getDirectionIcon(signal.direction)}
              <span className="font-semibold text-sm">Direction: {signal.direction}</span>
            </div>
            {!signal.warning && (
              <Badge variant="outline" className="bg-blue-500/20">
                {signal.safeWindow ? '✓ Safe Window' : '✗ Off Hours'}
              </Badge>
            )}
          </div>

          {/* Confidence Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">MTF Confidence</span>
              <span className="font-bold">{signal.confidence.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${getConfidenceColor(signal.confidence)}`}
                style={{ width: `${Math.min(100, signal.confidence)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Timeframe Strength */}
          <div className="p-2 rounded-lg bg-muted/50 border">
            <div className="text-xs text-muted-foreground">TF Strength</div>
            <div className="font-bold text-lg">{signal.timeframeStrength.toFixed(0)}%</div>
            <div className="text-xs mt-1">
              <span className="text-green-600">●</span> MTF Consensus
            </div>
          </div>

          {/* Reversal Probability */}
          <div className="p-2 rounded-lg bg-muted/50 border">
            <div className="text-xs text-muted-foreground">Reversal Risk</div>
            <div className="font-bold text-lg">{signal.reversalProbability.toFixed(0)}%</div>
            <div className="text-xs mt-1">
              {signal.reversalProbability > 50 ? (
                <span className="text-red-600">⚠ High</span>
              ) : (
                <span className="text-green-600">✓ Low</span>
              )}
            </div>
          </div>
        </div>

        {/* Risk Level */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Risk Level</div>
          <Badge className={`w-full justify-center py-2 text-sm font-semibold border ${getRiskColor(signal.riskLevel)}`}>
            {signal.riskLevel} RISK
          </Badge>
        </div>

        {/* Targets */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold">Targets</span>
          </div>

          <div className="space-y-2 text-sm">
            {/* Big Target */}
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">24h Big Target</div>
                  <div className="font-bold text-green-700">${signal.targets.bigTarget.price.toFixed(2)}</div>
                </div>
                <div className="text-xs text-green-600">{signal.targets.bigTarget.source}</div>
              </div>
            </div>

            {/* Mid Target */}
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Mid-Range Target</div>
                  <div className="font-bold text-blue-700">${signal.targets.midTarget.price.toFixed(2)}</div>
                </div>
                <div className="text-xs text-blue-600">{signal.targets.midTarget.source}</div>
              </div>
            </div>

            {/* Scalp Target */}
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Short Scalp Target</div>
                  <div className="font-bold text-purple-700">${signal.targets.scalpTarget.price.toFixed(2)}</div>
                </div>
                <div className="text-xs text-purple-600">{signal.targets.scalpTarget.source}</div>
              </div>
            </div>
          </div>
        </div>

        {/* MTF Confirmations */}
        {signal.mtfConsensus.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <div className="text-xs font-semibold text-muted-foreground">MTF Confirmations</div>
            <div className="grid grid-cols-3 gap-2">
              {signal.mtfConsensus.map((conf: MTFConfirmation, idx: number) => (
                <div key={idx} className="p-2 rounded-lg bg-muted/50 border text-center">
                  <div className="text-xs font-bold text-muted-foreground mb-1">
                    {conf.timeframe === 'primary' ? '1H' : `TF${idx}`}
                  </div>
                  <div className="flex justify-center mb-1">
                    {conf.direction === 'UP' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : conf.direction === 'DOWN' ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <BarChart3 className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="text-xs font-semibold">{conf.strength.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Analyzed {signal.sourceCandles} candles | Multi-Timeframe Locked
        </div>
      </CardContent>
    </Card>
  );
}
