import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/livemap", label: "Live Map" },
  { to: "/report", label: "Report" },
  { to: "/controller", label: "Controller" },
  { to: "/widgets", label: "Widgets" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-13 shrink-0 items-center gap-6 border-b border-border bg-card px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-semibold tracking-tight text-foreground">
            Fleetwork SDK
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto">
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Demo
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
