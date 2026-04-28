export const STATUS_BG: Record<string, string> = {
  moving: 'bg-status-moving',
  stopped: 'bg-status-stopped',
  signal_lost: 'bg-status-signal-lost',
  lostGps: 'bg-status-signal-lost',
}

export const STATUS_HEX: Record<string, string> = {
  moving: 'var(--status-moving)',
  stopped: 'var(--status-stopped)',
  signal_lost: 'var(--status-signal-lost)',
  lostGps: 'var(--status-signal-lost)',
}
