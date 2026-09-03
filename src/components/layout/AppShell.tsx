import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useGame } from '../../context/useGame'
import { Sidebar } from './Sidebar'
import { TopStatusBar } from './TopStatusBar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { gameState } = useGame()
  const location = useLocation()
  const immersiveRoute = location.pathname === '/match/live'
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)

  if (immersiveRoute) {
    return (
      <div className="h-screen min-w-0 overflow-auto bg-background text-white">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen min-w-0 overflow-hidden bg-background text-white">
      <a href="#main-content" className="fixed left-3 top-3 z-[70] -translate-y-20 rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white transition focus:translate-y-0">Skip to game content</a>
      {mobileNavigationOpen ? <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileNavigationOpen(false)} /> : null}
      <div onClick={() => setMobileNavigationOpen(false)} className={`fixed inset-y-0 left-0 z-50 transition-transform lg:static lg:translate-x-0 ${mobileNavigationOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button type="button" aria-label="Close navigation" className="absolute right-2 top-2 z-10 rounded p-2 text-gray-400 hover:text-white lg:hidden" onClick={() => setMobileNavigationOpen(false)}><X className="h-5 w-5" /></button>
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <button type="button" aria-label="Open navigation" className="absolute left-2 top-2 z-30 rounded-md border border-border bg-sidebar p-2 text-gray-300 lg:hidden" onClick={() => setMobileNavigationOpen(true)}><Menu className="h-5 w-5" /></button>
        <TopStatusBar player={gameState.player} />
        <main id="main-content" tabIndex={-1} className="scrollbar-thin flex-1 overflow-auto p-3 sm:p-4 lg:p-6">{children}</main>
        <div aria-live="polite" className="flex h-8 shrink-0 items-center gap-3 overflow-hidden border-t border-border bg-sidebar px-4">
          <span className="shrink-0 text-[9px] font-medium uppercase text-green-400">Update</span>
          <p className="min-w-0 flex-1 truncate text-[10px] text-gray-400">{gameState.lastAction}</p>
          <div className="hidden shrink-0 items-center gap-3 text-[10px] sm:flex">
            <span className="whitespace-nowrap text-gray-500">Season {gameState.season}</span>
            <span className="whitespace-nowrap text-gray-500">Wk {gameState.week}</span>
            <span className="whitespace-nowrap text-gray-400">{gameState.currentDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
