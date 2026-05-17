import type { ReactNode } from 'react'

type RightContextPanelProps = {
  children: ReactNode
}

export function RightContextPanel({ children }: RightContextPanelProps) {
  return <aside className="w-[320px] shrink-0 space-y-4">{children}</aside>
}