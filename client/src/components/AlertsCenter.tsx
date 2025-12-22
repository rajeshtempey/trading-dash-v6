import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, X, AlertTriangle, TrendingUp } from "lucide-react";

interface Alert {
  id: string;
  asset: string;
  type: "price" | "signal" | "volatility";
  value: number;
  condition: "above" | "below";
  active: boolean;
  triggered: boolean;
}

export function AlertsCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "1", asset: "BTC", type: "price", value: 85000, condition: "above", active: true, triggered: false },
    { id: "2", asset: "ETH", type: "price", value: 2600, condition: "below", active: true, triggered: false },
  ]);

  const [newAlert, setNewAlert] = useState({ asset: "BTC", type: "price", value: "", condition: "above" });

  const addAlert = () => {
    if (newAlert.value) {
      setAlerts([
        ...alerts,
        {
          id: Date.now().toString(),
          asset: newAlert.asset,
          type: newAlert.type as "price" | "signal" | "volatility",
          value: parseFloat(newAlert.value),
          condition: newAlert.condition as "above" | "below",
          active: true,
          triggered: false,
        }
      ]);
      setNewAlert({ asset: "BTC", type: "price", value: "", condition: "above" });
    }
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? {...a, active: !a.active} : a));
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const activeCount = alerts.filter(a => a.active).length;

  return (
    <div className="space-y-4">
      {/* Alert Stats */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Active Alerts
              </div>
              <div className="text-2xl font-bold mt-1">{activeCount} of {alerts.length}</div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {alerts.filter(a => a.triggered).length} triggered
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Alert Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="dialog-add-alert">
          <DialogHeader>
            <DialogTitle>Create Price Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asset</label>
              <select value={newAlert.asset} onChange={(e) => setNewAlert({...newAlert, asset: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                <option>BTC</option>
                <option>ETH</option>
                <option>SOL</option>
                <option>XAU</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Alert Type</label>
              <select value={newAlert.type} onChange={(e) => setNewAlert({...newAlert, type: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                <option value="price">Price Level</option>
                <option value="signal">Trading Signal</option>
                <option value="volatility">High Volatility</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input type="number" placeholder="0.00" value={newAlert.value} onChange={(e) => setNewAlert({...newAlert, value: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Condition</label>
                <select value={newAlert.condition} onChange={(e) => setNewAlert({...newAlert, condition: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                  <option value="above">Price Above</option>
                  <option value="below">Price Below</option>
                </select>
              </div>
            </div>
            <Button onClick={addAlert} className="w-full">Create Alert</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerts List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Your Alerts</h3>
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No alerts configured. Create your first alert!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border hover-elevate transition-colors ${!alert.active ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    {alert.triggered ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Bell className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{alert.asset} - ${alert.value.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground capitalize">{alert.type} alert {alert.condition === "above" ? "↑" : "↓"}</div>
                  </div>
                  <Badge variant={alert.active ? "default" : "secondary"}>
                    {alert.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggleAlert(alert.id)} className="h-8 w-8">
                    <span className="text-xs">{alert.active ? "✓" : "—"}</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeAlert(alert.id)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Push Notifications</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Email Alerts</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Sound Alerts</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
