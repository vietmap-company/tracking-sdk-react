import * as React from 'react'
import type { AxiosInstance } from 'axios'
import { createHttpClient, setGlobalClient } from '@/lib/http'
import { createTranslator, type TFn } from '@/lib/i18n'
import { subscribeAuthError } from '@/lib/auth-events'
import type {
  AuthErrorEvent,
  FleetworkConfig,
  Locale,
  ThemeConfig,
} from '@/lib/types'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthErrorOverlay } from '@/components/AuthErrorOverlay'

interface FleetworkContextValue {
  apiKey: string;
  baseUrl: string;
  locale: Locale;
  theme?: ThemeConfig;
  memberNameKey?: string;
  t: TFn;
  client: AxiosInstance;
}

const FleetworkContext =
  React.createContext<FleetworkContextValue | null>(null);

export interface FleetworkProviderProps extends FleetworkConfig {
  children: React.ReactNode;
  /**
   * Fires whenever the SDK receives a 401 or 403 from the API.
   * Use this to redirect to login, sign the user out of your app, etc.
   * Runs in addition to the built-in overlay.
   */
  onAuthError?: (event: AuthErrorEvent) => void;
  /**
   * Disable the built-in 401/403 overlay if you want to handle auth errors
   * yourself via `onAuthError`.
   * @default false
   */
  disableAuthErrorOverlay?: boolean;
  /**
   * Render a custom overlay instead of the built-in one. Receives the
   * triggering event and a `dismiss()` callback.
   */
  renderAuthError?: (
    event: AuthErrorEvent,
    dismiss: () => void,
  ) => React.ReactNode;
}

const DEFAULT_BASE_URL = 'https://live.fleetwork.vn/api/v1';

export function FleetworkProvider({
  apiKey,
  baseUrl,
  locale = "vi",
  theme,
  memberNameKey,
  children,
  onAuthError,
  disableAuthErrorOverlay = false,
  renderAuthError,
}: FleetworkProviderProps) {
  const value = React.useMemo<FleetworkContextValue>(() => {
    const config: FleetworkConfig = {
      apiKey,
      baseUrl: baseUrl ?? DEFAULT_BASE_URL,
      locale,
      theme,
      memberNameKey,
    };
    const client = createHttpClient(config);
    setGlobalClient(client, config);
    return {
      apiKey,
      baseUrl: config.baseUrl!,
      locale,
      theme,
      memberNameKey,
      t: createTranslator(locale),
      client,
    };
  }, [apiKey, baseUrl, locale, theme, memberNameKey]);

  const [authError, setAuthError] = React.useState<AuthErrorEvent | null>(null);

  // Keep the latest callback in a ref so `subscribe` doesn't re-bind on every
  // render of the parent.
  const onAuthErrorRef = React.useRef(onAuthError);
  React.useEffect(() => {
    onAuthErrorRef.current = onAuthError;
  }, [onAuthError]);

  React.useEffect(() => {
    let lastShownAt = 0;
    const unsubscribe = subscribeAuthError((event) => {
      onAuthErrorRef.current?.(event);
      // Debounce: if the consumer leaves the overlay open and many requests
      // fail in a row, only update the visible event at most every 800ms.
      const now = Date.now();
      if (now - lastShownAt < 800) return;
      lastShownAt = now;
      setAuthError(event);
    });
    return unsubscribe;
  }, []);

  const dismissAuthError = React.useCallback(() => {
    setAuthError(null);
  }, []);

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
        {authError && !disableAuthErrorOverlay
          ? renderAuthError
            ? renderAuthError(authError, dismissAuthError)
            : (
              <AuthErrorOverlay
                event={authError}
                locale={locale}
                onDismiss={dismissAuthError}
              />
            )
          : null}
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
