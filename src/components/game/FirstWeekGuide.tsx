import {useRef,useState} from 'react';
import {BookOpen,ChevronDown,Check} from 'lucide-react';
import {getMissingTournamentEquipment} from '../../hooks/useGameState';
import {Link} from 'react-router-dom';
import {useGame} from '../../context/useGame';
import {guideSteps,guideView,firstWeekEntryRoute,type GuideStep} from '../../game/firstWeekGuide';

export function FirstWeekGuide(){
 const {gameState,updateFirstWeekGuide}=useGame();
 const {guide,current,finished}=guideView(gameState);
 const [selected,setSelected]=useState<GuideStep|null>(null);
 const launcher=useRef<HTMLButtonElement>(null);
 const panel=useRef<HTMLElement>(null);
 const missing=getMissingTournamentEquipment(gameState.equipment);
 if(!guide||guide.dismissed)return null;
 const open=guide.minimized===false;
 const step=guideSteps.find(s=>s.id===selected)??current;
 const close=(restoreFocus=false)=>{updateFirstWeekGuide('minimize');if(restoreFocus)requestAnimationFrame(()=>launcher.current?.focus())};
 return <aside aria-label="First-week help" className="fixed bottom-12 right-2 z-30 flex max-w-[calc(100vw-1rem)] flex-col items-end gap-2 sm:right-4" onKeyDown={event=>{if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close(true)}}}>
  {open&&<section ref={panel} tabIndex={-1} id="first-week-guide-panel" aria-label="First week guide" className="flex max-h-[calc(100dvh-8rem)] w-96 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border border-green-500/40 bg-surface text-sm shadow-2xl">
   <header className="flex shrink-0 items-center gap-3 border-b border-border p-3">
    <div className="min-w-0 flex-1"><h2 className="font-semibold text-white">Your first week</h2><p className="text-xs text-gray-400">{guide.completed.length} of {guideSteps.length} completed</p></div>
    <button type="button" aria-label="Minimise first-week guide" className="grid h-9 w-9 shrink-0 place-items-center rounded text-gray-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-green-400" onClick={()=>close(true)}><ChevronDown className="h-5 w-5"/></button>
   </header>
   <div className="min-h-0 space-y-4 overflow-y-auto p-3 scrollbar-thin">
    {finished&&<p className="text-xs text-green-300">{guide.skipped.length?`Guide finished · ${guide.skipped.length} steps skipped.`:'First match complete — you are ready to manage your career.'} Select a step below to revisit its explanation.</p>}
    {step&&<div>
     <h3 className="font-semibold text-green-300">{step.title}</h3>
     <p className="mt-1 text-xs leading-relaxed text-gray-300">{step.explanation}</p>
     {step.id==='equipment'&&<p className="mt-2 text-xs text-amber-300">{missing.length?'Still needed: '+missing.join(', '):'Equipment ready — this step is completed automatically.'}</p>}
     <div className="mt-3 flex flex-wrap items-center gap-2">
      <Link className="btn-primary text-xs" onClick={()=>{setSelected(null);close()}} to={step.id==='entry'?firstWeekEntryRoute(gameState):step.id==='equipment'&&!missing.includes('cue')&&missing.length?'/equipment/chalk-tips':step.route}>{step.action}</Link>
      {!guide.completed.includes(step.id)&&!guide.skipped.includes(step.id)&&<button type="button" className="text-xs text-gray-400 underline" onClick={()=>{setSelected(null);updateFirstWeekGuide('skip',step.id)}}>Skip this explanation</button>}
     </div>
    </div>}
    <ol aria-label="Six first-week steps" className="space-y-1 border-t border-border pt-3">{guideSteps.map((item,index)=>{
     const done=guide.completed.includes(item.id),skipped=guide.skipped.includes(item.id);
     return <li key={item.id}><button type="button" aria-pressed={step?.id===item.id} onClick={()=>setSelected(item.id)} className={`flex w-full items-center gap-2 rounded p-2 text-left text-xs ${step?.id===item.id?'bg-green-600/15 text-green-300':'text-gray-300 hover:bg-white/5'}`}><span className="grid h-5 w-5 shrink-0 place-items-center rounded border border-border">{done?<Check aria-hidden="true" className="h-3 w-3"/>:index+1}</span><span className="min-w-0 flex-1">{item.title}</span><span className="shrink-0 text-[10px] text-gray-400">{done?'Completed':skipped?'Skipped':'To do'}</span></button></li>;
    })}</ol>
    <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-[10px] text-gray-500"><span>Progress saved with this career</span><button type="button" className="shrink-0 text-xs text-gray-400 underline" onClick={()=>updateFirstWeekGuide('dismiss')}>Dismiss guide</button></div>
   </div>
  </section>}
  <button ref={launcher} type="button" aria-controls="first-week-guide-panel" aria-expanded={open} aria-label={open?'Hide first-week guide':'Open first-week guide'} onClick={()=>{if(open)close();else {updateFirstWeekGuide('expand');requestAnimationFrame(()=>panel.current?.focus())}}} className="flex min-h-11 items-center gap-2 rounded-full border border-green-500/40 bg-surface px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-surface-light focus-visible:outline focus-visible:outline-green-400"><BookOpen aria-hidden="true" className="h-4 w-4 text-green-400"/><span>First week</span><span className="text-green-300">{guide.completed.length}/{guideSteps.length}</span></button>
 </aside>;
}
