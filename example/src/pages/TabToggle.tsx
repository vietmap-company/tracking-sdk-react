interface Tab<T extends string> {
  key: T
  label: string
}

interface TabToggleProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (key: T) => void
}

export function TabToggle<T extends string>({ tabs, active, onChange }: TabToggleProps<T>) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={[
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            active === tab.key
              ? 'bg-card text-foreground shadow-whisper'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
