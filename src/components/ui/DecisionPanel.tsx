import type { ReactNode } from 'react'

type DecisionPanelProps = {
  title: string
  summary: string
  children: ReactNode
}

export function DecisionPanel({ title, summary, children }: DecisionPanelProps) {
  return (
    <div className="rounded-xl border border-scm-borderStrong bg-scm-panelSoft p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-scm-text">{title}</p>
      <p className="mt-2 text-sm text-scm-textMuted">{summary}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}