import { Button } from "@/components/ui/button";
import type { Asset, MarketData } from "@shared/schema";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AssetSelectorProps {
  selectedAsset: Asset;
  onAssetChange: (asset: Asset) => void;
  marketData: Record<Asset, MarketData | undefined>;
}

const ASSET_INFO: Record<Asset, { name: string; color: string }> = {
  SOL: { name: "Solana", color: "bg-gradient-to-r from-purple-500 to-blue-500" },
  BTC: { name: "Bitcoin", color: "bg-gradient-to-r from-orange-500 to-yellow-500" },
  ETH: { name: "Ethereum", color: "bg-gradient-to-r from-blue-500 to-purple-500" },
  XAU: { name: "Gold", color: "bg-gradient-to-r from-yellow-500 to-amber-500" },
};

export function AssetSelector({ selectedAsset, onAssetChange, marketData }: AssetSelectorProps) {
  const assets: Asset[] = ["SOL", "BTC", "ETH", "XAU"];

  const formatPrice = (price: number, asset: Asset) => {
    if (asset === "XAU") {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0" data-testid="asset-selector">
      {assets.map((asset, index) => {
        const data = marketData[asset];
        const isSelected = selectedAsset === asset;
        const isPositive = data ? data.changePercent24h >= 0 : true;

        return (
          <Button
            key={asset}
            variant={isSelected ? "default" : "ghost"}
            size="sm"
            onClick={() => onAssetChange(asset)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm transition-all flex-shrink-0 ${
              isSelected ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""
            }`}
            data-testid={`asset-button-${asset.toLowerCase()}`}
          >
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${ASSET_INFO[asset].color}`} />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs sm:text-sm">{asset}</span>
                {data && (
                  <span className="font-mono text-xs tabular-nums hidden sm:inline">
                    {formatPrice(data.price, asset)}
                  </span>
                )}
              </div>
              {data && (
                <div className={`flex items-center gap-0.5 text-xs ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}>
                  {isPositive ? (
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  )}
                  <span className="font-mono tabular-nums text-xs">
                    {formatChange(data.changePercent24h)}
                  </span>
                </div>
              )}
            </div>
          </Button>
        );
      })}
      <div className="ml-auto text-xs text-muted-foreground hidden lg:block flex-shrink-0">
        1-4 to switch
      </div>
    </div>
  );
}
