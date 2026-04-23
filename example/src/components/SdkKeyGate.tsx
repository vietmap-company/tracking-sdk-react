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
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? 'http://localhost:3001')

  const isValid = useMemo(
    () => apiKey.trim().length > 0 && apiKeyTilemap.trim().length > 0,
    [apiKey, apiKeyTilemap],
  )

  return (
    <div className='grid min-h-screen place-items-center bg-background p-4'>
      <div className='w-full max-w-md'>
        {/* Brand header */}
        <div className='mb-8 flex flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-[15px] font-black text-primary-foreground shadow-sm'>
            FW
          </div>
          <div>
            <h1 className='text-xl font-bold tracking-tight text-foreground'>Fleetwork SDK</h1>
            <p className='mt-1 text-sm text-muted-foreground'>Nhập API keys để bắt đầu demo</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!isValid) return
            onSubmit({
              apiKey: apiKey.trim(),
              apiKeyTilemap: apiKeyTilemap.trim(),
              baseUrl: baseUrl.trim() || 'http://localhost:3001',
            })
          }}
          className='rounded-2xl border border-border bg-card p-6 shadow-sm'
        >
          <div className='space-y-4'>
            <Field
              label='APITOKEN'
              hint='Backend API token'
              value={apiKey}
              onChange={setApiKey}
              placeholder='Nhập APITOKEN...'
            />
            <Field
              label='APIKEYTILEMAP'
              hint='VietMap tile key'
              value={apiKeyTilemap}
              onChange={setApiKeyTilemap}
              placeholder='Nhập APIKEYTILEMAP...'
            />
            <Field
              label='Base URL'
              hint='Tuỳ chọn'
              value={baseUrl}
              onChange={setBaseUrl}
              placeholder='http://localhost:3001'
            />
          </div>

          <button
            type='submit'
            disabled={!isValid}
            className='mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed'
            style={{
              background: isValid ? 'var(--primary)' : 'var(--muted)',
              color: isValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            }}
          >
            Vào demo
          </button>
        </form>

        <p className='mt-4 text-center text-xs text-muted-foreground'>
          Tạo file <code className='rounded bg-muted px-1 py-0.5'>.env.local</code> để tự động điền key
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <div className='mb-1.5 flex items-baseline justify-between'>
        <label className='text-xs font-medium text-foreground'>{label}</label>
        <span className='text-[11px] text-muted-foreground'>{hint}</span>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20'
      />
    </div>
  )
}
