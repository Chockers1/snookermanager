import type { ReactNode } from 'react'
import clsx from 'clsx'

type MetricCardProps = {
  label: string
  value: string | number
  subValue?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  tone?: 'green' | 'gold' | 'amber' | 'red' | 'blue'
}

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, string> = {
  green: 'border-scm-green/25 bg-scm-green/10 text-emerald-200',
  gold: 'border-scm-gold/25 bg-scm-gold/10 text-amber-100',
  amber: 'border-scm-amber/25 bg-scm-amber/10 text-amber-100',
  red: 'border-scm-red/25 bg-scm-red/10 text-rose-100',
  blue: 'border-scm-blue/25 bg-scm-blue/10 text-sky-100',
}

export function MetricCard({ label, value, subValue, icon, tone = 'green' }: MetricCardProps) {
  return (
    <div className={clsx('rounded-xl border p-4', toneClasses[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-scm-textMuted">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-scm-text">{value}</p>
          {subValue && <p className="mt-1 text-sm text-scm-textSoft">{subValue}</p>}
        </div>
        {icon && <div className="rounded-lg bg-scm-deep/40 p-2 text-scm-text">{icon}</div>}
      </div>
    </div>
  )
}