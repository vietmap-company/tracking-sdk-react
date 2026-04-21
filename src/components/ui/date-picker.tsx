import * as React from "react";
import { format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  /** Custom formatter for the trigger label (receives the current value). */
  formatLabel?: (date: Date) => string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Chọn ngày",
  formatLabel,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    const local = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
    onChange?.(local);
    setOpen(false);
  };

  const label = value
    ? formatLabel
      ? formatLabel(value)
      : format(value, "dd/MM/yyyy")
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={8}
        onWheel={(e) => e.stopPropagation()}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
          disabled={(date) => {
            if (minDate && startOfDay(date) < startOfDay(minDate)) return true;
            if (maxDate && startOfDay(date) > startOfDay(maxDate)) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
