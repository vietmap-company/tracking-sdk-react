import type { AuthErrorEvent } from './types'

type Listener = (event: AuthErrorEvent) => void

const listeners = new Set<Listener>()

export function subscribeAuthError(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitAuthError(event: AuthErrorEvent): void {
  listeners.forEach((listener) => {
    try {
      listener(event)
    } catch {
      // Listener errors must not break sibling listeners or HTTP flow.
    }
  })
}
