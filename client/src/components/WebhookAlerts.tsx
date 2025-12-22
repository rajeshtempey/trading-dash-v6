import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Copy, Trash2 } from "lucide-react";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

export function WebhookAlerts() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: "1", name: "Discord Alerts", url: "https://discord.com/api/webhooks/...", events: ["buy_signal", "sell_signal"], active: true },
    { id: "2", name: "Slack Trading Alerts", url: "https://hooks.slack.com/services/...", events: ["buy_signal", "high_volatility"], active: true },
  ]);

  const [newWebhook, setNewWebhook] = useState<{ name: string; url: string; events: string[] }>({ name: "", url: "", events: [] as string[] });

  const addWebhook = () => {
    if (newWebhook.name && newWebhook.url) {
      setWebhooks([...webhooks, {
        id: Date.now().toString(),
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events.length > 0 ? newWebhook.events : ["buy_signal"],
        active: true
      }]);
      setNewWebhook({ name: "", url: "", events: [] });
    }
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => w.id === id ? {...w, active: !w.active} : w));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Add Webhook */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="dialog-webhook">
          <DialogHeader>
            <DialogTitle>Add Webhook Integration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Service Name</label>
              <input type="text" placeholder="e.g., Discord Alerts" value={newWebhook.name} onChange={(e) => setNewWebhook({...newWebhook, name: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Webhook URL</label>
              <input type="text" placeholder="https://..." value={newWebhook.url} onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm font-mono text-xs" />
            </div>
            <div>
              <label className="text-sm font-medium">Events to Send</label>
              <div className="space-y-2 mt-2">
                {["buy_signal", "sell_signal", "high_volatility", "pattern_detected"].map(event => (
                  <label key={event} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" onChange={(e) => setNewWebhook({...newWebhook, events: e.target.checked ? [...newWebhook.events, event] : newWebhook.events.filter(ev => ev !== event)})} className="w-4 h-4" />
                    {event}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={addWebhook} className="w-full">Add Webhook</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Webhooks List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Active Webhooks ({webhooks.filter(w => w.active).length})</h3>
        {webhooks.map(webhook => (
          <div key={webhook.id} className={`p-3 rounded-lg border hover-elevate ${webhook.active ? "bg-green-500/5" : "opacity-50"}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="font-semibold text-sm">{webhook.name}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">{webhook.url}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(webhook.url)} className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteWebhook(webhook.id)} className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {webhook.events.map(event => (
                <Badge key={event} variant="secondary" className="text-xs">{event}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Test Webhook */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <div className="text-sm font-semibold mb-3">Test Webhooks</div>
          <Button size="sm" className="w-full text-xs">Send Test Signal</Button>
        </CardContent>
      </Card>
    </div>
  );
}
