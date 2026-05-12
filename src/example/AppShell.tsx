import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Map, FileBarChart2, Terminal, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/livemap',   icon: Map,             label: 'Live Map'  },
  { to: '/report',    icon: FileBarChart2,    label: 'Report'    },
  { to: '/controller',icon: Terminal,         label: 'Controller'},
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        </svg>
      </div>
      <div>
        <p className="text-[13px] font-bold text-foreground leading-none">Fleetwork</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">SDK Example</p>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden sm:flex w-52 shrink-0 border-r border-border/50 flex-col bg-card">
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/50">
          <Logo />
        </div>

        <nav className="flex-1 p-2 space-y-0.5 pt-3">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground/60 text-center">v0.1.0</p>
        </div>
      </aside>

      {/* ── Column wrapper (takes remaining width on desktop, full width on mobile) */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Mobile top bar ───────────────────────────────────────────────── */}
        <header className="sm:hidden h-14 shrink-0 flex items-center justify-between px-4 border-b border-border/50 bg-card">
          <Logo />
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-hidden bg-background">
          {children}
        </main>

        {/* ── Mobile bottom nav ────────────────────────────────────────────── */}
        <nav className="sm:hidden shrink-0 h-16 border-t border-border/50 bg-card flex items-center">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Mobile drawer overlay ────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="sm:hidden fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col bg-card border-r border-border/50 shadow-xl">
            <div className="h-14 flex items-center justify-between px-4 border-b border-border/50">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 p-2 space-y-0.5 pt-3">
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="p-3 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground/60 text-center">v0.1.0</p>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
