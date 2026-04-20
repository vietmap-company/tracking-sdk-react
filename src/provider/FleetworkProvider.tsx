import * as React from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query'
import type { AxiosInstance } from 'axios'
import { createHttpClient, setGlobalClient } from '@/lib/http'
import { createTranslator, type TFn } from '@/lib/i18n'
import type { FleetworkConfig, Locale, ThemeConfig } from '@/lib/types'

interface FleetworkContextValue {
  apiKey: string
  baseUrl: string
  locale: Locale
  theme?: ThemeConfig
  t: TFn
  client: AxiosInstance
}

const FleetworkContext = React.createContext<FleetworkContextValue | null>(null)

export interface FleetworkProviderProps extends FleetworkConfig {
  children: React.ReactNode
  /** Inject an existing QueryClient (advanced). Defaults to an internal one. */
  queryClient?: QueryClient
}

const DEFAULT_BASE_URL = 'https://tracking.fleetwork.vn'

export function FleetworkProvider({
  apiKey,
  baseUrl,
  locale = 'vi',
  theme,
  queryClient,
  children,
}: FleetworkProviderProps) {
  const internalQC = React.useMemo(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [queryClient]
  )

  const value = React.useMemo<FleetworkContextValue>(() => {
    const config: FleetworkConfig = {
      apiKey,
      baseUrl: baseUrl ?? DEFAULT_BASE_URL,
      locale,
      theme,
    }
    const client = createHttpClient(config)
    setGlobalClient(client, config)
    return {
      apiKey,
      baseUrl: config.baseUrl!,
      locale,
      theme,
      t: createTranslator(locale),
      client,
    }
  }, [apiKey, baseUrl, locale, theme])

  const cssVars = React.useMemo<React.CSSProperties>(() => {
    const vars: Record<string, string> = {}
    if (theme?.colors?.primary) vars['--fw-primary'] = theme.colors.primary
    if (theme?.colors?.success) vars['--fw-success'] = theme.colors.success
    if (theme?.colors?.warning) vars['--fw-warning'] = theme.colors.warning
    if (theme?.colors?.danger) vars['--fw-danger'] = theme.colors.danger
    if (theme?.colors?.background)
      vars['--fw-background'] = theme.colors.background
    if (theme?.colors?.text) vars['--fw-text'] = theme.colors.text
    if (theme?.colors?.border) vars['--fw-border'] = theme.colors.border
    if (theme?.borderRadius != null)
      vars['--fw-radius'] = `${theme.borderRadius}px`
    if (theme?.fontFamily) vars['--fw-font'] = theme.fontFamily
    return vars as React.CSSProperties
  }, [theme])

  return (
    <QueryClientProvider client={internalQC}>
      <FleetworkContext.Provider value={value}>
        <div data-fleetwork-root='' className='fleetwork-root' style={cssVars}>
          {children}
        </div>
      </FleetworkContext.Provider>
    </QueryClientProvider>
  )
}

export function useFleetwork(): FleetworkContextValue {
  const ctx = React.useContext(FleetworkContext)
  if (!ctx) {
    throw new Error(
      '[Fleetwork SDK] useFleetwork must be used inside <FleetworkProvider />.'
    )
  }
  return ctx
}

/** Optional context access — returns null outside provider. Useful for controllers. */
export function useOptionalFleetwork(): FleetworkContextValue | null {
  return React.useContext(FleetworkContext)
}

/** Re-export QueryClient hook for consumers that want to invalidate SDK queries. */
export function useFleetworkQueryClient() {
  return useQueryClient()
}
