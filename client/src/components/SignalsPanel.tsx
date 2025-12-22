import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock,
  Target,
  ShieldAlert
} from "lucide-react";
import type { SignalMarker } from "@shared/schema";
import { format } from "date-fns";

interface SignalsPanelProps {
  signals: SignalMarker[];
  onSignalClick?: (signal: SignalMarker) => void;
  currency?: string;
  threshold?: number;
}

export function SignalsPanel({ signals, onSignalClick, currency = "USD", threshold = 1 }: SignalsPanelProps) {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case "BUY": return <TrendingUp className="h-4 w-4" />;
      case "SELL": return <TrendingDown className="h-4 w-4" />;
      case "SIDEWAYS": return <Minus className="h-4 w-4" />;
      default: return null;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case "BUY": return "bg-green-500/10 border-green-500/20 text-green-500";
      case "SELL": return "bg-red-500/10 border-red-500/20 text-red-500";
      case "SIDEWAYS": return "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
      default: return "bg-muted";
    }
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp * 1000), "HH:mm:ss");
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filter signals with size >= threshold and sort by time
  const filteredSignals = signals.filter(s => !s.size || s.size >= threshold);
  const sortedSignals = [...filteredSignals].sort((a, b) => b.time - a.time);

  return (
    <Card data-testid="signals-panel">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Bell className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Trading Signals</span>
            <span className="sm:hidden">Signals</span>
          </div>
          <Badge variant="secondary" className="font-mono text-xs sm:text-sm">
            {sortedSignals.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] sm:h-[400px]">
          <div className="p-2 sm:p-4 sm:pt-0 space-y-1 sm:space-y-2">
            {sortedSignals.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Bell className="h-6 sm:h-8 w-6 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No signals yet</p>
                <p className="text-xs">Signals will appear here as they're generated</p>
              </div>
            ) : (
              sortedSignals.map((signal, index) => (
                <div
                  key={`${signal.time}-${index}`}
                  className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all hover-elevate ${getSignalColor(signal.type)}`}
                  onClick={() => onSignalClick?.(signal)}
                  data-testid={`signal-${index}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {getSignalIcon(signal.type)}
                      <span className="font-semibold text-xs sm:text-sm">{signal.type}</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {signal.confidence}%
                    </Badge>
                  </div>
                  
                  <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-mono">${formatPrice(signal.price)}</span>
                    </div>
                    
                    {signal.size && signal.size > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-mono text-green-500 font-semibold">{signal.currency || "USD"} {signal.size.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="hidden sm:inline">Hold Time</span>
                        <span className="sm:hidden">Time</span>
                      </div>
                      <span className="font-mono">{signal.holdingTime}</span>
                    </div>
                  </div>

                  {(signal.takeProfit || signal.stopLoss) && (
                    <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-current/10 grid grid-cols-2 gap-1 sm:gap-2">
                      {signal.takeProfit && (
                        <div className="flex items-center gap-0.5 sm:gap-1 text-xs">
                          <Target className="h-3 w-3 flex-shrink-0 text-green-500" />
                          <span className="text-muted-foreground hidden sm:inline">TP:</span>
                          <span className="text-muted-foreground sm:hidden">T:</span>
                          <span className="font-mono text-xs">${formatPrice(signal.takeProfit)}</span>
                        </div>
                      )}
                      {signal.stopLoss && (
                        <div className="flex items-center gap-0.5 sm:gap-1 text-xs">
                          <ShieldAlert className="h-3 w-3 flex-shrink-0 text-red-500" />
                          <span className="text-muted-foreground hidden sm:inline">SL:</span>
                          <span className="text-muted-foreground sm:hidden">S:</span>
                          <span className="font-mono text-xs">${formatPrice(signal.stopLoss)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-1 sm:mt-2 text-xs text-muted-foreground">
                    {formatTime(signal.time)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
