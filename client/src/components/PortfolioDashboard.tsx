import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

const portfolioAllocation = [
  { name: "BTC", value: 45, amount: 45000, allocation: 45 },
  { name: "ETH", value: 30, amount: 30000, allocation: 30 },
  { name: "SOL", value: 15, amount: 15000, allocation: 15 },
  { name: "Cash", value: 10, amount: 10000, allocation: 10 },
];

const colors = ["#f7931a", "#627eea", "#00d4aa", "#94a3b8"];

const performanceByAsset = [
  { asset: "BTC", value: 45000, change: 2.5 },
  { asset: "ETH", value: 30000, change: 1.8 },
  { asset: "SOL", value: 15000, change: 3.2 },
];

export function PortfolioDashboard() {
  const totalValue = portfolioAllocation.reduce((sum, item) => sum + item.amount, 0);
  const diversificationScore = 75;

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
            <div className="text-2xl font-bold mt-1">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Diversification Score</div>
            <div className="text-2xl font-bold mt-1">{diversificationScore}%</div>
            <Progress value={diversificationScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Allocation Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={portfolioAllocation} cx="50%" cy="50%" labelLine={false} label={({name, allocation}) => `${name} ${allocation}%`} outerRadius={80} dataKey="value">
                {colors.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Asset Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Asset Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {portfolioAllocation.map((asset, idx) => (
            <div key={asset.name}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold text-sm">{asset.name}</span>
                  <div className="text-xs text-muted-foreground">${asset.amount.toLocaleString()}</div>
                </div>
                <Badge variant="outline">{asset.allocation}%</Badge>
              </div>
              <Progress value={asset.allocation} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance by Asset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Performance by Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceByAsset}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="asset" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
