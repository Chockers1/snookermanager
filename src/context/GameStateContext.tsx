import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { useGameState } from '../hooks/useGameState'

const GameStateContext = createContext<ReturnType<typeof useGameState> | null>(null)

type GameStateProviderProps = {
  children: ReactNode
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  const value = useGameState()

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>
}

export function useGame() {
  const context = useContext(GameStateContext)

  if (!context) {
    throw new Error('useGame must be used inside GameStateProvider')
  }

  return context
}