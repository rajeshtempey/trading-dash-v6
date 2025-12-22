import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MultiTimezoneClock } from "./MultiTimezoneClock";
import { AssetSelector } from "./AssetSelector";
import { SettingsDialog } from "./SettingsDialog";
import { useTheme } from "./ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, FileDown, Settings } from "lucide-react";
import type { Asset, MarketData } from "@shared/schema";

interface HeaderProps {
  selectedAsset: Asset;
  onAssetChange: (asset: Asset) => void;
  marketData: Record<Asset, MarketData | undefined>;
  onExportPdf?: () => void;
  onSettingsChange?: (settings: { threshold: number; currency: string }) => void;
  takeProfit?: number;
  stopLoss?: number;
  riskReward?: number;
  currentPrice?: number;
  timeframe?: string;
}

export function Header({
  selectedAsset,
  onAssetChange,
  marketData,
  onExportPdf,
  onSettingsChange,
  takeProfit = 0,
  stopLoss = 0,
  riskReward = 0,
  currentPrice = 0,
  timeframe = '1m',
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleExportClick = () => {
    try {
      if (onExportPdf) {
        onExportPdf();
        toast({
          title: "Export Successful",
          description: `Trading data for ${selectedAsset} exported as JSON`,
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export trading data",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  return (
    <>
      <header 
        className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-background via-background/95 to-background/90 backdrop-blur supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-background/60 supports-[backdrop-filter]:via-background/50 supports-[backdrop-filter]:to-background/40 shadow-sm"
        data-testid="header"
      >
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 overflow-x-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:from-blue-400 group-hover:to-purple-500 transition-all duration-300 transform group-hover:scale-110">
                <span className="text-white font-bold text-sm">TD</span>
              </div>
              <span className="font-semibold hidden sm:inline bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300">TradingDash</span>
            </div>
            
            <div className="hidden lg:block">
              <AssetSelector
                selectedAsset={selectedAsset}
                onAssetChange={onAssetChange}
                marketData={marketData}
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* Price and TP/SL Metrics */}
            <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-slate-500/20 hover:from-slate-500/15 hover:to-slate-600/15 hover:border-slate-500/30 transition-all duration-300 cursor-default">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Price ({timeframe})</div>
              <div className="font-mono font-black text-lg text-emerald-500 drop-shadow-lg">${currentPrice.toFixed(2)}</div>
            </div>
            
            {takeProfit > 0 && (
              <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-br from-emerald-500/15 to-green-600/15 border border-emerald-500/40 hover:from-emerald-500/25 hover:to-green-600/25 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">TP</div>
                <div className="font-mono font-bold text-sm text-emerald-600">${takeProfit.toFixed(2)}</div>
              </div>
            )}
            
            {stopLoss > 0 && (
              <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-br from-rose-500/15 to-red-600/15 border border-rose-500/40 hover:from-rose-500/25 hover:to-red-600/25 hover:border-rose-500/60 hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-xs text-rose-600 uppercase tracking-wider font-semibold">SL</div>
                <div className="font-mono font-bold text-sm text-rose-600">${stopLoss.toFixed(2)}</div>
              </div>
            )}
            
            {riskReward > 0 && (
              <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border border-cyan-500/40 hover:from-cyan-500/25 hover:to-blue-600/25 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-xs text-cyan-600 uppercase tracking-wider font-semibold">R:R</div>
                <div className="font-mono font-bold text-sm text-cyan-600">{riskReward.toFixed(2)}:1</div>
              </div>
            )}
            
            <MultiTimezoneClock />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportClick}
              title="Export Data as JSON"
              data-testid="button-export-pdf"
              className="h-8 sm:h-9 w-8 sm:w-9 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-purple-500/20 hover:scale-110 active:scale-95 transition-all duration-200 rounded-lg"
            >
              <FileDown className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              data-testid="button-theme-toggle"
              className="h-8 sm:h-9 w-8 sm:w-9 hover:bg-gradient-to-br hover:from-yellow-500/20 hover:to-orange-500/20 hover:scale-110 active:scale-95 transition-all duration-200 rounded-lg"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettingsClick}
              title="Settings"
              data-testid="button-settings"
              className="h-8 sm:h-9 w-8 sm:w-9 hover:bg-gradient-to-br hover:from-slate-500/20 hover:to-slate-600/20 hover:scale-110 active:scale-95 transition-all duration-200 rounded-lg"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="lg:hidden border-t bg-gradient-to-r from-background/50 to-background/30 px-4 py-2 hover:from-background/60 hover:to-background/40 transition-colors duration-300">
          <AssetSelector
            selectedAsset={selectedAsset}
            onAssetChange={onAssetChange}
            marketData={marketData}
          />
        </div>
        
        {/* Mobile TP/SL Display */}
        <div className="md:hidden border-t bg-gradient-to-r from-background/50 to-background/30 px-4 py-2">
          <div className="flex items-center justify-between gap-2 text-sm overflow-x-auto">
            <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-slate-500/20">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Price</div>
              <div className="font-mono font-black text-lg text-emerald-500 drop-shadow-lg">${currentPrice.toFixed(2)}</div>
            </div>
            {takeProfit > 0 && (
              <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-gradient-to-br from-emerald-500/15 to-green-600/15 border border-emerald-500/40">
                <div className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">TP</div>
                <div className="font-mono font-bold text-emerald-600">${takeProfit.toFixed(2)}</div>
              </div>
            )}
            {stopLoss > 0 && (
              <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-gradient-to-br from-rose-500/15 to-red-600/15 border border-rose-500/40">
                <div className="text-xs text-rose-600 uppercase tracking-wider font-semibold">SL</div>
                <div className="font-mono font-bold text-rose-600">${stopLoss.toFixed(2)}</div>
              </div>
            )}
            {riskReward > 0 && (
              <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border border-cyan-500/40">
                <div className="text-xs text-cyan-600 uppercase tracking-wider font-semibold">R:R</div>
                <div className="font-mono font-bold text-cyan-600">{riskReward.toFixed(2)}:1</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:hidden border-t bg-gradient-to-r from-background/50 to-background/30 px-4 py-2 flex justify-center hover:from-background/60 hover:to-background/40 transition-colors duration-300">
          <MultiTimezoneClock />
        </div>
      </header>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSettingsChange={onSettingsChange}
      />
    </>
  );
}
