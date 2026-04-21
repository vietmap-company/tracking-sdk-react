import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FleetworkProvider } from '@vietmap/fleetwork-tracking-sdk-react'
import '@vietmap/fleetwork-tracking-sdk-react/styles.css'
import './index.css'

import { AppShell } from './components/AppShell'
import { PageDashboardDefault } from './pages/PageDashboardDefault'
import { PageLiveMap } from './pages/PageLiveMap'
import { PageController } from './pages/PageController'
import { PageWidgets } from './pages/PageWidgets'
import { SDK_CONFIG } from './config'
import { SdkKeyGate, type SdkRuntimeConfig } from './components/SdkKeyGate'

function RootApp() {
  const [runtimeConfig, setRuntimeConfig] = useState<SdkRuntimeConfig | null>(() => {
    const hasEnv = Boolean(SDK_CONFIG.apiKey && SDK_CONFIG.apiKeyTilemap)
    if (hasEnv) {
      return {
        apiKey: SDK_CONFIG.apiKey,
        apiKeyTilemap: SDK_CONFIG.apiKeyTilemap,
        baseUrl: SDK_CONFIG.baseUrl,
      }
    }
    return null
  })

  if (!runtimeConfig) {
    return (
      <SdkKeyGate
        initial={{ baseUrl: SDK_CONFIG.baseUrl }}
        onSubmit={(cfg) => setRuntimeConfig(cfg)}
      />
    )
  }

  return (
    <FleetworkProvider
      apiKey={runtimeConfig.apiKey}
      apiKeyTilemap={runtimeConfig.apiKeyTilemap}
      baseUrl={runtimeConfig.baseUrl}
      locale={SDK_CONFIG.locale}
    >
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path='/' element={<Navigate to='/dashboard' replace />} />
            <Route path='/dashboard' element={<PageDashboardDefault />} />
            <Route path='/livemap' element={<PageLiveMap />} />
            <Route path='/controller' element={<PageController />} />
            <Route path='/widgets' element={<PageWidgets />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </FleetworkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
)
