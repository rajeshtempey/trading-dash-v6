import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SimulatedOrder {
  id: string;
  type: string;
  price: number;
  quantity: number;
  status: "pending" | "filled" | "cancelled";
  pnl: number;
}

export function OrderSimulator() {
  const [currentPrice] = useState(85152);
  const [quantity, setQuantity] = useState("0.1");
  const [orders, setOrders] = useState<SimulatedOrder[]>([
    { id: "1", type: "Limit Buy", price: 84500, quantity: 0.1, status: "filled", pnl: 65.2 },
    { id: "2", type: "Stop Loss", price: 84000, quantity: 0.1, status: "pending", pnl: 0 },
  ]);

  const createOrder = (type: string, price: number) => {
    setOrders([...orders, {
      id: Date.now().toString(),
      type,
      price,
      quantity: parseFloat(quantity),
      status: Math.random() > 0.5 ? "filled" : "pending",
      pnl: 0
    }]);
  };

  const riskReward = (currentPrice / 84000).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Order Calculator */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="text-sm">Order Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Current Price (BTC)</span>
              <span className="font-bold">${currentPrice.toLocaleString()}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0.00" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => createOrder("Buy", currentPrice * 0.95)} variant="outline" size="sm" className="text-xs">
              Limit Buy -5%
            </Button>
            <Button onClick={() => createOrder("Sell", currentPrice * 1.05)} variant="outline" size="sm" className="text-xs">
              Limit Sell +5%
            </Button>
          </div>

          <div className="p-3 rounded-lg bg-background border text-xs space-y-1">
            <div>Entry: ${(currentPrice * 0.95).toFixed(0)}</div>
            <div>Exit: ${(currentPrice * 1.05).toFixed(0)}</div>
            <div className="text-green-600 font-bold">Risk/Reward: 1:{riskReward}</div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Simulated Orders</h3>
        {orders.map(order => (
          <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
            <div className="flex-1">
              <div className="font-semibold text-sm">{order.type}</div>
              <div className="text-xs text-muted-foreground">{order.quantity} @ ${order.price.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <Badge variant={order.status === "filled" ? "default" : "secondary"} className="text-xs mb-1">
                {order.status}
              </Badge>
              {order.pnl > 0 && <div className="text-xs text-green-600 font-bold">+${order.pnl.toFixed(2)}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
