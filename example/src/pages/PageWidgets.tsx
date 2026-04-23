import {
  ActivityHeatmap,
  FuelTracking,
  MemberReport,
  MonthlyExpenses,
  SummaryCards,
} from '@vietmap/fleetwork-tracking-sdk-react'
import { PageHeader } from './PageHeader'

export function PageWidgets() {
  return (
    <div className='p-6'>
      <PageHeader
        title='Widgets'
        description='Từng widget riêng lẻ — dùng khi cần custom layout.'
      />

      <Section label='Summary Cards'>
        <SummaryCards pollInterval={15_000} />
      </Section>

      <Section label='Member Report'>
        <MemberReport pollInterval={20_000} />
      </Section>

      <Section label='Activity Heatmap'>
        <ActivityHeatmap />
      </Section>

      <Section label='Fuel Tracking'>
        <FuelTracking />
      </Section>

      <Section label='Monthly Expenses'>
        <MonthlyExpenses />
      </Section>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='mt-8'>
      <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
        {label}
      </p>
      {children}
    </div>
  )
}
