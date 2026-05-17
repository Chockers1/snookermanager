import clsx from 'clsx'

type StatusBadgeProps = {
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'gold' | 'slate'
  children: string
}

export function StatusBadge({ tone = 'slate', children }: StatusBadgeProps) {
  return (
    <span
      className={clsx('inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', {
        'border-scm-green/40 bg-scm-green/10 text-emerald-200': tone === 'green',
        'border-scm-amber/40 bg-scm-amber/10 text-amber-100': tone === 'amber',
        'border-scm-red/40 bg-scm-red/10 text-rose-200': tone === 'red',
        'border-scm-blue/40 bg-scm-blue/10 text-sky-200': tone === 'blue',
        'border-scm-gold/40 bg-scm-gold/10 text-amber-100': tone === 'gold',
        'border-scm-borderStrong bg-scm-panelSoft text-scm-textSoft': tone === 'slate',
      })}
    >
      {children}
    </span>
  )
}