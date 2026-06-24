import { useState } from 'react'
import { Dashboard } from '@/components/dashboard/Dashboard'

// Vài userId có thật để bấm thử nhanh.
const SAMPLE_IDS = ['kpg-2', 'kpg-fix', 'khiem-dev']

export function PageDashboard() {
  const [raw, setRaw] = useState('')

  // "a, b, c" -> ["a","b","c"]. Rỗng -> undefined = hiện tất cả.
  const userIds = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const filter = userIds.length ? userIds : undefined

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        {/* Demo filter theo userIds (áp dụng cho Member report) */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Lọc userIds (cách nhau dấu phẩy) — để trống = tất cả"
            className="flex-1 min-w-[240px] text-sm border border-border rounded px-2 py-1 bg-background font-mono"
          />
          <button
            type="button"
            onClick={() => setRaw(SAMPLE_IDS.join(', '))}
            className="text-xs px-2 py-1 rounded border border-border bg-muted hover:bg-muted/70"
          >
            Mẫu: {SAMPLE_IDS.length} user
          </button>
          <button
            type="button"
            onClick={() => setRaw('')}
            className="text-xs px-2 py-1 rounded border border-border bg-muted hover:bg-muted/70"
          >
            Xoá lọc
          </button>
          <span className="text-xs text-muted-foreground">
            {filter ? `Đang lọc ${filter.length} user` : 'Đang hiện tất cả'}
          </span>
        </div>

        <Dashboard userIds={filter} />
      </div>
    </div>
  )
}
