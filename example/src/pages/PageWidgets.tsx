import {
  SummaryCards,
  MemberReport,
  ActivityHeatmap,
  FuelTracking,
  MonthlyExpenses,
} from '@vietmap/fleetwork-tracking-sdk-react'

/**
 * Page 4 — Widgets
 * Demo từng widget riêng lẻ từ Dashboard.
 */
export function PageWidgets() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🧩 Widgets Demo</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted-foreground)' }}>
          Kết hợp từng widget từ Dashboard SDK để làm custom layout.
        </p>
      </div>

      <h2 style={headerStyle}>Summary Cards</h2>
      <SummaryCards pollInterval={15_000} />

      <h2 style={headerStyle}>Member Report</h2>
      <MemberReport pollInterval={20_000} />

      <h2 style={headerStyle}>Activity Heatmap</h2>
      <ActivityHeatmap />

      <h2 style={headerStyle}>Fuel Tracking</h2>
      <FuelTracking />

      <h2 style={headerStyle}>Monthly Expenses</h2>
      <MonthlyExpenses />
    </div>
  )
}

const headerStyle = {
  margin: '24px 0 12px',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--foreground)',
}
