import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const heatmapData = [
  { timeframe: "1m", BTC: 5.2, ETH: 3.1, SOL: 8.5, XAU: 1.2 },
  { timeframe: "5m", BTC: 4.8, ETH: 2.9, SOL: 7.8, XAU: 1.5 },
  { timeframe: "1h", BTC: 3.5, ETH: 2.1, SOL: 6.2, XAU: 2.1 },
  { timeframe: "4h", BTC: 2.8, ETH: 1.8, SOL: 4.5, XAU: 1.8 },
  { timeframe: "1d", BTC: 2.1, ETH: 1.5, SOL: 3.2, XAU: 2.3 },
];

const getColor = (value: number) => {
  if (value >= 7) return "bg-red-600 text-white";
  if (value >= 5) return "bg-orange-500 text-white";
  if (value >= 3) return "bg-yellow-400 text-black";
  if (value >= 1) return "bg-green-500 text-white";
  return "bg-gray-300 text-black";
};

export function MarketHeatmap() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Performance Heatmap (%)</CardTitle>
          <p className="text-xs text-muted-foreground mt-2">Red = Strong Gains | Green = Minimal Change</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {heatmapData.map((row) => (
              <div key={row.timeframe}>
                <div className="text-xs font-semibold mb-2">{row.timeframe}</div>
                <div className="grid grid-cols-4 gap-2">
                  <div className={`p-3 rounded text-center text-sm font-bold ${getColor(row.BTC)}`}>
                    {row.BTC}%
                  </div>
                  <div className={`p-3 rounded text-center text-sm font-bold ${getColor(row.ETH)}`}>
                    {row.ETH}%
                  </div>
                  <div className={`p-3 rounded text-center text-sm font-bold ${getColor(row.SOL)}`}>
                    {row.SOL}%
                  </div>
                  <div className={`p-3 rounded text-center text-sm font-bold ${getColor(row.XAU)}`}>
                    {row.XAU}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600"></div>
              <span>7%+</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500"></div>
              <span>5-7%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400"></div>
              <span>3-5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500"></div>
              <span>&lt;3%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      <Card className="bg-gradient-to-r from-orange-500/5 to-red-500/5">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-semibold">Market Insights</p>
          <ul className="text-xs space-y-1 ml-3">
            <li>• SOL showing strongest gains (8.5% on 1m timeframe)</li>
            <li>• BTC moderately strong across all timeframes</li>
            <li>• XAU relatively flat (good hedge asset)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
