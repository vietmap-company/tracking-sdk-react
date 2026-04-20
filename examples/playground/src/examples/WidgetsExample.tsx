import {
  ActivityHeatmap,
  FuelTracking,
  MemberReport,
  MonthlyExpenses,
  SummaryCards,
} from '@vietmap/fleetwork-tracking-sdk-react'

export function WidgetsExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title='SummaryCards (props: date, pollInterval)'>
        <SummaryCards />
      </Section>

      <Section title='MemberReport (props: date, pageSize=5)'>
        <MemberReport pageSize={5} />
      </Section>

      <Section title='ActivityHeatmap'>
        <ActivityHeatmap />
      </Section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 16,
        }}
      >
        <Section title={`FuelTracking (groupBy='month')`}>
          <FuelTracking groupBy='month' />
        </Section>
        <Section title='MonthlyExpenses'>
          <MonthlyExpenses currency='VND' />
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#64748b',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}
