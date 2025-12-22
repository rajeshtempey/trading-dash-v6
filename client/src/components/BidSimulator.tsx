import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign,
  BarChart3,
  CircleDot,
  ArrowRight,
  Scale
} from "lucide-react";
import type { SimulationResult } from "@shared/schema";

interface BidSimulatorProps {
  currentPrice: number;
  asset: string;
  takeProfit?: number;
  stopLoss?: number;
}

export function BidSimulator({
  currentPrice,
  asset,
  takeProfit,
  stopLoss,
}: BidSimulatorProps) {
  const [capital, setCapital] = useState<number>(10000);
  const [capitalPercentage, setCapitalPercentage] = useState<number>(10);
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice);
  const [targetPercentage, setTargetPercentage] = useState<number>(5);
  const [capitalInput, setCapitalInput] = useState<string>("10000");

  const simulation: SimulationResult = useMemo(() => {
    const positionValue = capital * (capitalPercentage / 100);
    const units = positionValue / entryPrice;
    
    const exitPriceUp = entryPrice * (1 + targetPercentage / 100);
    const exitPriceDown = entryPrice * (1 - targetPercentage / 100);
    
    const profitUp = (exitPriceUp - entryPrice) * units;
    const profitDown = (entryPrice - exitPriceDown) * units;
    
    const tp = takeProfit || exitPriceUp;
    const sl = stopLoss || exitPriceDown;
    
    const tpProfit = (tp - entryPrice) * units;
    const slLoss = (entryPrice - sl) * units;
    
    const breakeven = entryPrice;
    const maxLoss = slLoss;
    
    const winProbability = 50 + (targetPercentage < 3 ? 10 : targetPercentage < 5 ? 5 : 0);
    
    return {
      entryPrice,
      exitPrice: exitPriceUp,
      positionSize: units,
      capitalPercentage,
      profitLoss: tpProfit,
      profitLossPercent: (tpProfit / positionValue) * 100,
      breakeven,
      maxLoss,
      expectedReturn: (tpProfit * (winProbability / 100)) - (slLoss * ((100 - winProbability) / 100)),
      probability: winProbability,
    };
  }, [capital, capitalPercentage, entryPrice, targetPercentage, takeProfit, stopLoss]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const sliderTrackStyle = useMemo(() => {
    const gradientStops = [
      { percent: 0, color: "rgb(34, 197, 94)" },
      { percent: 25, color: "rgb(132, 204, 22)" },
      { percent: 50, color: "rgb(234, 179, 8)" },
      { percent: 75, color: "rgb(249, 115, 22)" },
      { percent: 100, color: "rgb(239, 68, 68)" },
    ];
    return `linear-gradient(to right, ${gradientStops.map(s => `${s.color} ${s.percent}%`).join(", ")})`;
  }, []);

  return (
    <Card data-testid="bid-simulator">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Bid Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sim-capital" className="text-sm flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              Capital
            </Label>
            <Input
              id="sim-capital"
              type="text"
              value={capitalInput}
              onChange={(e) => {
                setCapitalInput(e.target.value);
                const num = parseFloat(e.target.value.replace(/,/g, ""));
                if (!isNaN(num)) setCapital(num);
              }}
              className="font-mono"
              data-testid="input-sim-capital"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entry-price" className="text-sm flex items-center gap-2">
              <CircleDot className="h-3 w-3" />
              Entry Price
            </Label>
            <Input
              id="entry-price"
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="font-mono"
              data-testid="input-entry-price"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Percent className="h-3 w-3" />
              Capital to Bid
            </Label>
            <Badge variant="secondary" className="font-mono text-lg px-3">
              {capitalPercentage}%
            </Badge>
          </div>
          
          <div className="relative">
            <div 
              className="absolute inset-0 h-2 rounded-full top-1/2 -translate-y-1/2 opacity-30"
              style={{ background: sliderTrackStyle }}
            />
            <Slider
              value={[capitalPercentage]}
              onValueChange={([value]) => setCapitalPercentage(value)}
              min={1}
              max={100}
              step={1}
              className="py-4"
              data-testid="slider-capital-percentage"
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1% Safe</span>
            <span>50% Moderate</span>
            <span>100% High Risk</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Target className="h-3 w-3" />
              Target Movement
            </Label>
            <Badge variant="outline" className="font-mono">
              {targetPercentage}%
            </Badge>
          </div>
          
          <Slider
            value={[targetPercentage]}
            onValueChange={([value]) => setTargetPercentage(value)}
            min={1}
            max={50}
            step={0.5}
            className="py-2"
            data-testid="slider-target-percentage"
          />
        </div>

        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center p-4 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Bidding</div>
              <div className="font-mono text-xl font-bold" data-testid="bidding-amount">
                {formatCurrency(capital * (capitalPercentage / 100))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(capital * capitalPercentage / 100 / entryPrice).toFixed(6)} {asset}
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            
            <div className={`flex-1 text-center p-4 rounded-lg ${
              simulation.profitLoss >= 0 ? "bg-green-500/10" : "bg-red-500/10"
            }`}>
              <div className="text-xs text-muted-foreground mb-1">
                If {targetPercentage}% {simulation.profitLoss >= 0 ? "Up" : "Down"}
              </div>
              <div className={`font-mono text-xl font-bold ${
                simulation.profitLoss >= 0 ? "text-green-500" : "text-red-500"
              }`} data-testid="profit-loss-display">
                {simulation.profitLoss >= 0 ? "+" : ""}{formatCurrency(simulation.profitLoss)}
              </div>
              <div className={`text-xs ${
                simulation.profitLoss >= 0 ? "text-green-500" : "text-red-500"
              }`}>
                {simulation.profitLossPercent >= 0 ? "+" : ""}{simulation.profitLossPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Breakeven</div>
              <div className="font-mono text-sm font-medium" data-testid="breakeven">
                {formatCurrency(simulation.breakeven)}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-red-500/10">
              <div className="text-xs text-muted-foreground mb-1">Max Loss</div>
              <div className="font-mono text-sm font-medium text-red-500" data-testid="max-loss">
                -{formatCurrency(Math.abs(simulation.maxLoss))}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Expected</div>
              <div className={`font-mono text-sm font-medium ${
                simulation.expectedReturn >= 0 ? "text-green-500" : "text-red-500"
              }`} data-testid="expected-return">
                {simulation.expectedReturn >= 0 ? "+" : ""}{formatCurrency(simulation.expectedReturn)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Win Probability</span>
            </div>
            <Badge variant="outline" className="font-mono">
              {simulation.probability}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
