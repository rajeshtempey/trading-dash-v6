import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const backtestData = [
  { metric: "Win Rate", value: 65, max: 100 },
  { metric: "Profit Factor", value: 2.1, max: 5 },
  { metric: "Sharpe Ratio", value: 1.8, max: 3 },
  { metric: "Max Drawdown", value: 15, max: 50 },
];

const signalPerformance = [
  { type: "Confluence", wins: 35, losses: 15, accuracy: 70 },
  { type: "EMA Cross", wins: 12, losses: 8, accuracy: 60 },
  { type: "RSI", wins: 8, losses: 7, accuracy: 53 },
  { type: "MACD", wins: 10, losses: 5, accuracy: 67 },
];

const timeframeData = [
  { timeframe: "1m", trades: 45, profit: 320 },
  { timeframe: "5m", trades: 32, profit: 480 },
  { timeframe: "1h", trades: 18, profit: 620 },
  { timeframe: "4h", trades: 8, profit: 340 },
  { timeframe: "1d", trades: 5, profit: 890 },
];

const confluenceScore = [
  { name: "100%", value: 12, fill: "#10b981" },
  { name: "80%", value: 28, fill: "#3b82f6" },
  { name: "60%", value: 35, fill: "#f59e0b" },
  { name: "<60%", value: 5, fill: "#ef4444" },
];

export function EnhancedAnalytics() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {backtestData.map((metric) => (
          <Card key={metric.metric}>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-2">{metric.metric}</div>
              <div className="text-2xl font-bold mb-2">{metric.value.toFixed(1)}</div>
              <Progress value={(metric.value / metric.max) * 100} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signal Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Signal Type Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {signalPerformance.map((signal) => (
              <div key={signal.type}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm">{signal.type}</span>
                  <Badge variant={signal.accuracy >= 65 ? "default" : "secondary"}>
                    {signal.accuracy}% accuracy
                  </Badge>
                </div>
                <div className="flex gap-2 text-xs mb-1">
                  <span className="text-green-600">W: {signal.wins}</span>
                  <span className="text-red-600">L: {signal.losses}</span>
                </div>
                <Progress value={signal.accuracy} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeframe Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Timeframe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeframeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeframe" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="trades" fill="#3b82f6" name="Trades" />
              <Bar yAxisId="right" dataKey="profit" fill="#10b981" name="Profit ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Confluence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Confluence Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={confluenceScore} cx="50%" cy="50%" labelLine={false} label={({name, value}) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                  {confluenceScore.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Sharpe Ratio</span>
                <span className="font-bold">1.8</span>
              </div>
              <Progress value={60} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Good risk-adjusted returns</p>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Max Drawdown</span>
                <span className="font-bold">-15%</span>
              </div>
              <Progress value={30} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Acceptable peak-to-trough loss</p>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Profit Factor</span>
                <span className="font-bold">2.1x</span>
              </div>
              <Progress value={42} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Gross profit vs gross loss ratio</p>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Recovery Factor</span>
                <span className="font-bold">4.2x</span>
              </div>
              <Progress value={84} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Net profit vs max drawdown</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
