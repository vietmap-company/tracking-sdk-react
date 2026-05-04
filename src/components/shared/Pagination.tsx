import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFleetwork } from '@/provider/FleetworkProvider'

export interface PaginationFooterProps {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export function PaginationFooter({ page, totalPages, onPrev, onNext }: PaginationFooterProps) {
  const { t } = useFleetwork()

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
      <p className="text-xs text-muted-foreground">
        {t('report.page')} {page} {t('report.of')} {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={onPrev}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={onNext}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
