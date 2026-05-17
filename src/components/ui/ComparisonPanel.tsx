import type { ReactNode } from 'react'

type ComparisonPanelProps = {
  leftTitle: string
  rightTitle: string
  leftContent: ReactNode
  rightContent: ReactNode
}

export function ComparisonPanel({
  leftTitle,
  rightTitle,
  leftContent,
  rightContent,
}: ComparisonPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">{leftTitle}</p>
        <div className="mt-3">{leftContent}</div>
      </div>
      <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">{rightTitle}</p>
        <div className="mt-3">{rightContent}</div>
      </div>
    </div>
  )
}