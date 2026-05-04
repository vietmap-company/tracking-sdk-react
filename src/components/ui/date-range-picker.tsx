import * as React from 'react'
import { format, startOfDay } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useOptionalFleetwork } from '@/provider/FleetworkProvider'

export interface DateRangePickerProps {
  from?: Date
  to?: Date
  onChange?: (range: { from: Date; to: Date }) => void
  minDate?: Date
  maxDate?: Date
  numberOfMonths?: number
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  from, to, onChange, minDate, maxDate,
  numberOfMonths = 2, placeholder, className,
}: DateRangePickerProps) {
  const ctx = useOptionalFleetwork()
  const t = ctx?.t
  const resolvedPlaceholder = placeholder ?? t?.('datepicker.range.placeholder') ?? 'Chọn khoảng ngày'

  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState<DateRange | undefined>(
    from && to ? { from, to } : undefined
  )

  // Sync when external value changes
  React.useEffect(() => {
    setPending(from && to ? { from, to } : undefined)
  }, [from, to])

  const handleApply = () => {
    if (!pending?.from || !pending?.to) return
    const f = new Date(pending.from.getFullYear(), pending.from.getMonth(), pending.from.getDate(), 0, 0, 0, 0)
    const e = new Date(pending.to.getFullYear(), pending.to.getMonth(), pending.to.getDate(), 23, 59, 59, 999)
    onChange?.({ from: f, to: e })
    setOpen(false)
  }

  const handleCancel = () => {
    setPending(from && to ? { from, to } : undefined)
    setOpen(false)
  }

  const label = React.useMemo(() => {
    if (pending?.from) {
      if (pending.to) return `${format(pending.from, 'dd/MM/yyyy')} – ${format(pending.to, 'dd/MM/yyyy')}`
      return `${format(pending.from, 'dd/MM/yyyy')} →`
    }
    return resolvedPlaceholder
  }, [pending, resolvedPlaceholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-8 justify-start gap-2 bg-card text-left text-[12px] font-normal',
            !pending?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-lg" align="end" sideOffset={6} onWheel={(e) => e.stopPropagation()}>
        <Calendar
          mode="range"
          selected={pending}
          onSelect={setPending}
          numberOfMonths={numberOfMonths}
          defaultMonth={pending?.from ?? from ?? new Date()}
          disabled={(date) => {
            if (minDate && startOfDay(date) < startOfDay(minDate)) return true
            if (maxDate && startOfDay(date) > startOfDay(maxDate)) return true
            return false
          }}
        />
        <div className="flex items-center justify-end gap-2 border-t border-border/50 px-3 py-2.5">
          <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={handleCancel}>
            {t?.('datepicker.cancel') ?? 'Hủy'}
          </Button>
          <Button
            size="sm"
            className="h-7 text-[12px]"
            disabled={!pending?.from || !pending?.to}
            onClick={handleApply}
          >
            {t?.('datepicker.apply') ?? 'Áp dụng'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
