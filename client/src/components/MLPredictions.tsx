import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Brain, Activity, Zap, Target, Shield, AlertTriangle } from "lucide-react";
import type { MLPredictionResult, SignalBoost, Asset } from "@shared/schema";

interface MLPredictionsProps {
  asset: Asset;
  mlPredictions: MLPredictionResult | null;
  signalBoost: SignalBoost | null;
}

export function MLPredictions({ asset, mlPredictions, signalBoost }: MLPredictionsProps) {
  if (!mlPredictions) {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Price Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Activity className="h-6 w-6 animate-pulse mr-2" />
              Loading ML predictions...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { currentPrice, predictions, modelPerformance, ensemble, dataQuality } = mlPredictions;

  const predictionChartData = predictions.map(p => ({
    time: p.timeframe,
    actual: p.timeframe === 'Now' ? currentPrice : null,
    predicted: p.prediction,
    confidence: p.confidence,
  }));

  const formatPrice = (price: number) => {
    if (price >= 10000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 100) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  };

  const getDirectionColor = (direction: string) => {
    if (direction === 'UP') return 'text-green-600';
    if (direction === 'DOWN') return 'text-red-600';
    return 'text-yellow-600';
  };

  const getDirectionBg = (direction: string) => {
    if (direction === 'UP') return 'bg-green-500/20 text-green-700';
    if (direction === 'DOWN') return 'bg-red-500/20 text-red-700';
    return 'bg-yellow-500/20 text-yellow-700';
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'VERY_STRONG': return 'bg-green-600 text-white';
      case 'STRONG': return 'bg-green-500 text-white';
      case 'MODERATE': return 'bg-yellow-500 text-white';
      case 'WEAK': return 'bg-orange-500 text-white';
      case 'VERY_WEAK': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'EXTREME': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const minPrice = Math.min(...predictions.map(p => p.prediction)) * 0.995;
  const maxPrice = Math.max(...predictions.map(p => p.prediction)) * 1.005;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Price Forecast ({asset})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStrengthColor(ensemble.signalStrength)}>
                {ensemble.signalStrength}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ensemble.agreementScore.toFixed(1)}% Agreement
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={predictionChartData}>
              <defs>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis domain={[minPrice, maxPrice]} tick={{ fontSize: 10 }} tickFormatter={(v) => formatPrice(v)} width={70} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value ? formatPrice(value) : "N/A",
                  name === 'predicted' ? 'Predicted' : 'Actual'
                ]}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="predicted" stroke="#a855f7" fill="url(#predictedGradient)" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {predictions.slice(1, 3).map((pred, idx) => (
              <div key={idx} className="flex justify-between p-2 rounded bg-background border">
                <span className="text-muted-foreground">{pred.timeframe} Prediction</span>
                <div className="text-right">
                  <div className={`font-bold ${getDirectionColor(pred.direction)}`}>
                    {formatPrice(pred.prediction)}
                  </div>
                  <Badge className={`text-xs ${getDirectionBg(pred.direction)}`}>
                    {pred.direction === 'UP' ? '+' : pred.direction === 'DOWN' ? '' : ''}
                    {((pred.prediction - currentPrice) / currentPrice * 100).toFixed(2)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs border-t pt-2">
            <div className="flex items-center gap-1">
              {ensemble.direction === 'UP' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : ensemble.direction === 'DOWN' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Activity className="h-4 w-4 text-yellow-600" />
              )}
              <span className={getDirectionColor(ensemble.direction)}>
                Ensemble: {ensemble.direction} ({ensemble.weightedConfidence.toFixed(1)}% confidence)
              </span>
            </div>
            <span className="text-muted-foreground">
              Data Quality: {dataQuality}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            ML Model Performance (Live)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {modelPerformance.map((model, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{model.model}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {model.accuracy.toFixed(1)}% Acc
                  </Badge>
                  <Badge className={getDirectionBg(model.prediction.direction)} variant="secondary">
                    {model.prediction.direction}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${model.accuracy}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {model.precision.toFixed(0)}% P
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {signalBoost && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Signal Boost Analysis
              </CardTitle>
              <Badge className={getStrengthColor(signalBoost.overallSignalStrength)}>
                {signalBoost.overallSignalStrength}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded bg-background border">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <Shield className="h-3 w-3" />
                  Confidence Boost
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{signalBoost.boostedConfidence}%</span>
                  <Badge className={signalBoost.boostPercent >= 0 ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                    {signalBoost.boostPercent >= 0 ? '+' : ''}{signalBoost.boostPercent}%
                  </Badge>
                </div>
              </div>

              <div className="p-2 rounded bg-background border">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  Risk Level
                </div>
                <div className={`font-bold text-lg ${getRiskColor(signalBoost.volatilityAdjustment.riskLevel)}`}>
                  {signalBoost.volatilityAdjustment.riskLevel}
                </div>
                <div className="text-xs text-muted-foreground">
                  Vol: {signalBoost.volatilityAdjustment.volatilityPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sentiment</span>
                <Badge variant="outline">{signalBoost.sentiment.label}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Volume Trend</span>
                <Badge variant="outline">{signalBoost.volumeAnalysis.volumeTrend}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Momentum</span>
                <Badge variant="outline" className={signalBoost.momentum.overall > 0 ? 'text-green-600' : signalBoost.momentum.overall < 0 ? 'text-red-600' : ''}>
                  {signalBoost.momentum.overall > 0 ? '+' : ''}{signalBoost.momentum.overall}
                </Badge>
              </div>
              {signalBoost.momentum.divergence !== 'NONE' && (
                <div className="flex justify-between text-sm">
                  <span>Divergence</span>
                  <Badge className={signalBoost.momentum.divergence === 'BULLISH' ? 'bg-green-500' : 'bg-red-500'}>
                    {signalBoost.momentum.divergence}
                  </Badge>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>R/R Ratio</span>
                <Badge variant="outline">{signalBoost.riskRewardRatio}:1</Badge>
              </div>
            </div>

            <div className="p-2 rounded bg-primary/5 border border-primary/20">
              <div className="text-xs font-medium text-primary mb-1">Trading Recommendation</div>
              <div className="text-sm font-semibold">{signalBoost.tradingRecommendation}</div>
            </div>

            {signalBoost.sentiment.factors.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <div className="font-medium mb-1">Key Factors:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {signalBoost.sentiment.factors.slice(0, 4).map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-500/5">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            AI Confidence Summary
          </p>
          <ul className="text-xs space-y-1 ml-3 text-muted-foreground">
            <li>• {modelPerformance[0]?.model || 'LSTM'} shows {modelPerformance[0]?.accuracy.toFixed(1) || 0}% accuracy for {asset}</li>
            <li>• {ensemble.agreementScore.toFixed(0)}% model consensus on {ensemble.direction} direction</li>
            <li>• Predictions based on {mlPredictions.dataQuality}% available data quality</li>
            <li>• Real-time updates every 60 seconds</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
