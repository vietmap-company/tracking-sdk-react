# @vietmap/fleetwork-tracking-sdk-react

React SDK for Fleetwork GPS Tracking — drop-in Dashboard & LiveMap components, hooks, and controllers.

> Phase 1 (current): Provider, Dashboard + 5 widgets, hooks, controllers, types.
> Phase 2 (next): LiveMap.

## Install

```bash
pnpm add @vietmap/fleetwork-tracking-sdk-react
```

## Quick start

```tsx
import {
  FleetworkProvider,
  Dashboard,
} from '@vietmap/fleetwork-tracking-sdk-react'
import '@vietmap/fleetwork-tracking-sdk-react/styles.css'

export default function App() {
  return (
    <FleetworkProvider apiKey='YOUR_API_KEY' locale='vi'>
      <Dashboard />
    </FleetworkProvider>
  )
}
```

## Build

```bash
pnpm install
pnpm build
```

Outputs `dist/fleetwork-tracking-sdk-react.{js,cjs}`, `dist/index.d.ts`, `dist/styles.css`.

See [tracking-sdk-react.mdx](../tracking-sdk-react.mdx) for the full API reference.
