import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play } from "lucide-react";

interface Condition {
  id: string;
  indicator: string;
  operator: string;
  value: string;
}

export function StrategyBuilder() {
  const [strategies, setStrategies] = useState([
    { id: "1", name: "EMA Golden Cross", conditions: 2, winRate: 65, status: "active" },
    { id: "2", name: "RSI Oversold", conditions: 3, winRate: 58, status: "active" },
  ]);

  const [conditions, setConditions] = useState<Condition[]>([
    { id: "1", indicator: "EMA8", operator: ">", value: "EMA34" },
    { id: "2", indicator: "RSI", operator: "<", value: "30" },
  ]);

  const addCondition = () => {
    setConditions([...conditions, {
      id: Date.now().toString(),
      indicator: "RSI",
      operator: ">",
      value: "70"
    }]);
  };

  return (
    <div className="space-y-4">
      {/* Strategy Builder */}
      <Card className="border-2 border-purple-500/30 bg-purple-500/5">
        <CardHeader>
          <CardTitle className="text-sm">Build Custom Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conditions.map((cond) => (
            <div key={cond.id} className="flex items-center gap-2 p-3 rounded-lg bg-background border">
              <select value={cond.indicator} className="flex-1 px-2 py-1 border rounded text-sm">
                <option>EMA8</option>
                <option>EMA34</option>
                <option>RSI</option>
                <option>MACD</option>
              </select>
              <select value={cond.operator} className="px-2 py-1 border rounded text-sm">
                <option value=">">{">>"}</option>
                <option value="<">{"<<"}</option>
                <option value="=">=</option>
              </select>
              <input type="text" value={cond.value} placeholder="Value" className="flex-1 px-2 py-1 border rounded text-sm" />
              <Button variant="ghost" size="icon" onClick={() => setConditions(conditions.filter(c => c.id !== cond.id))} className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
          <Button className="w-full" disabled={conditions.length < 2}>
            <Play className="h-4 w-4 mr-2" />
            Save Strategy
          </Button>
        </CardContent>
      </Card>

      {/* Existing Strategies */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Your Strategies</h3>
        {strategies.map((strat) => (
          <div key={strat.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
            <div className="flex-1">
              <div className="font-semibold text-sm">{strat.name}</div>
              <div className="text-xs text-muted-foreground">{strat.conditions} conditions • {strat.winRate}% win rate</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={strat.status === "active" ? "default" : "secondary"} className="text-xs">
                {strat.status}
              </Badge>
              <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Strategy Tips */}
      <Card className="bg-gradient-to-r from-green-500/5 to-blue-500/5">
        <CardContent className="pt-4 space-y-2 text-xs">
          <p className="font-semibold">Strategy Design Tips</p>
          <ul className="space-y-1 ml-3">
            <li>• Combine 2-4 indicators for best results</li>
            <li>• Test against historical data before trading</li>
            <li>• Monitor win rate and adjust parameters monthly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
