import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/livemap', label: '🗺️ Live Map' },
  { to: '/controller', label: '🎮 Controller' },
  { to: '/widgets', label: '🧩 Widgets' },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Top nav */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          height: 52,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--foreground)' }}>
          🚛 Fleetwork SDK Demo
        </span>
        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '5px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'background .15s',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Page content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
