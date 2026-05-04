import { Routes, Route, Navigate } from 'react-router-dom'
import { FleetworkProvider } from '@/provider/FleetworkProvider'
import { AppShell } from '@/example/AppShell'
import { SdkKeyGate } from '@/example/SdkKeyGate'
import { PageDashboard } from '@/example/pages/PageDashboard'
import { PageLiveMap } from '@/example/pages/PageLiveMap'
import { PageReport } from '@/example/pages/PageReport'
import { PageController } from '@/example/pages/PageController'

const API_KEY = import.meta.env.VITE_API_KEY ?? 'demo-key'
const BASE_URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:3001'

function App() {
  return (
    <SdkKeyGate apiKey={API_KEY} baseUrl={BASE_URL}>
      {({ apiKey, baseUrl }) => (
        <FleetworkProvider apiKey={apiKey} baseUrl={baseUrl} locale="vi">
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<PageDashboard />} />
              <Route path="/livemap" element={<PageLiveMap />} />
              <Route path="/report" element={<PageReport />} />
              <Route path="/controller" element={<PageController />} />
            </Routes>
          </AppShell>
        </FleetworkProvider>
      )}
    </SdkKeyGate>
  )
}

export default App
