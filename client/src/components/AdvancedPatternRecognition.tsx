import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp } from "lucide-react";

const patterns = [
  { pattern: "Fibonacci Retracement", level: "38.2%", price: 84762, status: "Active", strength: "High" },
  { pattern: "Support Zone", level: "S1", price: 84000, status: "Active", strength: "Medium" },
  { pattern: "Resistance Zone", level: "R1", price: 85500, status: "Active", strength: "High" },
  { pattern: "RSI Divergence", level: "Bullish", price: "N/A", status: "Confirmed", strength: "High" },
  { pattern: "Head & Shoulders", level: "Pattern", price: "N/A", status: "Forming", strength: "Medium" },
];

const anomalies = [
  { type: "Volume Spike", asset: "BTC", change: "+340%", time: "2 minutes ago", severity: "High" },
  { type: "Price Gap", asset: "ETH", change: "+2.5%", time: "15 minutes ago", severity: "Medium" },
  { type: "Volatility Surge", asset: "SOL", change: "+85%", time: "1 hour ago", severity: "High" },
];

export function AdvancedPatternRecognition() {
  return (
    <div className="space-y-4">
      {/* Detected Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Technical Patterns Detected</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {patterns.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
              <div className="flex-1">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {p.pattern}
                  <Badge variant="outline" className="text-xs">{p.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.level} {p.price !== "N/A" && `• $${p.price.toLocaleString()}`}
                </div>
              </div>
              <Badge className={p.strength === "High" ? "bg-green-500/20 text-green-700" : "bg-yellow-500/20 text-yellow-700"}>
                {p.strength}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Market Anomalies */}
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Market Anomalies Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomalies.map((a, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border border-orange-500/20">
              <div className="flex-1">
                <div className="font-semibold text-sm">{a.type}</div>
                <div className="text-xs text-muted-foreground">{a.asset} • {a.time}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-orange-600">{a.change}</div>
                <Badge className="text-xs bg-orange-500/20 text-orange-700">{a.severity}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trading Signals from Patterns */}
      <Card className="bg-gradient-to-r from-green-500/5 to-blue-500/5">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Pattern-Based Signals
          </p>
          <ul className="text-xs space-y-1 ml-3">
            <li>✓ Fibonacci retracement at 38.2% shows strong support</li>
            <li>✓ RSI bullish divergence signals potential reversal</li>
            <li>⚠ Head & shoulders still forming - wait for confirmation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
