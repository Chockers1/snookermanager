import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameStateProvider } from './context/GameStateContext'
import './styles/globals.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameStateProvider>
      <App />
    </GameStateProvider>
  </StrictMode>,
)
