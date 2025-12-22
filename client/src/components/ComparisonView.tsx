import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const comparisonData = [
  { time: "00:00", BTC: 84500, ETH: 2650, SOL: 120, XAU: 2640 },
  { time: "04:00", BTC: 84800, ETH: 2670, SOL: 122, XAU: 2645 },
  { time: "08:00", BTC: 85000, ETH: 2700, SOL: 123, XAU: 2648 },
  { time: "12:00", BTC: 85200, ETH: 2720, SOL: 124, XAU: 2650 },
  { time: "16:00", BTC: 85100, ETH: 2710, SOL: 125, XAU: 2652 },
  { time: "20:00", BTC: 85500, ETH: 2740, SOL: 126, XAU: 2655 },
  { time: "24:00", BTC: 85152, ETH: 2744, SOL: 124.34, XAU: 2650 },
];

const correlations = [
  { pair: "BTC ↔ ETH", correlation: 0.89, strength: "very strong" },
  { pair: "BTC ↔ SOL", correlation: 0.72, strength: "strong" },
  { pair: "BTC ↔ XAU", correlation: -0.15, strength: "weak inverse" },
  { pair: "ETH ↔ SOL", correlation: 0.68, strength: "strong" },
  { pair: "ETH ↔ XAU", correlation: -0.08, strength: "very weak" },
  { pair: "SOL ↔ XAU", correlation: -0.12, strength: "weak inverse" },
];

export function ComparisonView() {
  return (
    <div className="space-y-6">
      {/* Multi-Asset Chart */}
      <Card>
        <CardHeader>
          <CardTitle>24-Hour Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={comparisonData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="BTC" stroke="#f7931a" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="ETH" stroke="#627eea" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="SOL" stroke="#00d4aa" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="XAU" stroke="#ffd700" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Correlations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {correlations.map((item, idx) => {
            const getColor = (corr: number) => {
              if (corr > 0.7) return "bg-green-500/10 text-green-700 dark:text-green-400";
              if (corr > 0.3) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
              if (corr > -0.3) return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
              return "bg-red-500/10 text-red-700 dark:text-red-400";
            };
            
            return (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
                <div>
                  <div className="font-semibold text-sm">{item.pair}</div>
                  <div className="text-xs text-muted-foreground">{item.strength}</div>
                </div>
                <Badge className={getColor(item.correlation)} variant="outline">
                  {item.correlation.toFixed(2)}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
        <CardHeader>
          <CardTitle className="text-sm">Correlation Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>BTC & ETH (0.89)</strong>: Very strong positive correlation - move in tandem</p>
          <p>• <strong>BTC & XAU (-0.15)</strong>: Weak inverse - defensive trade diversification</p>
          <p>• <strong>SOL & XAU (-0.12)</strong>: Weak inverse - minimal hedging benefit</p>
        </CardContent>
      </Card>
    </div>
  );
}
