import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap } from "lucide-react";

export function ExchangeIntegration() {
  const [connected, setConnected] = useState(false);
  const [exchange, setExchange] = useState("binance");
  const [showApiForm, setShowApiForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className={connected ? "bg-green-500/5 border-green-500/20" : "bg-gray-500/5"}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Exchange Connection</div>
              <div className="text-xs text-muted-foreground">{exchange.toUpperCase()}</div>
            </div>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          {connected && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Account Balance</span>
                <span className="font-semibold">$45,234.50</span>
              </div>
              <div className="flex justify-between">
                <span>24h Volume</span>
                <span className="font-semibold">$12,450.00</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect Exchange */}
      {!connected ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Select Exchange</label>
            <select value={exchange} onChange={(e) => setExchange(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
              <option value="binance">Binance</option>
              <option value="kraken">Kraken</option>
              <option value="bybit">Bybit</option>
              <option value="coinbase">Coinbase</option>
            </select>
          </div>
          <Button className="w-full" onClick={() => setShowApiForm(!showApiForm)}>
            <Zap className="h-4 w-4 mr-2" />
            Connect API Keys
          </Button>

          {showApiForm && (
            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <input type="password" placeholder="API Key" className="w-full px-3 py-2 border rounded-md text-sm" />
              <input type="password" placeholder="API Secret" className="w-full px-3 py-2 border rounded-md text-sm" />
              <Button size="sm" className="w-full" onClick={() => {setConnected(true); setShowApiForm(false);}}>Verify & Connect</Button>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p>API keys are encrypted and never stored in plain text. Replit integrations handle secure key management.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => setConnected(false)}>
            Disconnect
          </Button>

          {/* Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Orders (2)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between p-2 rounded bg-muted">
                <span>BTC Buy Limit @ $84,500</span>
                <span className="text-yellow-600 font-semibold">Pending</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted">
                <span>ETH Sell Limit @ $2,800</span>
                <span className="text-yellow-600 font-semibold">Pending</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
