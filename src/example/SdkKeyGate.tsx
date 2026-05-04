import { useState } from 'react'
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Boxes } from 'lucide-react'

interface SdkKeyGateProps {
  apiKey: string
  baseUrl: string
  children: (cfg: { apiKey: string; baseUrl: string }) => ReactNode
}

export function SdkKeyGate({ apiKey: defaultApiKey, baseUrl: defaultBaseUrl, children }: SdkKeyGateProps) {
  const [submitted, setSubmitted] = useState(false)
  const [apiKey, setApiKey] = useState(defaultApiKey)
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl)

  // Auto-submit if env vars are already set
  if (submitted || (defaultApiKey && defaultApiKey !== 'demo-key')) {
    return <>{children({ apiKey, baseUrl })}</>
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/60 shadow-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Boxes className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">Fleetwork SDK</CardTitle>
          <CardDescription>Configure your API connection to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="your-api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="http://localhost:3001"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Run <code className="bg-muted px-1 rounded text-xs font-mono">node mock-server/server.mjs</code> locally
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={!apiKey || !baseUrl}>
              Connect
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
