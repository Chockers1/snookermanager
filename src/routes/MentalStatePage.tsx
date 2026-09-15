import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Check, ChevronRight } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PlayerNames } from '../components/game/PlayerNames';
import { ActionBlockerNotice } from '../components/game/ActionBlockerNotice';
import { SectionTabs } from '../components/ui/SectionTabs';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useGame } from '../context/useGame';
import { advancementBlocker } from '../hooks/useGameState';
import { supportedConfidence } from '../game/confidenceSystem';
import { buildMentalStateData } from '../utils/liveRouteData';
import { formatPercent } from '../utils/formatters';

const tabs = ['Overview', 'Recovery plans', 'Trends'] as const;
const toneClass = (tone: string) => tone === 'red' ? 'text-red-300' : tone === 'amber' ? 'text-amber-200' : 'text-emerald-300';

export function MentalStatePage() {
 const {gameState,applyRecoveryPlan,continueWeek}=useGame();
 const navigate=useNavigate();
 const blocker=advancementBlocker(gameState);
 const data=buildMentalStateData(gameState);
 const [tab,setTab]=useState<typeof tabs[number]>('Overview');
 const [planTitle,setPlanTitle]=useState(data.actionPlan[0]?.title??'');
 const plan=data.actionPlan.find(item=>item.title===planTitle)??data.actionPlan[0];
 const underway=Boolean(gameState.recoveryPlanAvailableOn && gameState.currentDate<gameState.recoveryPlanAvailableOn);
 const duringMatch=gameState.liveMatch?.status==='In Progress';
 // The current recovery action has one shared effect, regardless of the chosen routine.
 const preview=[
  {label:'Confidence',before:gameState.player.confidence,after:supportedConfidence(gameState.player.confidence,6)},
  {label:'Morale',before:gameState.player.morale,after:Math.min(100,gameState.player.morale+4)},
  {label:'Fatigue',before:gameState.player.fatigue,after:Math.max(0,gameState.player.fatigue-10)},
 ];
 return <div className="wellbeing-page" data-testid="mental-viewport">
  <ActionBlockerNotice blocker={blocker}/>
  <header className="wellbeing-header"><div><p className="wellbeing-eyebrow">Mind & performance</p><h1>Mental State</h1><p className="wellbeing-intro">Understand your current load and build a steadier routine.</p></div><div className="wellbeing-header-status"><Brain className="h-5 w-5 text-emerald-300"/><div><span>Recovery status</span><strong>{underway?`Review ${gameState.recoveryPlanAvailableOn}`:'Ready to plan'}</strong></div></div></header>
  <section aria-label="Mental state summary" className="wellbeing-metrics mental-metrics">{data.metrics.slice(0,6).map(metric=><article key={metric.label}><p>{metric.label}</p><div><strong>{formatPercent(metric.value)}</strong><span className={toneClass(metric.tone)}>{metric.detail}</span></div><ProgressBar value={metric.value} tone={metric.tone} compact/></article>)}</section>
  <SectionTabs id="mental-sections" label="Mental sections" tabs={tabs} active={tab} onChange={setTab}/>
  <div role="tabpanel" id="mental-sections-panel" aria-labelledby={`mental-sections-tab-${tabs.indexOf(tab)}`} className="wellbeing-content">
   {tab==='Overview'&&<div className="wellbeing-overview mental-overview">
    <section className="care-panel care-panel-gold"><div className="care-panel-heading"><span className="wellbeing-eyebrow">Current assessment</span><span className="care-badge">Severity {formatPercent(data.diagnosis.severity)}</span></div><div className="care-panel-body">
     <h2>{data.diagnosis.title}</h2><p>Fatigue, confidence and workload are game estimates, not proof of a result’s cause.</p>
     <h3>What is contributing</h3><ul className="care-evidence">{data.diagnosis.factors.map(factor=><li key={factor}>{factor}</li>)}</ul>
     <div className="care-stat-pair"><div><span>Recovery outlook</span><strong>{data.diagnosis.recoveryOutlook}</strong></div><div><span>Estimated recovery chance</span><strong>{formatPercent(data.diagnosis.recoveryChance)}</strong></div></div>
    </div><footer className="care-panel-actions"><button className="btn-primary text-xs" onClick={()=>setTab('Recovery plans')}>Choose a recovery plan <ChevronRight className="h-3 w-3"/></button></footer></section>
    <section className="care-panel care-panel-green"><div className="care-panel-heading"><span className="wellbeing-eyebrow">Your next focus</span><span className="care-badge">Daily routine</span></div><div className="care-panel-body">
     <h2>{data.nextFocus.title}</h2><ul className="care-routine">{data.nextFocus.bullets.map(item=><li key={item}><Check className="h-4 w-4 shrink-0 text-emerald-300"/>{item}</li>)}</ul>
     <div className="care-note"><h3>Coach note</h3><p>{data.nextFocus.psychologistNote}</p></div>
     <div className="care-stat-pair"><div><span>Overthinking risk</span><strong>{formatPercent(data.metrics[6].value)}</strong></div><div><span>Plan availability</span><strong className="care-small-value">{underway?'Recovery underway':duringMatch?'After your match':'Available now'}</strong></div></div>
    </div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/training')}>Open training</button><button className="btn-secondary text-xs" onClick={()=>setTab('Trends')}>View trends</button></footer></section>
   </div>}
   {tab==='Recovery plans'&&<div className="care-treatment-layout">
    <section className="care-panel"><div className="care-panel-heading"><div><h2>Recovery plans</h2><p>Choose a routine that suits your next week.</p></div></div><div className="care-panel-body"><div className="care-option-grid">{data.actionPlan.map(item=><button key={item.title} type="button" aria-pressed={item.title===planTitle} onClick={()=>setPlanTitle(item.title)} className="care-option"><div><h3>{item.title}</h3>{item.title===planTitle&&<Check className="h-4 w-4 shrink-0 text-emerald-300"/>}</div><p>{item.description}</p><span>Free · review in 7 days</span></button>)}</div><p className="care-note">All four routines currently apply the same recovery support. Permanent skills improve through training; selecting a routine does not book staff or change your timetable.</p></div></section>
    <section className="care-panel care-panel-green"><div className="care-panel-heading"><span className="wellbeing-eyebrow">Selected plan</span><span className="care-badge">No charge</span></div><div className="care-panel-body"><h2>{plan?.title}</h2><p>{plan?.description}</p><h3>Immediate changes</h3><dl className="care-preview">{preview.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{formatPercent(item.before)} <span>→</span> <strong>{formatPercent(item.after)}</strong></dd></div>)}</dl><p>One recovery plan every seven days. Your current date stays the same.</p><p role="status" className="care-feedback">{duringMatch?'Use interval recovery during your match.':underway?`Recovery support applied. Review on ${gameState.recoveryPlanAvailableOn}.`:gameState.lastAction}</p></div><footer className="care-panel-actions"><button type="button" className="btn-primary w-full justify-center text-xs" disabled={underway||duringMatch} onClick={()=>applyRecoveryPlan(planTitle)}>{underway?`Review on ${gameState.recoveryPlanAvailableOn}`:'Apply selected plan'}</button></footer></section>
   </div>}
   {tab==='Trends'&&<div className="care-trends-layout">
    <section className="care-panel"><div className="care-panel-heading"><div><h2>Six-week mental trend</h2><p>Confidence · Stress · Focus</p></div></div><div className="care-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><LineChart data={data.trend}><XAxis dataKey="label" tick={{fontSize:11,fill:'#cbd5e1'}} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} width={35} tick={{fontSize:11,fill:'#cbd5e1'}} axisLine={false} tickLine={false}/><Tooltip formatter={value=>formatPercent(Number(value))} contentStyle={{background:'#141e2a',border:'1px solid #304459',borderRadius:8}}/><Line name="Confidence" dataKey="confidence" stroke="#34d399" strokeWidth={2} dot={false}/><Line name="Stress" dataKey="stress" stroke="#fbbf24" strokeDasharray="5 3" strokeWidth={2} dot={false}/><Line name="Focus" dataKey="focus" stroke="#60a5fa" strokeDasharray="2 3" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div><p className="care-chart-note">Stress and focus history are estimates derived from saved confidence and fatigue. They are not recorded shot statistics.</p></section>
    <section className="care-panel"><div className="care-panel-heading"><h2>Recent triggers</h2></div><div className="care-panel-body"><div className="care-trigger-list">{data.triggers.map(item=><article key={item.label}><span>{item.timing}</span><h3><PlayerNames text={item.label}/></h3></article>)}</div><h3>Recovery indicators</h3><p>Estimated from your current confidence; these are not completed treatment sessions.</p>{data.recoveryProgress.map(item=><div key={item.label} className="care-indicator"><div><span>{item.label}</span><strong>{formatPercent(item.value)}</strong></div><ProgressBar value={item.value} compact/></div>)}</div></section>
   </div>}
  </div>
  <footer className="wellbeing-footer"><span>Build confidence. Protect your recovery.</span><div><button className="btn-secondary text-xs" onClick={()=>navigate('/health')}>Health Centre</button><button className="btn-secondary text-xs" title={blocker?.reason} onClick={()=>blocker?navigate(blocker.route):continueWeek()}>{blocker?blocker.label:'Advance week'}</button></div></footer>
 </div>;
}
