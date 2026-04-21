import { DashboardController, LiveMapController } from '@vietmap/fleetwork-tracking-sdk-react'
import { useState } from 'react'

/**
 * Page 3 — Controller
 * Dùng API của `DashboardController` + `LiveMapController` bên ngoài React.
 */
export function PageController() {
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)])

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🎮 SDK Controller Demo</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted-foreground)' }}>
          Dùng `DashboardController` và `LiveMapController` để gọi API bên ngoài React hooks.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={async () => {
            const data = await DashboardController.getSummaryCards()
            addLog(`getSummaryCards: ${JSON.stringify(data)}`)
          }}
          style={btnStyle}
        >
          Fetch Summary Cards
        </button>

        <button
          onClick={async () => {
            const members = await LiveMapController.getMembers()
            addLog(`getMembers: Fetched ${members.length} items`)
          }}
          style={btnStyle}
        >
          Fetch Members
        </button>
      </div>

      <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: '1.4', color: 'var(--muted-foreground)' }}>
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  )
}

const btnStyle = {
  padding: '6px 10px',
  marginRight: 8,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 12,
}
