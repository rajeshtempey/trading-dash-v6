import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimezoneTime {
  label: string;
  time: string;
  timezone: string;
}

export function MultiTimezoneClock() {
  const [times, setTimes] = useState<TimezoneTime[]>([]);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      
      const formatTime = (date: Date, timeZone: string): string => {
        return date.toLocaleTimeString("en-US", {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      };

      setTimes([
        { label: "UTC", time: formatTime(now, "UTC"), timezone: "UTC" },
        { label: "IST", time: formatTime(now, "Asia/Kolkata"), timezone: "Asia/Kolkata" },
        { label: "CST", time: formatTime(now, "America/Chicago"), timezone: "America/Chicago" },
      ]);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4" data-testid="multi-timezone-clock">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-3">
        {times.map((tz, index) => (
          <div key={tz.label} className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">{tz.label}</span>
            <span className="font-mono text-sm font-semibold tabular-nums" data-testid={`time-${tz.label.toLowerCase()}`}>
              {tz.time}
            </span>
            {index < times.length - 1 && (
              <span className="text-muted-foreground/50 ml-2">|</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
