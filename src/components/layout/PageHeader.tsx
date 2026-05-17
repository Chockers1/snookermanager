import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-scm-border pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        {eyebrow && <p className="text-xs uppercase tracking-[0.26em] text-scm-gold">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold text-scm-text">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-scm-textMuted">{description}</p>
      </div>
      {actions}
    </header>
  )
}