import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ZapOff } from "lucide-react";

const anomalies = [
  { type: "Unusual Volume", asset: "BTC", severity: "High", value: "+450% above average", time: "5 min ago" },
  { type: "Price Gap", asset: "ETH", severity: "Medium", value: "+2.8% sudden spike", time: "12 min ago" },
  { type: "Order Flow Imbalance", asset: "SOL", severity: "High", value: "Buy:Sell ratio 3.2:1", time: "22 min ago" },
  { type: "Liquidation Spike", asset: "BTC", severity: "High", value: "$124M liquidated", time: "45 min ago" },
  { type: "Volatility Surge", asset: "ETH", severity: "Medium", value: "ATR increased 65%", time: "1 hour ago" },
];

const getSeverityColor = (severity: string) => {
  if (severity === "High") return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
};

export function AnomalyDetection() {
  return (
    <div className="space-y-4">
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Detected Anomalies ({anomalies.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomalies.map((anom, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(anom.severity)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {anom.type}
                    <Badge variant="outline" className="text-xs">{anom.asset}</Badge>
                  </div>
                  <div className="text-xs mt-1 opacity-90">{anom.value}</div>
                  <div className="text-xs opacity-75 mt-1">{anom.time}</div>
                </div>
                <Badge className={getSeverityColor(anom.severity)} variant="outline">
                  {anom.severity}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Anomaly Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Anomaly Statistics (24h)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between p-2 rounded bg-muted">
            <span>Total Anomalies</span>
            <span className="font-bold">24</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-muted">
            <span>High Severity</span>
            <span className="font-bold text-red-600">8</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-muted">
            <span>Avg Detection Time</span>
            <span className="font-bold">2.3 minutes</span>
          </div>
        </CardContent>
      </Card>

      {/* AI Engine Status */}
      <Card className="bg-gradient-to-r from-green-500/5 to-blue-500/5">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-semibold flex items-center gap-2">
            <ZapOff className="h-4 w-4" />
            Anomaly Detection AI
          </p>
          <ul className="text-xs space-y-1 ml-3">
            <li>✓ Model: Isolation Forest + LSTM</li>
            <li>✓ Accuracy: 94.2%</li>
            <li>✓ Real-time monitoring active</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
