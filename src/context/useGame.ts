import { useContext } from 'react'
import { GameStateContext } from './gameStateContextValue'

export function useGame() {
  const context = useContext(GameStateContext)
  if (!context) throw new Error('useGame must be used inside GameStateProvider')
  return context
}
