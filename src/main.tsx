import { prepareCareerStorage, prepareActiveCareerDecode } from './game/saveStorage'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameStateProvider } from './context/GameStateContext'
import './styles/globals.css'
import App from './App.tsx'

async function start() {
 // Preserve the branded HTML loading screen while saved careers are prepared.
 await prepareCareerStorage();
 await prepareActiveCareerDecode();
 createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameStateProvider>
      <App />
    </GameStateProvider>
  </StrictMode>,
)

}
void start().catch(error => {
 const root=document.getElementById('root')!;
 root.textContent='';
 const message=document.createElement('p');message.setAttribute('role','alert');message.textContent=error instanceof Error?error.message:'Saved careers could not be opened.';
 const retry=document.createElement('button');retry.textContent='Retry loading saves';retry.onclick=()=>location.reload();
 root.append(message,retry);
});
