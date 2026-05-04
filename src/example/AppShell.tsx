import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Map, FileBarChart2, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/livemap',   icon: Map,             label: 'Live Map'  },
  { to: '/report',    icon: FileBarChart2,    label: 'Report'    },
  { to: '/controller',icon: Terminal,         label: 'Controller'},
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-border/50 flex flex-col bg-card">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/50">
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

        {/* Nav */}
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

      {/* Main */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
