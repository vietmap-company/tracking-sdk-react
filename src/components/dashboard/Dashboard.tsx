import * as React from "react";
import { cn } from "@/lib/utils";
import { SummaryCards } from "./SummaryCards";
import { MemberReport } from "./MemberReport";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { FuelTracking } from "./FuelTracking";
import { MonthlyExpenses } from "./MonthlyExpenses";

export interface DashboardProps {
  date?: number;
  pollInterval?: number;
  showSummaryCards?: boolean;
  showMemberReport?: boolean;
  showActivityHeatmap?: boolean;
  showFuelTracking?: boolean;
  showMonthlyExpenses?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onError?: (error: Error) => void;
}

export function Dashboard({
  date,
  pollInterval = 30000,
  showSummaryCards = true,
  showMemberReport = true,
  showActivityHeatmap = true,
  showFuelTracking = true,
  showMonthlyExpenses = true,
  className,
  style,
  onError,
}: DashboardProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)} style={style}>
      {showSummaryCards && (
        <SummaryCards
          date={date}
          pollInterval={pollInterval}
          onError={onError}
        />
      )}

      {showMemberReport && (
        <MemberReport
          date={date}
          pollInterval={pollInterval}
          onError={onError}
        />
      )}

      {showActivityHeatmap && (
        <ActivityHeatmap pollInterval={pollInterval} onError={onError} />
      )}

      {(showFuelTracking || showMonthlyExpenses) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {showFuelTracking && (
            <FuelTracking pollInterval={pollInterval} onError={onError} />
          )}
          {showMonthlyExpenses && (
            <MonthlyExpenses pollInterval={pollInterval} onError={onError} />
          )}
        </div>
      )}
    </div>
  );
}
