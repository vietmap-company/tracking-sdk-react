import { TableCell, TableRow } from '@/components/ui/table'
import { useFleetwork } from '@/provider/FleetworkProvider'

export interface EmptyTableRowProps {
  colSpan: number
  message?: string
}

export function EmptyTableRow({ colSpan, message }: EmptyTableRowProps) {
  const { t } = useFleetwork()
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-sm text-muted-foreground">
        {message ?? t('common.noData')}
      </TableCell>
    </TableRow>
  )
}
