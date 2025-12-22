import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Asset } from "@shared/schema";

const AVAILABLE_ASSETS: Asset[] = ["BTC", "ETH", "SOL", "XAU"];

interface WatchlistItem {
  asset: Asset;
  pinned: boolean;
  price: number;
  change24h: number;
}

export function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { asset: "BTC", pinned: true, price: 85152, change24h: 2.5 },
    { asset: "ETH", pinned: true, price: 2744, change24h: 1.8 },
    { asset: "SOL", pinned: false, price: 124, change24h: 3.2 },
  ]);

  const togglePin = (asset: Asset) => {
    setWatchlist(watchlist.map(item =>
      item.asset === asset ? { ...item, pinned: !item.pinned } : item
    ));
  };

  const removeFromWatchlist = (asset: Asset) => {
    setWatchlist(watchlist.filter(item => item.asset !== asset));
  };

  const pinnedAssets = watchlist.filter(item => item.pinned);
  const unpinnedAssets = watchlist.filter(item => !item.pinned);

  return (
    <div className="space-y-4">
      {/* Pinned Assets */}
      {pinnedAssets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Pinned Assets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedAssets.map(item => (
              <Card key={item.asset} className="hover-elevate cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">{item.asset}</div>
                      <div className="text-2xl font-bold text-primary">${item.price.toLocaleString()}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePin(item.asset)}
                      className="h-8 w-8"
                      data-testid={`button-pin-${item.asset}`}
                    >
                      <Star className="h-4 w-4 fill-primary" />
                    </Button>
                  </div>
                  <Badge variant={item.change24h >= 0 ? "default" : "destructive"} className="flex items-center gap-1 w-fit">
                    {item.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(item.change24h).toFixed(2)}%
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Watchlist Items */}
      {unpinnedAssets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Watchlist</h3>
          <div className="space-y-2">
            {unpinnedAssets.map(item => (
              <div key={item.asset} className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <div className="font-semibold">{item.asset}</div>
                    <div className="text-sm text-muted-foreground">${item.price.toLocaleString()}</div>
                  </div>
                  <Badge variant={item.change24h >= 0 ? "default" : "destructive"} className="ml-auto">
                    {item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => togglePin(item.asset)} className="h-8 w-8">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeFromWatchlist(item.asset)} className="h-8 w-8">
                    <span className="text-lg">×</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add to Watchlist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Asset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ASSETS.map(asset => (
              <Button
                key={asset}
                variant={watchlist.some(item => item.asset === asset) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (!watchlist.find(item => item.asset === asset)) {
                    setWatchlist([...watchlist, { asset, pinned: false, price: Math.random() * 10000, change24h: Math.random() * 10 - 5 }]);
                  }
                }}
                data-testid={`button-add-${asset}`}
              >
                + {asset}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
