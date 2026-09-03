import { createContext } from 'react'
import type { useGameState } from '../hooks/useGameState'

export const GameStateContext = createContext<ReturnType<typeof useGameState> | null>(null)
