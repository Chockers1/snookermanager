import clsx from 'clsx'

type ProgressBarProps = {
  value: number
  max?: number
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'gold'
  compact?: boolean
}

export function ProgressBar({ value, max = 100, tone = 'green', compact = false }: ProgressBarProps) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`

  return (
    <div className={clsx('w-full overflow-hidden rounded-full bg-scm-deep/90', compact ? 'h-1.5' : 'h-2.5')}>
      <div
        className={clsx('h-full rounded-full transition-all', {
          'bg-scm-green': tone === 'green',
          'bg-scm-amber': tone === 'amber',
          'bg-scm-red': tone === 'red',
          'bg-scm-blue': tone === 'blue',
          'bg-scm-gold': tone === 'gold',
        })}
        style={{ width }}
      />
    </div>
  )
}