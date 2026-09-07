import {useEffect,useSyncExternalStore} from 'react';
import {useNavigate} from 'react-router-dom';
import {defaultAccessibility,readAccessibility,subscribeAccessibility,shortcutRoute} from '../../game/accessibility';
export function AccessibilityRuntime(){
 const prefs=useSyncExternalStore(subscribeAccessibility,readAccessibility,()=>defaultAccessibility);const navigate=useNavigate();
 useEffect(()=>{const root=document.documentElement;root.dataset.textScale=String(prefs.textScale);root.style.setProperty('--text-scale',String(prefs.textScale/100));root.dataset.highContrast=String(prefs.highContrast);root.dataset.reducedMotion=String(prefs.reducedMotion)},[prefs]);
 useEffect(()=>{if(!prefs.shortcuts)return;const listener=(event:KeyboardEvent)=>{const target=event.target;const editing=target instanceof Element&&Boolean(target.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'));const route=shortcutRoute(event,editing,Boolean(document.querySelector('dialog[open],[role="dialog"][aria-modal="true"]')));if(route!==undefined){event.preventDefault();navigate(route)}};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[prefs.shortcuts,navigate]);return null;
}
