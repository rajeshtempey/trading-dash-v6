import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const monthlyData = [
  { month: "Jan", return: 2.5, trades: 12, winRate: 58 },
  { month: "Feb", return: 3.2, trades: 15, winRate: 62 },
  { month: "Mar", return: 1.8, trades: 10, winRate: 55 },
  { month: "Apr", return: 4.1, trades: 18, winRate: 67 },
  { month: "May", return: 2.9, trades: 14, winRate: 61 },
  { month: "Jun", return: 3.5, trades: 16, winRate: 64 },
];

const metricsData = [
  { metric: "YTD Return", value: "22.4%", color: "text-green-600" },
  { metric: "Monthly Avg", value: "3.1%", color: "text-blue-600" },
  { metric: "Best Month", value: "4.1%", color: "text-green-600" },
  { metric: "Worst Month", value: "1.8%", color: "text-orange-600" },
];

export function PerformanceMetricsTracker() {
  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metricsData.map((m) => (
          <Card key={m.metric}>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground mb-1">{m.metric}</div>
              <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Returns Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Monthly Returns & Trade Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="return" fill="#10b981" name="Return (%)" />
              <Bar yAxisId="right" dataKey="trades" fill="#3b82f6" name="Trades" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Win Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Win Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line type="monotone" dataKey="winRate" stroke="#8b5cf6" strokeWidth={2} dot={true} name="Win Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="bg-gradient-to-r from-green-500/5 to-blue-500/5">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-semibold">Performance Summary</p>
          <ul className="text-xs space-y-1 ml-3">
            <li>✓ Consistent monthly returns: 1.8% - 4.1%</li>
            <li>✓ Average trade volume: 14.2 trades/month</li>
            <li>✓ Average win rate: 61.2%</li>
            <li>⚠ April was peak month (+4.1%)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
