import { useFleetwork } from '@/provider/FleetworkProvider'
import { cn } from '@/lib/utils'

export interface ErrorBannerProps {
  error: Error
  onRetry?: () => void
  className?: string
}

export function ErrorBanner({ error, onRetry, className }: ErrorBannerProps) {
  const { t } = useFleetwork()
  return (
    <div className={cn('flex items-center justify-between p-4 text-sm text-destructive', className)}>
      <span>{t('common.error')}: {error.message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs underline underline-offset-2 ml-4 shrink-0">
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
