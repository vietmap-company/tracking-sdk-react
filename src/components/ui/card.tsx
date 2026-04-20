import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'fw-bg-card fw-text-card-foreground flex flex-col gap-4 rounded-xl border bg-white py-4 shadow-sm',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-5',
        className
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-base leading-none font-semibold', className)}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('text-sm text-slate-500', className)} {...props} />
  )
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('px-5', className)} {...props} />
}

export function CardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center px-5', className)} {...props} />
  )
}
