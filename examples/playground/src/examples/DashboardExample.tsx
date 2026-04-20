import { useState } from 'react'
import { Dashboard } from '@vietmap/fleetwork-tracking-sdk-react'

export function DashboardExample() {
  const [summary, setSummary] = useState(true)
  const [report, setReport] = useState(true)
  const [heatmap, setHeatmap] = useState(true)
  const [fuel, setFuel] = useState(true)
  const [expenses, setExpenses] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          padding: 12,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        <Toggle label='Summary' value={summary} onChange={setSummary} />
        <Toggle label='Member Report' value={report} onChange={setReport} />
        <Toggle label='Heatmap' value={heatmap} onChange={setHeatmap} />
        <Toggle label='Fuel' value={fuel} onChange={setFuel} />
        <Toggle label='Expenses' value={expenses} onChange={setExpenses} />
      </div>

      <Dashboard
        showSummaryCards={summary}
        showMemberReport={report}
        showActivityHeatmap={heatmap}
        showFuelTracking={fuel}
        showMonthlyExpenses={expenses}
        onError={(err) => console.error('[Dashboard]', err)}
      />
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
    >
      <input
        type='checkbox'
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}
