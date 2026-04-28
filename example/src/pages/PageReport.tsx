import { Activity, ChevronRight, Droplet, Route } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from './PageHeader'

const REPORT_CARDS = [
  {
    to: '/report/trip',
    icon: <Route className="h-5 w-5" />,
    title: 'Trip Report',
    subtitle: 'Hành trình tổng hợp và chi tiết theo ngày',
  },
  {
    to: '/report/fuel',
    icon: <Droplet className="h-5 w-5" />,
    title: 'Fuel Report',
    subtitle: 'Tiêu hao và chi phí nhiên liệu theo user',
  },
  {
    to: '/report/activity',
    icon: <Activity className="h-5 w-5" />,
    title: 'Activity Report',
    subtitle: 'Thống kê hoạt động theo giờ trong ngày',
  },
]

export function PageReport() {
  return (
    <div className="p-6">
      <PageHeader
        title="Reports"
        description="Chọn loại báo cáo để xem phân tích chi tiết."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-whisper transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated no-underline"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-base font-semibold tracking-tight text-foreground">
                  {card.title}
                </h3>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {card.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
