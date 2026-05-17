import type { ReactNode } from 'react'
import { useGame } from '../../context/GameStateContext'
import { Sidebar } from './Sidebar'
import { TopStatusBar } from './TopStatusBar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { gameState } = useGame()

  return (
    <div className="flex min-h-screen min-w-[1366px] bg-transparent text-scm-text">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <TopStatusBar player={gameState.player} />
        <div className="border-b border-scm-border bg-scm-panelSoft/70 px-6 py-2 text-xs text-scm-textMuted">{gameState.lastAction}</div>
        <main className="flex-1 overflow-auto px-6 py-6">{children}</main>
      </div>
    </div>
  )
}