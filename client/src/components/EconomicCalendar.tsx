import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";

const economicEvents = [
  { date: "2025-12-02", time: "14:30", country: "US", event: "Fed Interest Rate Decision", impact: "high", forecast: "4.50%", previous: "4.75%" },
  { date: "2025-12-02", time: "15:00", country: "US", event: "Non-Farm Payrolls", impact: "high", forecast: "200K", previous: "254K" },
  { date: "2025-12-03", time: "08:00", country: "EU", event: "ECB Monetary Policy", impact: "high", forecast: "3.25%", previous: "3.50%" },
  { date: "2025-12-03", time: "09:30", country: "UK", event: "Retail Sales YoY", impact: "medium", forecast: "2.5%", previous: "2.8%" },
  { date: "2025-12-04", time: "10:00", country: "CN", event: "Trade Balance", impact: "medium", forecast: "42.5B", previous: "40.2B" },
  { date: "2025-12-04", time: "14:00", country: "US", event: "CPI YoY", impact: "high", forecast: "2.7%", previous: "2.6%" },
];

const impactColors = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  low: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
};

export function EconomicCalendar() {
  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>High Impact</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span>Medium Impact</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Low Impact</span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {economicEvents.map((event, idx) => (
          <Card key={idx} className={`${impactColors[event.impact as keyof typeof impactColors]} border`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-background/50">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{event.event}</div>
                    <div className="text-xs opacity-75 mt-1">{event.date} at {event.time} UTC • {event.country}</div>
                    <div className="text-xs mt-2">
                      <span>Forecast: <strong>{event.forecast}</strong></span>
                      <span className="ml-3">Previous: <strong>{event.previous}</strong></span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize flex-shrink-0">
                  {event.impact}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Market volatility increases during economic releases.</p>
            High impact events typically cause significant price movements. Plan your trades accordingly.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
