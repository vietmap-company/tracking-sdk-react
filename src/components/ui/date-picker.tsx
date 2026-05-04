import * as React from 'react'
import { format, startOfDay } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useOptionalFleetwork } from '@/provider/FleetworkProvider'

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  placeholder?: string
  formatLabel?: (date: Date) => string
  className?: string
}

export function DatePicker({
  value, onChange, minDate, maxDate,
  placeholder, formatLabel, className,
}: DatePickerProps) {
  const ctx = useOptionalFleetwork()
  const resolvedPlaceholder = placeholder ?? ctx?.t('datepicker.placeholder') ?? 'Chọn ngày'

  const [open, setOpen] = React.useState(false)
  // temp selection — only commit on confirm
  const [temp, setTemp] = React.useState<Date | undefined>(value)

  // sync temp when value changes externally
  React.useEffect(() => { setTemp(value) }, [value])

  const handleOpen = (v: boolean) => {
    if (v) setTemp(value) // reset temp to current value on open
    setOpen(v)
  }

  const handleConfirm = () => {
    if (temp) onChange?.(temp)
    setOpen(false)
  }

  const handleCancel = () => {
    setTemp(value)
    setOpen(false)
  }

  const label = value
    ? formatLabel ? formatLabel(value) : format(value, 'dd/MM/yyyy')
    : resolvedPlaceholder

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background',
            'px-2.5 text-[12px] font-medium text-foreground',
            'hover:bg-muted transition-colors outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg"
        align="center"
        sideOffset={6}
        onWheel={(e) => e.stopPropagation()}
      >
        <Calendar
          mode="single"
          selected={temp}
          onSelect={setTemp}
          defaultMonth={temp ?? value}
          disabled={(d) => {
            if (minDate && startOfDay(d) < startOfDay(minDate)) return true
            if (maxDate && startOfDay(d) > startOfDay(maxDate)) return true
            return false
          }}
          initialFocus
        />
        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border/50 px-3 py-2.5">
          <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={handleCancel}>
            {ctx?.t('datepicker.cancel') ?? 'Hủy'}
          </Button>
          <Button size="sm" className="h-7 text-[12px]" disabled={!temp} onClick={handleConfirm}>
            {ctx?.t('datepicker.apply') ?? 'Áp dụng'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
