import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Percent, TrendingUp, TrendingDown, Scale } from "lucide-react";
import type { PositionSize } from "@shared/schema";

interface PositionSizingCalculatorProps {
  currentPrice: number;
  asset: string;
  takeProfit?: number;
  stopLoss?: number;
}

const PRESET_PERCENTAGES = [1, 5, 10, 25, 50, 100];

export function PositionSizingCalculator({
  currentPrice,
  asset,
  takeProfit,
  stopLoss,
}: PositionSizingCalculatorProps) {
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(5);
  const [capitalInput, setCapitalInput] = useState<string>("10000");

  useEffect(() => {
    const numValue = parseFloat(capitalInput.replace(/,/g, ""));
    if (!isNaN(numValue) && numValue > 0) {
      setCapital(numValue);
    }
  }, [capitalInput]);

  const positionSize: PositionSize = useMemo(() => {
    const riskAmount = capital * (riskPercentage / 100);
    const units = riskAmount / currentPrice;
    const valueInUsd = units * currentPrice;
    
    const tpDistance = takeProfit ? takeProfit - currentPrice : currentPrice * 0.05;
    const slDistance = stopLoss ? currentPrice - stopLoss : currentPrice * 0.02;
    
    const potentialProfit = units * Math.abs(tpDistance);
    const potentialLoss = units * Math.abs(slDistance);
    const riskRewardRatio = potentialLoss > 0 ? potentialProfit / potentialLoss : 0;

    let lotSize = units;
    if (asset === "XAU") {
      lotSize = units / 100;
    } else if (asset === "BTC" || asset === "ETH" || asset === "SOL") {
      lotSize = units;
    }

    return {
      lotSize,
      units,
      valueInUsd,
      riskAmount,
      potentialProfit,
      potentialLoss,
      riskRewardRatio,
    };
  }, [capital, riskPercentage, currentPrice, takeProfit, stopLoss, asset]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatUnits = (value: number) => {
    if (value >= 1) {
      return value.toFixed(4);
    }
    return value.toFixed(8);
  };

  return (
    <Card data-testid="position-sizing-calculator">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Position Sizing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="capital" className="text-sm flex items-center gap-2">
            <DollarSign className="h-3 w-3" />
            Capital (USD)
          </Label>
          <Input
            id="capital"
            type="text"
            value={capitalInput}
            onChange={(e) => setCapitalInput(e.target.value)}
            className="font-mono"
            placeholder="Enter your capital"
            data-testid="input-capital"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Percent className="h-3 w-3" />
              Risk Percentage
            </Label>
            <Badge variant="secondary" className="font-mono">
              {riskPercentage}%
            </Badge>
          </div>
          
          <Slider
            value={[riskPercentage]}
            onValueChange={([value]) => setRiskPercentage(value)}
            min={1}
            max={100}
            step={1}
            className="py-2"
            data-testid="slider-risk-percentage"
          />
          
          <div className="flex flex-wrap gap-2">
            {PRESET_PERCENTAGES.map((preset) => (
              <Button
                key={preset}
                variant={riskPercentage === preset ? "secondary" : "outline"}
                size="sm"
                onClick={() => setRiskPercentage(preset)}
                className="text-xs px-2 py-1"
                data-testid={`preset-${preset}`}
              >
                {preset}%
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-3 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Lot Size</div>
              <div className="font-mono text-lg font-semibold" data-testid="lot-size">
                {formatUnits(positionSize.lotSize)}
              </div>
              <div className="text-xs text-muted-foreground">{asset}</div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Position Value</div>
              <div className="font-mono text-lg font-semibold" data-testid="position-value">
                {formatCurrency(positionSize.valueInUsd)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Potential Profit
              </div>
              <div className="font-mono text-lg font-semibold text-green-500" data-testid="potential-profit">
                +{formatCurrency(positionSize.potentialProfit)}
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                Potential Loss
              </div>
              <div className="font-mono text-lg font-semibold text-red-500" data-testid="potential-loss">
                -{formatCurrency(positionSize.potentialLoss)}
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Scale className="h-3 w-3" />
              Risk/Reward Ratio
            </div>
            <div className="font-mono text-lg font-semibold" data-testid="risk-reward">
              1:{positionSize.riskRewardRatio.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          At {riskPercentage}% of {formatCurrency(capital)}, you can buy {formatUnits(positionSize.units)} {asset} at {formatCurrency(currentPrice)}
        </div>
      </CardContent>
    </Card>
  );
}
