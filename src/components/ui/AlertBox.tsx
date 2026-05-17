import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

type AlertBoxProps = {
  title: string
  children: ReactNode
}

export function AlertBox({ title, children }: AlertBoxProps) {
  return (
    <div className="rounded-xl border border-scm-amber/35 bg-scm-amber/10 p-4 text-scm-text">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-scm-amber" />
        <div>
          <p className="font-semibold">{title}</p>
          <div className="mt-1 text-sm text-scm-textSoft">{children}</div>
        </div>
      </div>
    </div>
  )
}