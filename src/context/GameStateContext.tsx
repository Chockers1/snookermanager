import type { ReactNode } from 'react'
import { useGameState } from '../hooks/useGameState'
import { GameStateContext } from './gameStateContextValue'

type GameStateProviderProps = {
  children: ReactNode
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  const value = useGameState()

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>
}
