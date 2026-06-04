import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useGame } from '../../context/GameStateContext'
import { Sidebar } from './Sidebar'
import { TopStatusBar } from './TopStatusBar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { gameState } = useGame()
  const location = useLocation()
  const immersiveRoute = location.pathname === '/match/live'

  if (immersiveRoute) {
    return (
      <div className="h-screen min-w-[1180px] overflow-hidden bg-background text-white">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen min-w-[1366px] overflow-hidden bg-background text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopStatusBar player={gameState.player} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
        <div className="flex h-8 shrink-0 items-center gap-3 overflow-hidden border-t border-border bg-sidebar px-4">
          <span className="shrink-0 text-[9px] font-medium uppercase text-green-400">Update</span>
          <p className="min-w-0 flex-1 truncate text-[10px] text-gray-400">{gameState.lastAction}</p>
          <div className="flex shrink-0 items-center gap-3 text-[10px]">
            <span className="whitespace-nowrap text-gray-500">Season {gameState.season}</span>
            <span className="whitespace-nowrap text-gray-500">Wk {gameState.week}</span>
            <span className="whitespace-nowrap text-gray-400">{gameState.currentDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
