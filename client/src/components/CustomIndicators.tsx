import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Settings } from "lucide-react";

interface CustomIndicator {
  id: string;
  name: string;
  type: string;
  parameters: string;
  active: boolean;
}

export function CustomIndicators() {
  const [indicators, setIndicators] = useState<CustomIndicator[]>([
    { id: "1", name: "Weighted RSI", type: "Oscillator", parameters: "14-period, weighted", active: true },
    { id: "2", name: "Hull MA", type: "Moving Average", parameters: "50-period", active: true },
    { id: "3", name: "TTM Squeeze", type: "Signal", parameters: "20-period BB, 12-period Momentum", active: false },
  ]);

  const [newIndicator, setNewIndicator] = useState({ name: "", type: "oscillator", parameters: "" });

  const addIndicator = () => {
    if (newIndicator.name && newIndicator.parameters) {
      setIndicators([...indicators, {
        id: Date.now().toString(),
        name: newIndicator.name,
        type: newIndicator.type,
        parameters: newIndicator.parameters,
        active: true
      }]);
      setNewIndicator({ name: "", type: "oscillator", parameters: "" });
    }
  };

  const toggleIndicator = (id: string) => {
    setIndicators(indicators.map(ind =>
      ind.id === id ? { ...ind, active: !ind.active } : ind
    ));
  };

  const deleteIndicator = (id: string) => {
    setIndicators(indicators.filter(ind => ind.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Add Custom Indicator */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Indicator
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="dialog-custom-indicator">
          <DialogHeader>
            <DialogTitle>Create Custom Indicator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Indicator Name</label>
              <input type="text" placeholder="e.g., Weighted RSI" value={newIndicator.name} onChange={(e) => setNewIndicator({...newIndicator, name: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select value={newIndicator.type} onChange={(e) => setNewIndicator({...newIndicator, type: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                <option value="oscillator">Oscillator</option>
                <option value="ma">Moving Average</option>
                <option value="signal">Signal</option>
                <option value="trend">Trend</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Parameters</label>
              <input type="text" placeholder="e.g., 14-period, weighted" value={newIndicator.parameters} onChange={(e) => setNewIndicator({...newIndicator, parameters: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <Button onClick={addIndicator} className="w-full">Add Indicator</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Indicators */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Active Indicators ({indicators.filter(i => i.active).length})</h3>
        <div className="space-y-2">
          {indicators.filter(i => i.active).map(ind => (
            <div key={ind.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate bg-green-500/5">
              <div className="flex-1">
                <div className="font-semibold text-sm">{ind.name}</div>
                <div className="text-xs text-muted-foreground">{ind.type} • {ind.parameters}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => toggleIndicator(ind.id)} className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteIndicator(ind.id)} className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inactive Indicators */}
      {indicators.filter(i => !i.active).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Inactive</h3>
          <div className="space-y-2">
            {indicators.filter(i => !i.active).map(ind => (
              <div key={ind.id} className="flex items-center justify-between p-3 rounded-lg border opacity-50">
                <div>
                  <div className="font-semibold text-sm">{ind.name}</div>
                  <div className="text-xs text-muted-foreground">{ind.type} • {ind.parameters}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleIndicator(ind.id)} className="text-xs">Enable</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
