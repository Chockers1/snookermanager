import type { ReactNode } from 'react'
import clsx from 'clsx'

type SectionCardProps = {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function SectionCard({ title, subtitle, action, children, className, onClick }: SectionCardProps) {
  return (
    <section
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={clsx(
        'rounded-xl border border-scm-border bg-scm-panel/95 p-4 shadow-panel',
        onClick && 'cursor-pointer transition hover:border-scm-green/45 hover:bg-scm-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scm-green/40',
        className,
      )}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-scm-text">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-scm-textMuted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}