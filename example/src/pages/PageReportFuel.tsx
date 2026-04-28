import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FuelSummaryReport,
  FuelDetailReport,
  type ReportRangeState,
} from '@vietmap/tracking-sdk-react'
import { PageHeader } from './PageHeader'
import { TabToggle } from './TabToggle'

type Tab = 'summary' | 'detail'

const TABS: { key: Tab; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'detail', label: 'Detail' },
]

export function PageReportFuel() {
  const navigate = useNavigate()
  const back = () => navigate('/report')
  const [tab, setTab] = useState<Tab>('summary')
  const [range, setRange] = useState<ReportRangeState>({
    from: Date.now() - 30 * 24 * 60 * 60 * 1000,
    to: Date.now(),
  })

  return (
    <div className="p-6">
      <PageHeader
        title="Fuel Report"
        description="Tiêu hao và chi phí nhiên liệu theo user"
        action={<TabToggle tabs={TABS} active={tab} onChange={(k) => setTab(k)} />}
      />

      {tab === 'summary' ? (
        <FuelSummaryReport
          range={range}
          onRangeChange={setRange}
          onBack={back}
          onError={(e) => console.error('[FuelSummary]', e)}
        />
      ) : (
        <FuelDetailReport
          range={range}
          onRangeChange={setRange}
          onBack={back}
          onError={(e) => console.error('[FuelDetail]', e)}
        />
      )}
    </div>
  )
}
