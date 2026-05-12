import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { DashboardController } from '@/controllers/DashboardController'
import { LiveMapController } from '@/controllers/LiveMapController'
import { startOfTodayMs } from '@/lib/utils'
import { Loader2, Play } from 'lucide-react'

type ResultState = { status: 'idle' | 'loading' | 'ok' | 'error'; data?: unknown; error?: string }

function ResultBox({ state }: { state: ResultState }) {
  if (state.status === 'idle') return null
  if (state.status === 'loading') return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Loading…
    </div>
  )
  return (
    <div className={`mt-2 rounded-md border p-3 text-xs font-mono overflow-auto max-h-48 ${state.status === 'error' ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-border/50 bg-muted/30 text-foreground'}`}>
      <pre>{state.status === 'error' ? state.error : JSON.stringify(state.data, null, 2)}</pre>
    </div>
  )
}

function DemoCard({
  title, description, badge, onRun, result,
}: { title: string; description: string; badge: string; onRun: () => Promise<void>; result: ResultState }) {
  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs shrink-0 font-mono">{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={onRun} disabled={result.status === 'loading'}>
          {result.status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Run
        </Button>
        <ResultBox state={result} />
      </CardContent>
    </Card>
  )
}

function useRun() {
  const [state, setState] = useState<ResultState>({ status: 'idle' })
  const run = async (fn: () => Promise<unknown>) => {
    setState({ status: 'loading' })
    try {
      const data = await fn()
      setState({ status: 'ok', data })
    } catch (e) {
      setState({ status: 'error', error: (e as Error).message })
    }
  }
  return { state, run }
}

export function PageController() {
  const { client } = useFleetwork()

  const summary = useRun()
  const members = useRun()
  const memberReport = useRun()
  const lastLocation = useRun()

  return (
    <div className="h-full overflow-auto">
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Controller API</h1>
        <p className="hidden text-sm text-muted-foreground mt-0.5">Call controllers directly without hooks — useful for imperative flows, event handlers, or non-React contexts.</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dashboard</h2>
        <DemoCard
          title="getSummaryCards"
          description="DashboardController.getSummaryCards({ date: today })"
          badge="GET dashboard/summary"
          result={summary.state}
          onRun={() => summary.run(() => DashboardController.getSummaryCards({ date: startOfTodayMs(), client }))}
        />
        <DemoCard
          title="getMemberReport"
          description="DashboardController.getMemberReport(today, { page: 1, pageSize: 5 })"
          badge="GET dashboard/users"
          result={memberReport.state}
          onRun={() => memberReport.run(() => DashboardController.getMemberReport(startOfTodayMs(), { page: 1, pageSize: 5, client }))}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">LiveMap</h2>
        <DemoCard
          title="getMembers"
          description='LiveMapController.getMembers({ nameKey: "userName", pageSize: 20 })'
          badge="GET gps-tracking/users"
          result={members.state}
          onRun={() => members.run(() => LiveMapController.getMembers({ nameKey: 'userName', pageSize: 20, client }))}
        />
        <DemoCard
          title="getLastLocation (user-001)"
          description="LiveMapController.getLastLocation('user-001')"
          badge="GET gps-tracking/latest/users/:id"
          result={lastLocation.state}
          onRun={() => lastLocation.run(() => LiveMapController.getLastLocation('user-001', { client }))}
        />
      </div>
    </div>
    </div>
  )
}
