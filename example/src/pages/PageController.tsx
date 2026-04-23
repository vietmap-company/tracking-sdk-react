import { useState } from 'react'
import { DashboardController, LiveMapController } from '@vietmap/fleetwork-tracking-sdk-react'
import { PageHeader } from './PageHeader'

const ACTIONS = [
  {
    label: 'getSummaryCards',
    run: async () => {
      const data = await DashboardController.getSummaryCards()
      return JSON.stringify(data, null, 2)
    },
  },
  {
    label: 'getMemberReport',
    run: async () => {
      const data = await DashboardController.getMemberReport(Date.now())
      return `${data.members.length} members — page ${data.pagination.page}/${data.pagination.totalPages}`
    },
  },
  {
    label: 'getMembers (LiveMap)',
    run: async () => {
      const members = await LiveMapController.getMembers()
      return `${members.length} members: ${members.map((m) => m.name).join(', ')}`
    },
  },
]

export function PageController() {
  const [log, setLog] = useState<{ label: string; result: string; ts: string }[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  async function run(action: (typeof ACTIONS)[number]) {
    setLoading(action.label)
    try {
      const result = await action.run()
      setLog((prev) => [
        { label: action.label, result, ts: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ])
    } catch (err) {
      setLog((prev) => [
        { label: action.label, result: String(err), ts: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className='p-6'>
      <PageHeader
        title='Controller'
        description='Gọi DashboardController / LiveMapController trực tiếp — không cần React hooks.'
      />

      {/* Action buttons */}
      <div className='flex flex-wrap gap-2'>
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => run(action)}
            disabled={loading !== null}
            className='rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading === action.label ? (
              <span className='opacity-60'>Loading…</span>
            ) : (
              action.label
            )}
          </button>
        ))}
      </div>

      {/* Log output */}
      {log.length > 0 && (
        <div className='mt-6 rounded-xl border border-border bg-card'>
          <div className='flex items-center justify-between border-b border-border px-4 py-2.5'>
            <span className='text-xs font-semibold text-muted-foreground'>Output</span>
            <button
              onClick={() => setLog([])}
              className='text-[11px] text-muted-foreground hover:text-foreground'
            >
              Clear
            </button>
          </div>
          <div className='divide-y divide-border'>
            {log.map((entry, i) => (
              <div key={i} className='px-4 py-3'>
                <div className='mb-1 flex items-center gap-2'>
                  <span className='rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary'>
                    {entry.label}
                  </span>
                  <span className='text-[11px] text-muted-foreground'>{entry.ts}</span>
                </div>
                <pre className='whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-foreground'>
                  {entry.result}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {log.length === 0 && (
        <div className='mt-10 text-center text-sm text-muted-foreground'>
          Nhấn một nút để gọi API và xem kết quả
        </div>
      )}
    </div>
  )
}
