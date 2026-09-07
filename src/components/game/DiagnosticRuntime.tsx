import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {useGame} from '../../context/useGame';
import {recordDiagnosticAction,recordDiagnosticError} from '../../game/bugReport';
export function DiagnosticRuntime(){const {gameState,careerSessionMode}=useGame();const location=useLocation();useEffect(()=>{if(careerSessionMode==='active')recordDiagnosticAction(gameState,location.pathname)},[gameState,careerSessionMode,location.pathname]);useEffect(()=>{const onError=(e:ErrorEvent)=>recordDiagnosticError(e.error??e.message);const onRejection=(e:PromiseRejectionEvent)=>recordDiagnosticError(e.reason);window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onRejection);return()=>{window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onRejection)}},[]);return null}
