import { TableCell, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

export interface TableSkeletonRowsProps {
  rows?: number
  cols: number
  /** First col renders avatar + text skeleton instead of plain bar */
  firstColAvatar?: boolean
}

export function TableSkeletonRows({ rows = 5, cols, firstColAvatar = false }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="border-border/40">
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j} className={j > 0 ? 'text-right' : ''}>
              {j === 0 && firstColAvatar ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ) : (
                <Skeleton className={`h-3 ${j === 0 ? 'w-28' : 'w-16 ml-auto'}`} />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
