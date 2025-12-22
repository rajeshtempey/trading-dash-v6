import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LiquidationZoneAnalyzerProps {
  currentPrice: number;
  high24h?: number;
  low24h?: number;
  takeProfit?: number;
  stopLoss?: number;
}

export function LiquidationZoneAnalyzer({
  currentPrice,
  high24h = currentPrice * 1.1,
  low24h = currentPrice * 0.9,
  takeProfit = 0,
  stopLoss = 0,
}: LiquidationZoneAnalyzerProps) {
  const liquidationZones = useMemo(() => {
    // Calculate support and resistance levels
    const support1 = low24h;
    const support2 = low24h * 0.98;
    const resistance1 = high24h;
    const resistance2 = high24h * 1.02;

    // Liquidation zones typically form around support/resistance levels
    const zones = [
      {
        name: "Lower Liquidation Zone",
        level: support1,
        range: { min: support2, max: support1 },
        type: "support",
        severity: "HIGH",
        color: "text-red-600",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
      },
      {
        name: "Upper Liquidation Zone",
        level: resistance1,
        range: { min: resistance1, max: resistance2 },
        type: "resistance",
        severity: "HIGH",
        color: "text-green-600",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
      },
    ];

    // Calculate distance from current price
    return zones.map((zone) => ({
      ...zone,
      distanceFromPrice: Math.abs(zone.level - currentPrice),
      percentageDistance: ((Math.abs(zone.level - currentPrice) / currentPrice) * 100).toFixed(2),
    }));
  }, [currentPrice, high24h, low24h]);

  const riskAssessment = useMemo(() => {
    const closestZone = liquidationZones.reduce((prev, current) =>
      prev.distanceFromPrice < current.distanceFromPrice ? prev : current
    );

    const distance = parseFloat(closestZone.percentageDistance);
    let riskLevel = "LOW";
    let riskColor = "text-green-600";

    if (distance < 2) {
      riskLevel = "CRITICAL";
      riskColor = "text-red-600";
    } else if (distance < 5) {
      riskLevel = "HIGH";
      riskColor = "text-orange-600";
    } else if (distance < 10) {
      riskLevel = "MEDIUM";
      riskColor = "text-yellow-600";
    }

    return { riskLevel, riskColor, closestZone, distance };
  }, [liquidationZones]);

  return (
    <div className="space-y-4">
      {/* Risk Assessment */}
      <Card className="p-4 border border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-slate-600/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Risk Assessment</h3>
          <Badge
            variant="outline"
            className={`${riskAssessment.riskColor} border-current font-bold`}
          >
            {riskAssessment.riskLevel}
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Closest Zone</span>
            <span className="font-semibold">{riskAssessment.closestZone.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Distance</span>
            <span className="font-mono font-bold">{riskAssessment.distance}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Zone Level</span>
            <span className="font-mono font-bold text-emerald-500">
              ${riskAssessment.closestZone.level.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Liquidation Zones */}
      <div className="space-y-2">
        {liquidationZones.map((zone) => (
          <Card
            key={zone.name}
            className={`p-3 border ${zone.borderColor} ${zone.bgColor} cursor-default hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold text-sm ${zone.color}`}>{zone.name}</h4>
              <Badge variant="outline" className={`${zone.color} border-current text-xs`}>
                {zone.type.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Zone Level</span>
                <div className="font-mono font-bold text-sm">${zone.level.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Distance</span>
                <div className="font-mono font-bold text-sm text-emerald-500">
                  {zone.percentageDistance}%
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1">Range</span>
                <div className="flex justify-between text-xs font-mono">
                  <span>${zone.range.min.toFixed(2)}</span>
                  <span>→</span>
                  <span>${zone.range.max.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-2 pt-2 border-t border-slate-500/20">
              {currentPrice >= zone.range.min && currentPrice <= zone.range.max ? (
                <span className={`text-xs font-semibold ${zone.color}`}>
                  ⚠️ Price in liquidation zone!
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {currentPrice < zone.range.min ? "Below zone" : "Above zone"}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Educational Info */}
      <Card className="p-3 bg-blue-500/5 border border-blue-500/20">
        <h4 className="font-semibold text-xs text-blue-600 mb-2">💡 About Liquidation Zones</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Liquidation zones are price levels where traders with leveraged positions are most likely to be
          liquidated. They typically form around major support and resistance levels. These areas often become
          targets for price reversals.
        </p>
      </Card>
    </div>
  );
}
