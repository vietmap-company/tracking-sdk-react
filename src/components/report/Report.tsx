import * as React from "react";
import { Activity, ChevronRight, Droplet, Route } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useFleetwork } from "@/provider/FleetworkProvider";
import { cn, daysAgoMs } from "@/lib/utils";
import {
  ActivityTimeReport,
  FuelDetailReport,
  FuelSummaryReport,
  TripDetailReport,
  TripSummaryReport,
  type ReportRangeState,
} from "./views";

type ReportMode = "home" | "trip" | "fuel" | "activity";

export interface ReportProps {
  /** Initial from (ms). Default: 30 days ago */
  from?: number;
  /** Initial to (ms). Default: now */
  to?: number;
  className?: string;
  style?: React.CSSProperties;
  onError?: (error: Error) => void;
}

export function Report({ from, to, className, style, onError }: ReportProps) {
  const { t } = useFleetwork();
  const [mode, setMode] = React.useState<ReportMode>("home");
  const [range, setRange] = React.useState<ReportRangeState>({
    from: from ?? daysAgoMs(30),
    to: to ?? Date.now(),
  });

  const back = React.useCallback(() => setMode("home"), []);

  if (mode === "trip") {
    return (
      <TripFuelTabs
        className={className}
        style={style}
        title={t("reports.trip.title")}
        subtitle={t("reports.trip.subtitle")}
        onBack={back}
        Summary={() => (
          <TripSummaryReport range={range} onRangeChange={setRange} onError={onError} />
        )}
        Detail={() => (
          <TripDetailReport range={range} onRangeChange={setRange} onError={onError} />
        )}
      />
    );
  }

  if (mode === "fuel") {
    return (
      <TripFuelTabs
        className={className}
        style={style}
        title={t("reports.fuel.title")}
        subtitle={t("reports.fuel.subtitle")}
        onBack={back}
        Summary={() => (
          <FuelSummaryReport range={range} onRangeChange={setRange} onError={onError} />
        )}
        Detail={() => (
          <FuelDetailReport range={range} onRangeChange={setRange} onError={onError} />
        )}
      />
    );
  }

  if (mode === "activity") {
    return (
      <div className={cn("w-full", className)} style={style}>
        <ActivityTimeReport
          range={range}
          onRangeChange={setRange}
          onBack={back}
          onError={onError}
        />
      </div>
    );
  }

  // home
  return (
    <div className={cn("w-full", className)} style={style}>
      <div className="mb-12">
        <h1 className="fw-display text-5xl text-foreground">{t("reports.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("reports.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          icon={<Route className="h-5 w-5" />}
          title={t("reports.trip.title")}
          subtitle={t("reports.trip.subtitle")}
          onClick={() => setMode("trip")}
        />
        <ReportCard
          icon={<Droplet className="h-5 w-5" />}
          title={t("reports.fuel.title")}
          subtitle={t("reports.fuel.subtitle")}
          onClick={() => setMode("fuel")}
        />
        <ReportCard
          icon={<Activity className="h-5 w-5" />}
          title={t("reports.activity.title")}
          subtitle={t("reports.activity.subtitle")}
          onClick={() => setMode("activity")}
        />
      </div>
    </div>
  );
}

interface ReportCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function ReportCard({ icon, title, subtitle, onClick }: ReportCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-6 text-left",
        "shadow-whisper transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-base font-semibold tracking-tight text-foreground">{title}</h3>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  );
}

interface TripFuelTabsProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  Summary: React.ComponentType;
  Detail: React.ComponentType;
  className?: string;
  style?: React.CSSProperties;
}

function TripFuelTabs({ title, subtitle, onBack, Summary, Detail, className, style }: TripFuelTabsProps) {
  const { t } = useFleetwork();
  return (
    <div className={cn("w-full", className)} style={style}>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ChevronLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-5">
          <TabsTrigger value="summary">{t("reports.tab.summary")}</TabsTrigger>
          <TabsTrigger value="detail">{t("reports.tab.detail")}</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <Summary />
        </TabsContent>
        <TabsContent value="detail">
          <Detail />
        </TabsContent>
      </Tabs>
    </div>
  );
}
