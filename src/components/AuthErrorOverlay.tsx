import * as React from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AuthErrorEvent, Locale } from '@/lib/types'

const COPY = {
  vi: { dismiss: 'Đóng', reload: 'Tải lại trang' },
  en: { dismiss: 'Close', reload: 'Reload page' },
} as const

interface Props {
  event: AuthErrorEvent
  locale?: Locale
  onDismiss: () => void
}

export function AuthErrorOverlay({ event, locale = 'vi', onDismiss }: Props) {
  const copy = COPY[locale] ?? COPY.vi

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onDismiss])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='fleetwork-auth-error-message'
      className='fleetwork-root fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150'
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      <div className='relative mx-4 w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-150'>
        <button
          type='button'
          onClick={onDismiss}
          aria-label={copy.dismiss}
          className='absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <X className='h-4 w-4' />
        </button>

        <div className='flex flex-col items-center gap-4 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
            <AlertTriangle className='h-6 w-6' />
          </div>

          <p
            id='fleetwork-auth-error-message'
            className='break-words text-base font-medium text-foreground'
          >
            {event.message}
          </p>

          <div className='text-xs text-muted-foreground'>
            {event.status}
            {event.method ? ` · ${event.method}` : ''}
          </div>

          <div className='flex w-full gap-2 pt-1'>
            <Button variant='outline' className='flex-1' onClick={onDismiss}>
              {copy.dismiss}
            </Button>
            {event.status === 401 && (
              <Button
                className='flex-1'
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.reload()
                }}
              >
                {copy.reload}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
