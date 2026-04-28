import * as React from "react";
import { format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOptionalFleetwork } from "@/provider/FleetworkProvider";

export interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onChange?: (range: { from: Date; to: Date }) => void;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  minDate,
  maxDate,
  numberOfMonths = 2,
  placeholder,
  className,
}: DateRangePickerProps) {
  const ctx = useOptionalFleetwork();
  const t = ctx?.t;
  const resolvedPlaceholder = placeholder ?? t?.("datepicker.range.placeholder") ?? "Chọn khoảng ngày";
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<DateRange | undefined>(
    from && to ? { from, to } : undefined,
  );

  React.useEffect(() => {
    setPending(from && to ? { from, to } : undefined);
  }, [from, to]);

  const handleSelect = (range: DateRange | undefined) => {
    setPending(range);
  };

  const handleApply = () => {
    if (!pending?.from || !pending?.to) return;
    const f = new Date(
      pending.from.getFullYear(),
      pending.from.getMonth(),
      pending.from.getDate(),
      0,
      0,
      0,
      0,
    );
    const t = new Date(
      pending.to.getFullYear(),
      pending.to.getMonth(),
      pending.to.getDate(),
      23,
      59,
      59,
      999,
    );
    onChange?.({ from: f, to: t });
    setOpen(false);
  };

  const handleCancel = () => {
    setPending(from && to ? { from, to } : undefined);
    setOpen(false);
  };

  const label = React.useMemo(() => {
    if (pending?.from) {
      if (pending.to) {
        return `${format(pending.from, "dd/MM/yyyy")} – ${format(pending.to, "dd/MM/yyyy")}`;
      }
      return `${format(pending.from, "dd/MM/yyyy")} →`;
    }
    return resolvedPlaceholder;
  }, [pending, resolvedPlaceholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 justify-start gap-2 bg-card text-left text-sm font-normal",
            !pending?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        sideOffset={8}
        onWheel={(e) => e.stopPropagation()}
      >
        <Calendar
          mode="range"
          selected={pending}
          onSelect={handleSelect}
          numberOfMonths={numberOfMonths}
          defaultMonth={pending?.from ?? from ?? new Date()}
          disabled={(date) => {
            if (minDate && startOfDay(date) < startOfDay(minDate)) return true;
            if (maxDate && startOfDay(date) > startOfDay(maxDate)) return true;
            return false;
          }}
        />
        <div className="flex justify-end gap-2 border-t px-3 py-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            {t?.("datepicker.cancel") ?? "Hủy"}
          </Button>
          <Button
            size="sm"
            disabled={!pending?.from || !pending?.to}
            onClick={handleApply}
          >
            {t?.("datepicker.apply") ?? "Áp dụng"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
