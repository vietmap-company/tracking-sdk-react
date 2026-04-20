import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: number
}

export function Avatar({
  src,
  alt,
  fallback,
  size = 32,
  className,
  ...props
}: AvatarProps) {
  const [errored, setErrored] = React.useState(false)
  const showImage = src && !errored

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-medium text-slate-600',
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? ''}
          className='h-full w-full object-cover'
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{(fallback ?? alt ?? '?').slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}
