import * as React from 'react'
import type { AxiosInstance } from 'axios'
import { createHttpClient, setGlobalClient } from '@/lib/http'
import { createTranslator, type TFn } from '@/lib/i18n'
import type { FleetworkConfig, Locale, ThemeConfig } from '@/lib/types'
import { TooltipProvider } from '@/components/ui/tooltip'

interface FleetworkContextValue {
  apiKey: string;
  baseUrl: string;
  locale: Locale;
  theme?: ThemeConfig;
  t: TFn;
  client: AxiosInstance;
}

const FleetworkContext =
  React.createContext<FleetworkContextValue | null>(null);

export interface FleetworkProviderProps extends FleetworkConfig {
  children: React.ReactNode;
}

const DEFAULT_BASE_URL = "https://dricon.fastmap.vn";

export function FleetworkProvider({
  apiKey,
  baseUrl,
  locale = "vi",
  theme,
  children,
}: FleetworkProviderProps) {
  const value = React.useMemo<FleetworkContextValue>(() => {
    const config: FleetworkConfig = {
      apiKey,
      baseUrl: baseUrl ?? DEFAULT_BASE_URL,
      locale,
      theme,
    };
    const client = createHttpClient(config);
    setGlobalClient(client, config);
    return {
      apiKey,
      baseUrl: config.baseUrl!,
      locale,
      theme,
      t: createTranslator(locale),
      client,
    };
  }, [apiKey, baseUrl, locale, theme]);

  const cssVars = React.useMemo<React.CSSProperties>(() => {
    const vars: Record<string, string> = {};
    if (theme?.colors?.primary) vars["--primary"] = theme.colors.primary;
    if (theme?.colors?.destructive)
      vars["--destructive"] = theme.colors.destructive;
    if (theme?.colors?.background)
      vars["--background"] = theme.colors.background;
    if (theme?.colors?.text) vars["--foreground"] = theme.colors.text;
    if (theme?.colors?.border) vars["--border"] = theme.colors.border;
    if (theme?.colors?.statusMoving)
      vars["--status-moving"] = theme.colors.statusMoving;
    if (theme?.colors?.statusStopped)
      vars["--status-stopped"] = theme.colors.statusStopped;
    if (theme?.colors?.statusSignalLost)
      vars["--status-signal-lost"] = theme.colors.statusSignalLost;
    if (theme?.borderRadius != null)
      vars["--radius"] = `${theme.borderRadius}px`;
    if (theme?.fontFamily) vars["--dc-font"] = theme.fontFamily;
    return vars as React.CSSProperties;
  }, [theme]);

  return (
    <FleetworkContext.Provider value={value}>
      <TooltipProvider delayDuration={300}>
        <div data-fleetwork-root='' className='fleetwork-root' style={cssVars}>
          {children}
        </div>
      </TooltipProvider>
    </FleetworkContext.Provider>
  )
}

export function useFleetwork(): FleetworkContextValue {
  const ctx = React.useContext(FleetworkContext);
  if (!ctx)
    throw new Error(
      "[Fleetwork SDK] useFleetwork must be inside <FleetworkProvider />.",
    );
  return ctx;
}

export function useOptionalFleetwork(): FleetworkContextValue | null {
  return React.useContext(FleetworkContext);
}
