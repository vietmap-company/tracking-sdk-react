import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ActivityTimeReport,
  type ReportRangeState,
} from '@vietmap/tracking-sdk-react'
import { PageHeader } from './PageHeader'

export function PageReportActivity() {
  const navigate = useNavigate()
  const back = () => navigate('/report')
  const [range, setRange] = useState<ReportRangeState>({
    from: Date.now() - 30 * 24 * 60 * 60 * 1000,
    to: Date.now(),
  })

  return (
    <div className="p-6">
      <PageHeader
        title="Activity Report"
        description="Thống kê hoạt động theo giờ trong ngày"
      />
      <ActivityTimeReport
        range={range}
        onRangeChange={setRange}
        onBack={back}
        onError={(e) => console.error('[ActivityTime]', e)}
      />
    </div>
  )
}
