import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, TrendingUp, Wallet, Zap } from "lucide-react";

interface SimulatedPosition {
  id: string;
  asset: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  type: "long" | "short";
}

export function PaperTradingSimulator() {
  const [balance, setBalance] = useState(100000);
  const [positions, setPositions] = useState<SimulatedPosition[]>([
    { id: "1", asset: "BTC", quantity: 0.5, entryPrice: 84000, currentPrice: 85152, pnl: 576, type: "long" },
    { id: "2", asset: "ETH", quantity: 5, entryPrice: 2600, currentPrice: 2744, pnl: 720, type: "long" },
  ]);
  const [newOrder, setNewOrder] = useState({ asset: "BTC", quantity: "", price: "", type: "long" });

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const equityValue = balance + totalPnL;
  const returnPercentage = ((totalPnL / balance) * 100).toFixed(2);

  const placeOrder = () => {
    if (newOrder.quantity && newOrder.price) {
      setPositions([
        ...positions,
        {
          id: Date.now().toString(),
          asset: newOrder.asset,
          quantity: parseFloat(newOrder.quantity),
          entryPrice: parseFloat(newOrder.price),
          currentPrice: parseFloat(newOrder.price),
          pnl: 0,
          type: newOrder.type as "long" | "short",
        }
      ]);
      setNewOrder({ asset: "BTC", quantity: "", price: "", type: "long" });
    }
  };

  const closePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Portfolio Value */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Starting Balance
            </div>
            <div className="text-2xl font-bold mt-1">${balance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Equity Value</div>
            <div className="text-2xl font-bold mt-1">${equityValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total P&L</div>
            <div className={`text-2xl font-bold mt-1 ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${Math.abs(totalPnL).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{returnPercentage}% return</div>
          </CardContent>
        </Card>
      </div>

      {/* New Order */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Position
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="dialog-new-order">
          <DialogHeader>
            <DialogTitle>Open Position</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asset</label>
              <select value={newOrder.asset} onChange={(e) => setNewOrder({...newOrder, asset: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                <option>BTC</option>
                <option>ETH</option>
                <option>SOL</option>
                <option>XAU</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" placeholder="0.00" value={newOrder.quantity} onChange={(e) => setNewOrder({...newOrder, quantity: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Entry Price</label>
                <Input type="number" placeholder="0.00" value={newOrder.price} onChange={(e) => setNewOrder({...newOrder, price: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Position Type</label>
              <select value={newOrder.type} onChange={(e) => setNewOrder({...newOrder, type: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <Button onClick={placeOrder} className="w-full">Place Order</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Positions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Open Positions ({positions.length})</h3>
        {positions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              No open positions. Start paper trading!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {positions.map(pos => (
              <div key={pos.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
                <div className="flex-1">
                  <div className="font-semibold">{pos.asset} {pos.type === "long" ? "🟢 Long" : "🔴 Short"}</div>
                  <div className="text-xs text-muted-foreground">{pos.quantity} @ ${pos.entryPrice} → ${pos.currentPrice}</div>
                </div>
                <div className="text-right mr-3">
                  <div className={`font-bold ${pos.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {pos.pnl >= 0 ? "+" : ""}{pos.pnl.toFixed(2)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => closePosition(pos.id)} className="text-xs">Close</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
