import { Dashboard } from '@vietmap/fleetwork-tracking-sdk-react'

/**
 * Page 1 — Dashboard Default
 * Drop-in <Dashboard /> với toàn bộ 5 widget, mọi thứ default.
 */
export function PageDashboardDefault() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Dashboard — Mặc định</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted-foreground)' }}>
          Sử dụng <code style={{ fontSize: 12 }}>&lt;Dashboard /&gt;</code> không tham số — render đầy đủ 5 widget với auto-poll mỗi 30s.
        </p>
      </div>

      <Dashboard pollInterval={30_000} />
    </div>
  )
}
