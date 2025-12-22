import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Play, Trash2 } from "lucide-react";

const backTestResults = [
  { date: "2025-01-01", equity: 100000 },
  { date: "2025-02-01", equity: 102500 },
  { date: "2025-03-01", equity: 105200 },
  { date: "2025-04-01", equity: 109500 },
  { date: "2025-05-01", equity: 112400 },
  { date: "2025-06-01", equity: 116100 },
];

const strategies = [
  { id: "1", name: "Confluence EMA Cross", asset: "BTC", timeframe: "1h", result: "Win Rate: 65%, P&L: +$4,200" },
  { id: "2", name: "RSI Oversold", asset: "ETH", timeframe: "4h", result: "Win Rate: 58%, P&L: +$1,800" },
];

export function StrategyBacktester() {
  const [backtests, setBacktests] = useState(strategies);
  const [newStrategy, setNewStrategy] = useState({ name: "", asset: "BTC", timeframe: "1h" });

  const runBacktest = () => {
    if (newStrategy.name) {
      setBacktests([...backtests, {
        id: Date.now().toString(),
        name: newStrategy.name,
        asset: newStrategy.asset,
        timeframe: newStrategy.timeframe,
        result: "Win Rate: 62%, P&L: +$3,200"
      }]);
      setNewStrategy({ name: "", asset: "BTC", timeframe: "1h" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Run Backtest Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Run Backtest
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="dialog-backtest">
          <DialogHeader>
            <DialogTitle>Backtest Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Strategy Name</label>
              <input type="text" placeholder="e.g., EMA Cross Buy" value={newStrategy.name} onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Asset</label>
                <select value={newStrategy.asset} onChange={(e) => setNewStrategy({...newStrategy, asset: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                  <option>BTC</option>
                  <option>ETH</option>
                  <option>SOL</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Timeframe</label>
                <select value={newStrategy.timeframe} onChange={(e) => setNewStrategy({...newStrategy, timeframe: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                  <option>1m</option>
                  <option>5m</option>
                  <option>1h</option>
                  <option>4h</option>
                </select>
              </div>
            </div>
            <Button onClick={runBacktest} className="w-full">Start Backtest</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equity Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Backtest Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={backTestResults}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Backtest Results */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Completed Backtests</h3>
        {backtests.map(bt => (
          <div key={bt.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
            <div className="flex-1">
              <div className="font-semibold text-sm">{bt.name}</div>
              <div className="text-xs text-muted-foreground">{bt.asset} • {bt.timeframe}</div>
              <div className="text-xs text-green-600 font-semibold mt-1">{bt.result}</div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
