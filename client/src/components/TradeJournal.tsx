import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";

interface Trade {
  id: string;
  asset: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  date: string;
  type: "win" | "loss";
  profit: number;
  signalType: string;
}

export function TradeJournal() {
  const [trades, setTrades] = useState<Trade[]>([
    { id: "1", asset: "BTC", entryPrice: 84000, exitPrice: 85000, quantity: 0.1, date: "2025-12-02", type: "win", profit: 100, signalType: "confluence" },
    { id: "2", asset: "ETH", entryPrice: 2700, exitPrice: 2680, quantity: 1, date: "2025-12-01", type: "loss", profit: -20, signalType: "ema_cross" },
  ]);

  const [newTrade, setNewTrade] = useState({ asset: "BTC", entry: "", exit: "", qty: "", signal: "confluence" });

  const addTrade = () => {
    if (newTrade.entry && newTrade.exit && newTrade.qty) {
      const entry = parseFloat(newTrade.entry);
      const exit = parseFloat(newTrade.exit);
      const profit = (exit - entry) * parseFloat(newTrade.qty);
      
      setTrades([
        ...trades,
        {
          id: Date.now().toString(),
          asset: newTrade.asset,
          entryPrice: entry,
          exitPrice: exit,
          quantity: parseFloat(newTrade.qty),
          date: new Date().toISOString().split('T')[0],
          type: profit > 0 ? "win" : "loss",
          profit: Math.round(profit * 100) / 100,
          signalType: newTrade.signal,
        }
      ]);
      setNewTrade({ asset: "BTC", entry: "", exit: "", qty: "", signal: "confluence" });
    }
  };

  const wins = trades.filter(t => t.type === "win").length;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0";
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className="text-2xl font-bold">{winRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">{wins} of {trades.length} trades</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total P&L</div>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              ${Math.abs(totalProfit).toFixed(2)}
            </div>
            <Badge variant={totalProfit >= 0 ? "default" : "destructive"} className="mt-2">
              {totalProfit >= 0 ? "+" : ""}{totalProfit.toFixed(2)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Trades</div>
            <div className="text-2xl font-bold">{trades.length}</div>
            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
              <span className="text-green-600">W: {wins}</span>
              <span className="text-red-600">L: {trades.length - wins}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Trade Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Log Trade
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="dialog-add-trade">
          <DialogHeader>
            <DialogTitle>Log New Trade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asset</label>
              <select value={newTrade.asset} onChange={(e) => setNewTrade({...newTrade, asset: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                <option>BTC</option>
                <option>ETH</option>
                <option>SOL</option>
                <option>XAU</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Entry Price</label>
                <Input type="number" placeholder="0.00" value={newTrade.entry} onChange={(e) => setNewTrade({...newTrade, entry: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Exit Price</label>
                <Input type="number" placeholder="0.00" value={newTrade.exit} onChange={(e) => setNewTrade({...newTrade, exit: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input type="number" placeholder="0.00" value={newTrade.qty} onChange={(e) => setNewTrade({...newTrade, qty: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Signal Type</label>
              <select value={newTrade.signal} onChange={(e) => setNewTrade({...newTrade, signal: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                <option value="confluence">Confluence</option>
                <option value="ema_cross">EMA Cross</option>
                <option value="rsi">RSI</option>
                <option value="macd">MACD</option>
              </select>
            </div>
            <Button onClick={addTrade} className="w-full">Save Trade</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trades List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Recent Trades</h3>
        {trades.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No trades logged yet. Start tracking your trades!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {trades.map(trade => (
              <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant={trade.type === "win" ? "default" : "destructive"}>
                    {trade.type === "win" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-semibold">{trade.asset}</div>
                    <div className="text-xs text-muted-foreground">{trade.date} • {trade.signalType}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${trade.entryPrice.toLocaleString()} → ${trade.exitPrice.toLocaleString()}</div>
                    <div className={`text-sm font-bold ${trade.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {trade.profit >= 0 ? "+" : ""}{trade.profit.toFixed(2)}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setTrades(trades.filter(t => t.id !== trade.id))} className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
