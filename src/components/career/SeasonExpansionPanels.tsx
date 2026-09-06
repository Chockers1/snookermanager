import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import { getTournamentEntryAccess, getTravelPackageEstimate, getTournamentEntryCashRequirement } from '../../hooks/useGameState';
import type { Tournament } from '../../types/game';
import { entryTimeline } from '../../game/tournamentEntry';
import { boardOf } from '../../game/seasonBoard';
import { recurringCost } from '../../game/careerDepth/seasonPlanning';
import { dayNumber, depthOf, overlaps, plusDays } from '../../game/careerDepth/shared';
import { ACHIEVEMENTS } from '../../game/careerAchievements';
import { skillLabels } from '../../game/tourDevelopment';
import type { ProjectKind } from '../../game/careerDepth/types';
import { PROJECTS } from '../../game/careerDepth/developmentProjects';
import { formatMoney } from '../../utils/formatters';
const control='min-w-0 rounded border border-border bg-background p-2 text-xs text-white';
export function EntryTimelinePanel({event}:{event:Tournament}) {
  const {gameState}=useGame(), timeline=entryTimeline(gameState,event);
  return <section aria-label="Entry dates" className="rounded border border-border p-3 text-xs"><p className="font-semibold text-amber-200">{timeline.label}</p><p className="mt-1 text-gray-400">{timeline.explanation}</p></section>;
}
export function SeasonBoardPanel({year,month,onEvent}:{year:number;month:number;onEvent:(id:string)=>void}) {
  const {gameState,actOnCareer}=useGame(),board=boardOf(gameState);
  const [start,setStart]=useState(plusDays(depthOf(gameState).nextSettlementDate,7));
  const [kind,setKind]=useState<'training'|'rest'>('training'),[focus,setFocus]=useState<ProjectKind>('long-pot');
  const [tour,setTour]=useState('All tours');
  const from=`${year}-${String(month+1).padStart(2,'0')}-01`;
  const through=plusDays(month===11?`${year+1}-01-01`:`${year}-${String(month+2).padStart(2,'0')}-01`,-1);
  const events=gameState.tournaments.filter(t=>overlaps(from,through,t.startDate,t.endDate??t.startDate)).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const selected=gameState.tournaments.filter(t=>board.priorities.includes(t.id) && (t.endDate??t.startDate)>=gameState.currentDate && !['Completed','Skipped'].includes(t.status));
  const quotes=selected.map(t=>{const travel=getTravelPackageEstimate(gameState,undefined,undefined,t.id),paid=gameState.travel.bookings[t.id]?.totalCost??0;const entry=['Entered','Booked'].includes(t.status)?0:getTournamentEntryCashRequirement(gameState,t);return {min:entry+Math.max(0,travel.minCost-paid),max:entry+Math.max(0,travel.maxCost-paid)};});
  const last=selected.reduce((end,t)=>(t.endDate??t.startDate)>end?t.endDate??t.startDate:end,gameState.currentDate);
  const blockEnd=board.blocks.filter(b=>b.end>=gameState.currentDate).reduce((end,b)=>b.end>end?b.end:end,last);
  const weeks=selected.length||board.blocks.some(b=>b.end>=gameState.currentDate)?Math.max(1,Math.ceil((dayNumber(blockEnd)-dayNumber(gameState.currentDate)+1)/7)):0;
  const recurring=recurringCost(gameState)*weeks;
  const minimum=quotes.reduce((n,q)=>n+q.min,recurring),maximum=quotes.reduce((n,q)=>n+q.max,recurring);
  return <section aria-label="Season planning board" className="space-y-4">
    <div className="card card-body space-y-2"><h2 className="font-semibold text-white">Season planning board</h2><p className="text-sm text-gray-400">Star your priority events and reserve seven-day training or rest blocks. Priorities do not enter events automatically.</p>
      <div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-gray-400">Remaining planned costs</p><p className="font-semibold text-amber-200">{formatMoney(minimum)}–{formatMoney(maximum)}</p></div><div><p className="text-xs text-gray-400">Weekly commitments · {weeks} weeks</p><p className="text-white">{formatMoney(recurring)}</p></div><div><p className="text-xs text-gray-400">Cash after maximum estimate</p><p className={gameState.player.cash-maximum<0?'text-red-400':'text-green-400'}>{formatMoney(gameState.player.cash-maximum)}</p></div></div><p className="text-xs text-gray-500">All future priority events and blocks, through {blockEnd}. Includes entry, selected travel package and hotel nights through the final, plus current weekly commitments. Paid bookings are deducted; future prizes and sponsor income are excluded. Prices and travel routes can change.</p>
    </div>
    <div className="card card-body space-y-3"><h3 className="text-sm font-semibold text-white">Reserve a training or rest week</h3><div className="flex flex-wrap gap-2"><input aria-label="Block start date" className={control} type="date" min={gameState.currentDate} value={start} onChange={e=>setStart(e.target.value)}/><select aria-label="Block type" className={control} value={kind} onChange={e=>setKind(e.target.value as 'training'|'rest')}><option value="training">Training week</option><option value="rest">Rest week</option></select>{kind==='training'&&<select aria-label="Block training focus" className={control} value={focus} onChange={e=>setFocus(e.target.value as ProjectKind)}>{Object.entries(PROJECTS).map(([id,p])=><option key={id} value={id}>{p.name}</option>)}</select>}<button className="btn-primary text-xs" disabled={!start} onClick={()=>actOnCareer({type:'season-block',start,kind,focus})}>Reserve week</button></div><p className="text-xs text-gray-400">Training: one focused session, video review and rest each day. Rest: all sessions reserved for recovery. Existing weekly costs apply. Conflicting event bookings are blocked.</p><p role="status" className="text-xs text-amber-200">{gameState.lastAction}</p></div>
    <div className="card card-body space-y-3"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-white">This month</h3><select aria-label="Board tour filter" className={control} value={tour} onChange={e=>setTour(e.target.value)}><option>All tours</option>{[...new Set(gameState.tournaments.map(t=>t.tourCircuit??t.type))].sort().map(t=><option key={t}>{t}</option>)}</select></div>
      {board.blocks.filter(b=>overlaps(from,through,b.start,b.end)).map(b=><div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-sky-500/30 p-3 text-xs"><div><p className="font-semibold text-sky-200">{b.kind==='rest'?'Rest week':PROJECTS[b.focus].name+' week'}</p><p className="text-gray-400">{b.start}–{b.end}</p></div><button className="btn-secondary text-xs" disabled={b.start<gameState.currentDate} onClick={()=>actOnCareer({type:'remove-season-block',id:b.id})}>Remove block</button></div>)}
      {events.filter(t=>tour==='All tours'||(t.tourCircuit??t.type)===tour).map(t=>{const access=getTournamentEntryAccess(gameState,t),priority=board.priorities.includes(t.id);const conflict=board.blocks.some(b=>overlaps(b.start,b.end,plusDays(t.startDate,-1),t.endDate??t.startDate));return <div key={t.id} className="flex items-start gap-3 rounded border border-border p-3"><button aria-label={'Prioritise '+t.name} aria-pressed={priority} className={'shrink-0 text-xl '+(priority?'text-amber-300':'text-gray-500')} onClick={()=>actOnCareer({type:'priority-event',id:t.id})}>{priority?'★':'☆'}</button><div className="min-w-0 flex-1"><button className="text-left text-sm font-semibold text-white hover:text-green-400" onClick={()=>onEvent(t.id)}>{t.name}</button><p className="text-xs text-gray-400">{t.startDate}–{t.endDate??t.startDate} · {entryTimeline(gameState,t).label}</p><p className={'mt-1 text-xs '+(access.allowed&&!conflict?'text-gray-400':'text-amber-200')}>{conflict?'Overlaps your protected planning block.':access.reason??'Eligible to enter'} · {t.status}</p></div></div>})}
      {!events.length&&<p className="text-sm text-gray-400">No events this month. Use the month arrows to plan ahead.</p>}
    </div><Link to="/training" className="text-sm text-green-400">Open training timetable →</Link>
  </section>;
}
export function AchievementGoalsPanel() {
  const {gameState}=useGame(),awards=depthOf(gameState).achievements??[];
  return <section aria-label="Career achievement goals" className="card card-body space-y-3"><h2 className="font-semibold text-white">Career achievement goals · {awards.length}/{ACHIEVEMENTS.length}</h2><div className="grid gap-3 sm:grid-cols-2">{ACHIEVEMENTS.map(goal=>{const earned=awards.find(a=>a.id===goal.id);return <div key={goal.id} className={'rounded border p-3 '+(earned?'border-green-500/40':'border-border')}><p className="text-sm font-semibold text-white">{earned?'✓ ':''}{goal.title}</p><p className="mt-1 text-xs text-gray-400">{earned?.evidence??goal.target}</p><p className="mt-2 text-xs text-green-400">{earned?earned.date??'Recorded in existing save':'In progress'}</p></div>})}</div><p className="text-xs text-gray-500">Achievements persist across seasons. Older saves only unlock goals supported by surviving records; missing dates are not invented.</p></section>;
}
export function TourDevelopmentPanel() {
  const {gameState}=useGame();
  const players=gameState.worldPlayers.filter(p=>!p.retired&&p.playerName!==gameState.player.fullName&&p.skillDevelopment?.history.length).sort((a,b)=>Number(Boolean(depthOf(gameState).relationships[b.id]?.rivalry))-Number(Boolean(depthOf(gameState).relationships[a.id]?.rivalry))||a.playerName.localeCompare(b.playerName));
  return <details className="card"><summary className="cursor-pointer p-3 text-sm font-semibold text-white">Tour development · prospects, veterans and rivals</summary><div className="space-y-3 p-3 text-xs"><p className="text-gray-400">Monthly practice changes individual skills alongside existing seasonal development. Younger players have more room to improve; older players lose physical sharpness gradually. Scouting remains an estimate.</p><div className="max-h-80 space-y-2 overflow-y-auto">{players.map(p=><div key={p.id} className="rounded border border-border p-2"><p className="font-semibold text-white">{p.playerName} · {p.age}{depthOf(gameState).relationships[p.id]?.rivalry?' · Rival':''}</p><p className="text-gray-400">{p.skillDevelopment!.reviewedMonth} · Practice focus: {skillLabels[p.skillDevelopment!.focus]}</p><p className="text-sky-200">{p.skillDevelopment!.history.at(-1)!.text}</p></div>)}{!players.length&&<p className="text-gray-400">First development report arrives next month. Existing saves start tracking from today.</p>}</div></div></details>;
}
