import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "./ThemeProvider";
import { Palette, Bell, RefreshCw, DollarSign, Globe } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange?: (settings: { threshold: number; currency: string }) => void;
}

export function SettingsDialog({ open, onOpenChange, onSettingsChange }: SettingsDialogProps) {
  const { theme, toggleTheme } = useTheme();
  const [refreshRate, setRefreshRate] = useState<"30s" | "60s" | "120s">("60s");
  const [notifications, setNotifications] = useState(true);
  const [signalThreshold, setSignalThreshold] = useState<number>(1);
  const [currency, setCurrency] = useState<string>("USD");

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedThreshold = localStorage.getItem("signalThreshold");
    const savedCurrency = localStorage.getItem("currency");
    
    if (savedThreshold) setSignalThreshold(parseFloat(savedThreshold));
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  // Handle threshold change
  const handleThresholdChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setSignalThreshold(numValue);
    localStorage.setItem("signalThreshold", numValue.toString());
    onSettingsChange?.({ threshold: numValue, currency });
  };

  // Handle currency change
  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    localStorage.setItem("currency", value);
    onSettingsChange?.({ threshold: signalThreshold, currency: value });
  };

  const refreshRateMs: Record<string, number> = {
    "30s": 30000,
    "60s": 60000,
    "120s": 120000,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="settings-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Palette className="h-5 w-5 flex-shrink-0" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configure your trading dashboard preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Theme Settings */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm font-semibold">Appearance</Label>
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
              <span className="text-xs sm:text-sm">Dark Mode</span>
              <Badge
                variant={theme === "dark" ? "default" : "secondary"}
                className="cursor-pointer text-xs"
                onClick={toggleTheme}
                data-testid="theme-badge"
              >
                {theme === "dark" ? "On" : "Off"}
              </Badge>
            </div>
          </div>

          {/* Refresh Rate */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 flex-shrink-0" />
              Data Update Frequency
            </Label>
            <div className="flex gap-1 sm:gap-2">
              {(["30s", "60s", "120s"] as const).map((rate) => (
                <Button
                  key={rate}
                  variant={refreshRate === rate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRefreshRate(rate)}
                  data-testid={`refresh-${rate}`}
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                >
                  {rate}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Updates: Every {refreshRate} (Binance API)
            </p>
          </div>

          {/* Notifications */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 flex-shrink-0" />
              Notifications
            </Label>
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
              <span className="text-xs sm:text-sm">Trading Alerts</span>
              <Badge
                variant={notifications ? "default" : "secondary"}
                className="cursor-pointer text-xs"
                onClick={() => setNotifications(!notifications)}
                data-testid="notifications-badge"
              >
                {notifications ? "On" : "Off"}
              </Badge>
            </div>
          </div>

          {/* Signal Threshold */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              Minimum Signal Size
            </Label>
            <div className="flex gap-1 sm:gap-2">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={signalThreshold}
                onChange={(e) => handleThresholdChange(e.target.value)}
                placeholder="Signal threshold"
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                data-testid="signal-threshold-input"
              />
              <span className="text-xs sm:text-sm text-muted-foreground pt-2">{currency}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Only signals with size ≥ ${signalThreshold.toFixed(2)} {currency} will be displayed
            </p>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 flex-shrink-0" />
              Currency
            </Label>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-9" data-testid="currency-select">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="text-xs sm:text-sm">
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All signal values will be displayed in {currency}
            </p>
          </div>

          {/* Info */}
          <div className="p-2 sm:p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">About TradingDash</p>
            <p className="text-xs">Real-time multi-asset trading dashboard</p>
            <p className="text-xs">Data: Binance API + CoinGecko</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-settings"
            className="text-xs sm:text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
