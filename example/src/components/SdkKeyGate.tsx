import { useMemo, useState } from 'react'

export interface SdkRuntimeConfig {
  apiKey: string
  apiKeyTilemap: string
  baseUrl?: string
}

interface SdkKeyGateProps {
  initial?: Partial<SdkRuntimeConfig>
  onSubmit: (config: SdkRuntimeConfig) => void
}

export function SdkKeyGate({ initial, onSubmit }: SdkKeyGateProps) {
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '')
  const [apiKeyTilemap, setApiKeyTilemap] = useState(initial?.apiKeyTilemap ?? '')
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? 'https://tracking.fleetwork.vn')

  const isValid = useMemo(
    () => apiKey.trim().length > 0 && apiKeyTilemap.trim().length > 0,
    [apiKey, apiKeyTilemap]
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--background)',
        padding: 16,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!isValid) return
          onSubmit({
            apiKey: apiKey.trim(),
            apiKeyTilemap: apiKeyTilemap.trim(),
            baseUrl: baseUrl.trim() || 'https://tracking.fleetwork.vn',
          })
        }}
        style={{
          width: '100%',
          maxWidth: 540,
          border: '1px solid color-mix(in oklab, var(--border) 70%, transparent)',
          borderRadius: 14,
          background: 'var(--card)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
          padding: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🚛 Fleetwork SDK Demo</h1>
        <p style={{ margin: '6px 0 16px', fontSize: 13, color: 'var(--muted-foreground)' }}>
          Nhập 2 key để vào demo.
        </p>

        <label style={labelStyle}>APITOKEN (backend API)</label>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder='Nhập APITOKEN...'
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>APIKEYTILEMAP (VietMap tile)</label>
        <input
          value={apiKeyTilemap}
          onChange={(e) => setApiKeyTilemap(e.target.value)}
          placeholder='Nhập APIKEYTILEMAP...'
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>Base URL (optional)</label>
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder='https://tracking.fleetwork.vn'
          style={inputStyle}
        />

        <button
          type='submit'
          disabled={!isValid}
          style={{
            marginTop: 16,
            width: '100%',
            height: 38,
            border: '1px solid transparent',
            borderRadius: 10,
            background: isValid ? 'var(--primary)' : 'var(--muted)',
            color: isValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            fontWeight: 600,
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}
        >
          Vào demo
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--muted-foreground)',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  borderRadius: 10,
  border: '1px solid color-mix(in oklab, var(--border) 70%, transparent)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontSize: 13,
  padding: '0 12px',
  outline: 'none',
}
