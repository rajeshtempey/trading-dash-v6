import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const riskData = [
  { asset: "BTC", volatility: 65, correlation: "High", concentration: 45, overallRisk: "Medium" },
  { asset: "ETH", volatility: 72, correlation: "High", concentration: 30, overallRisk: "High" },
  { asset: "SOL", volatility: 85, correlation: "Medium", concentration: 15, overallRisk: "Very High" },
  { asset: "XAU", volatility: 35, correlation: "Low", concentration: 10, overallRisk: "Low" },
];

const getRiskColor = (risk: string) => {
  if (risk === "Low") return "bg-green-500/10 text-green-700 dark:text-green-400";
  if (risk === "Medium") return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  if (risk === "High") return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
  return "bg-red-500/10 text-red-700 dark:text-red-400";
};

const getVolColor = (vol: number) => {
  if (vol < 40) return "bg-green-500";
  if (vol < 60) return "bg-yellow-500";
  if (vol < 80) return "bg-orange-500";
  return "bg-red-500";
};

export function RiskHeatmap() {
  const portfolioRiskLevel = 62;

  return (
    <div className="space-y-4">
      {/* Overall Risk */}
      <Card className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border-orange-500/20">
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground mb-2">Portfolio Risk Level</div>
          <div className="text-3xl font-bold mb-2">{portfolioRiskLevel}%</div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-red-500" style={{width: `${portfolioRiskLevel}%`}}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Moderate-High Risk: Diversify into lower-volatility assets</p>
        </CardContent>
      </Card>

      {/* Risk by Asset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Risk Analysis by Asset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {riskData.map((asset) => (
            <div key={asset.asset} className={`p-3 rounded-lg border ${getRiskColor(asset.overallRisk)}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{asset.asset}</span>
                <Badge className={getRiskColor(asset.overallRisk)} variant="outline">
                  {asset.overallRisk} Risk
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">Volatility</span>
                    <span className="text-xs font-semibold">{asset.volatility}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div className={`h-full ${getVolColor(asset.volatility)}`} style={{width: `${asset.volatility}%`}}></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Correlation: <strong>{asset.correlation}</strong></span>
                  <span>Concentration: <strong>{asset.concentration}%</strong></span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Risk Tips */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-semibold">Risk Management Tips:</p>
          <ul className="text-xs space-y-1 ml-3">
            <li>• Reduce SOL exposure - highest volatility (85%)</li>
            <li>• Increase XAU allocation - low correlation hedge</li>
            <li>• Monitor BTC/ETH correlation - currently high (0.89)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
