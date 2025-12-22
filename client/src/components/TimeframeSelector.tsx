import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Timeframe } from "@shared/schema";

interface TimeframeSelectorProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string, startDate?: string, endDate?: string) => void;
}

const timeframes = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1D", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1mo", label: "1M" },
  { value: "1y", label: "1Y" },
];

const relativeTimeFilters = [
  { value: "past-15min", label: "Past 15 mins" },
  { value: "past-30min", label: "Past 30 mins" },
  { value: "past-1hour", label: "Past 1 hour" },
  { value: "past-1h15min", label: "Past 1h 15min" },
  { value: "past-1h30min", label: "Past 1h 30min" },
  { value: "past-2hours", label: "Past 2 hours" },
  { value: "past-4hours", label: "Past 4 hours" },
  { value: "past-6hours", label: "Past 6 hours" },
  { value: "past-12hours", label: "Past 12 hours" },
  { value: "past-1day", label: "Past 1 day" },
  { value: "past-1week", label: "Past 1 week" },
  { value: "past-1month", label: "Past 1 month" },
];

export function TimeframeSelector({ selectedTimeframe, onTimeframeChange }: TimeframeSelectorProps) {
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"standard" | "relative" | "custom">("standard");

  const handleCustomDateRange = () => {
    if (customStart && customEnd) {
      onTimeframeChange("custom", customStart, customEnd);
      setIsDialogOpen(false);
    }
  };

  const handleRelativeTimeFilter = (filterValue: string) => {
    // Convert relative time filters to dates
    const now = new Date();
    let startDate = new Date();

    switch (filterValue) {
      case "past-15min":
        startDate.setMinutes(startDate.getMinutes() - 15);
        break;
      case "past-30min":
        startDate.setMinutes(startDate.getMinutes() - 30);
        break;
      case "past-1hour":
        startDate.setHours(startDate.getHours() - 1);
        break;
      case "past-1h15min":
        startDate.setHours(startDate.getHours() - 1);
        startDate.setMinutes(startDate.getMinutes() - 15);
        break;
      case "past-1h30min":
        startDate.setHours(startDate.getHours() - 1);
        startDate.setMinutes(startDate.getMinutes() - 30);
        break;
      case "past-2hours":
        startDate.setHours(startDate.getHours() - 2);
        break;
      case "past-4hours":
        startDate.setHours(startDate.getHours() - 4);
        break;
      case "past-6hours":
        startDate.setHours(startDate.getHours() - 6);
        break;
      case "past-12hours":
        startDate.setHours(startDate.getHours() - 12);
        break;
      case "past-1day":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "past-1week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "past-1month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const mins = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${mins}`;
    };

    onTimeframeChange("relative", formatDateTime(startDate), formatDateTime(now));
  };

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2" data-testid="timeframe-selector">
      <div className="flex flex-wrap gap-1 w-full">
        {timeframes.map((tf) => (
          <Button
            key={tf.value}
            variant={selectedTimeframe === tf.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTimeframeChange(tf.value)}
            className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 transition-all hover:scale-105 active:scale-95"
            data-testid={`timeframe-button-${tf.value}`}
          >
            {tf.label}
          </Button>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant={selectedTimeframe === "custom" || selectedTimeframe === "relative" ? "default" : "outline"}
            size="sm"
            className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 transition-all hover:scale-105 active:scale-95"
            data-testid="button-timeframe-custom"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-lg">Date & Time Filters</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
              <TabsTrigger value="standard" className="text-xs sm:text-sm">Standard</TabsTrigger>
              <TabsTrigger value="relative" className="text-xs sm:text-sm">Relative</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-3 sm:space-y-4 mt-4">
              <div>
                <label className="text-xs sm:text-sm font-medium">Select Standard Timeframe</label>
                <p className="text-xs text-muted-foreground">Use the buttons above for predefined timeframes</p>
              </div>
            </TabsContent>

            <TabsContent value="relative" className="space-y-1 sm:space-y-2 mt-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              <label className="text-xs sm:text-sm font-medium block">Quick Time Filters</label>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                {relativeTimeFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRelativeTimeFilter(filter.value)}
                    className="text-xs justify-start h-8 sm:h-9"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-2 sm:space-y-4 mt-4">
              <div>
                <label className="text-xs sm:text-sm font-medium">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  data-testid="input-custom-start-date"
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">End Date & Time</label>
                <Input
                  type="datetime-local"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  data-testid="input-custom-end-date"
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>
              <Button
                onClick={handleCustomDateRange}
                className="w-full text-xs sm:text-sm h-8 sm:h-9"
                data-testid="button-apply-custom-range"
              >
                Apply Range
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
