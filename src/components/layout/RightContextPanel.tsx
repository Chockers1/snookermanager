import type { ReactNode } from 'react'

type RightContextPanelProps = {
  children: ReactNode
}

export function RightContextPanel({ children }: RightContextPanelProps) {
  return <aside className="w-full shrink-0 space-y-4 xl:w-[320px]">{children}</aside>
}
