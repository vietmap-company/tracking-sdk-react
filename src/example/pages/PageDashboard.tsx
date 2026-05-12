import { Dashboard } from '@/components/dashboard/Dashboard'

export function PageDashboard() {
  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <Dashboard />
      </div>
    </div>
  )
}
