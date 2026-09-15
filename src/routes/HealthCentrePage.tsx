import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, HeartPulse, Wallet } from 'lucide-react';
import { ActionBlockerNotice } from '../components/game/ActionBlockerNotice';
import { SectionTabs } from '../components/ui/SectionTabs';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useGame } from '../context/useGame';
import { advancementBlocker } from '../hooks/useGameState';
import { getTreatmentEffect, needsHealthRecovery, treatmentPreview } from '../game/healthSystem';
import { formatMoney, formatPercent } from '../utils/formatters';
import { buildHealthCentreData } from '../utils/liveRouteData';

const tabs=['Overview','Treatments','History'] as const;
const toneClass=(tone:string)=>tone==='red'?'text-red-300':tone==='amber'?'text-amber-200':'text-emerald-300';
const number=(value:number)=>Number(value.toFixed(2));

export function HealthCentrePage(){
 const {gameState,scheduleTreatment,continueWeek}=useGame();
 const navigate=useNavigate(),blocker=advancementBlocker(gameState);
 const {bodyStatus,currentIssue,treatments,matchImpact,injuryHistory}=buildHealthCentreData(gameState);
 const [tab,setTab]=useState<typeof tabs[number]>('Overview');
 const [treatmentId,setTreatmentId]=useState(treatments.find(option=>option.selected)?.id??treatments[0].id);
 const treatment=treatments.find(option=>option.id===treatmentId)??treatments[0];
 const underway=Boolean(gameState.health.treatmentReviewOn&&gameState.currentDate<gameState.health.treatmentReviewOn);
 const recoveryNeeded=needsHealthRecovery(gameState),preview=treatmentPreview(gameState,treatment.id);
 const duringMatch=gameState.liveMatch?.status==='In Progress';
 const affordable=gameState.player.cash>=treatment.cost;
 const summary=[{label:'Fatigue',value:formatPercent(gameState.player.fatigue),detail:'Physical load'}, {label:'Body strain',value:formatPercent(gameState.trainingCondition.strain),detail:'Training load'}, {label:'Burnout',value:formatPercent(gameState.trainingCondition.burnout),detail:'Accumulated load'}, {label:'Injury time',value:`${number(gameState.trainingCondition.injuryWeeks)} wk`,detail:gameState.health.activeIssue?'Active injury':'No active injury'}];
 return <div className="wellbeing-page" data-testid="health-viewport">
  <ActionBlockerNotice blocker={blocker}/>
  <header className="wellbeing-header"><div><p className="wellbeing-eyebrow">Care & recovery</p><h1>Health Centre</h1><p className="wellbeing-intro">Manage your workload, understand the impact and plan your recovery.</p></div><div className="wellbeing-header-status"><Wallet className="h-5 w-5 text-emerald-300"/><div><span>Available cash</span><strong>{formatMoney(gameState.player.cash)}</strong></div></div></header>
  <section aria-label="Health summary" className="wellbeing-metrics health-metrics">{summary.map(item=><article key={item.label}><p>{item.label}</p><div><strong>{item.value}</strong><span>{item.detail}</span></div></article>)}</section>
  <SectionTabs id="health-sections" label="Health sections" tabs={tabs} active={tab} onChange={setTab}/>
  <div role="tabpanel" id="health-sections-panel" aria-labelledby={`health-sections-tab-${tabs.indexOf(tab)}`} className="wellbeing-content">
   {tab==='Overview'&&<div className="wellbeing-overview health-overview">
    <section className="care-panel care-panel-green"><div className="care-panel-heading"><h2>Body status</h2><span className="care-badge">Risk by area · /100</span></div><div className="care-panel-body"><div className="care-body-list">{bodyStatus.map(item=><article key={item.label}><div><h3>{item.label}</h3><span className={toneClass(item.tone)}>{item.status}</span><strong>{number(item.risk)}</strong></div><ProgressBar value={item.risk} tone={item.tone} compact/></article>)}</div><p>Lower risk is better. Review fatigue and strain alongside any active injury.</p></div><footer className="care-panel-actions"><button className="btn-secondary text-xs" onClick={()=>navigate('/training')}>Adjust training</button><button className="btn-secondary text-xs" onClick={()=>setTab('History')}>View health history</button></footer></section>
    <section className="care-panel care-panel-gold"><div className="care-panel-heading"><span className="wellbeing-eyebrow">Current issue</span><span className="care-badge">{currentIssue.overallRisk} risk</span></div><div className="care-panel-body"><h2>{currentIssue.title}</h2><p>{currentIssue.cause}</p><dl className="care-issue-facts">{[['Body area',currentIssue.bodyArea],['Severity',currentIssue.severity],['Pain',currentIssue.painLevel],['Recovery time',currentIssue.recoveryTime],['Estimated return',currentIssue.estimatedReturn]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="care-indicator"><div><span>Recovery progress</span><strong>{formatPercent(currentIssue.recoveryProgress)}</strong></div><ProgressBar value={currentIssue.recoveryProgress} compact/></div><h3>Issue and match impact</h3><div className="care-impact-grid">{matchImpact.map(item=><div key={item.label}><span>{item.label}</span><strong className={item.impact==='0%'?'text-gray-200':'text-amber-200'}>{item.impact}</strong></div>)}</div><p className="care-note">{recoveryNeeded?`${formatPercent(currentIssue.riskOfPlaying)} risk of worsening if you play without recovery.`:'No active injury or recovery load. Treatment is not needed.'}</p></div><footer className="care-panel-actions"><button className="btn-primary text-xs" onClick={()=>setTab('Treatments')}>{recoveryNeeded?'Review treatment options':'View treatment options'}</button></footer></section>
   </div>}
   {tab==='Treatments'&&<div className="care-treatment-layout">
    <section className="care-panel"><div className="care-panel-heading"><div><h2>Treatment options</h2><p>Select an option to see its exact cost and immediate changes.</p></div></div><div className="care-panel-body"><div className="care-option-grid">{treatments.map(option=><button key={option.id} type="button" aria-pressed={option.id===treatment.id} onClick={()=>setTreatmentId(option.id)} className="care-option"><div><h3>{option.title}</h3>{option.id===treatment.id&&<Check className="h-4 w-4 shrink-0 text-emerald-300"/>}</div><strong className="care-option-price">{formatMoney(option.cost)}</strong><p>{option.description}</p><span>Up to −{getTreatmentEffect(option.id).fatigue} fatigue · −{getTreatmentEffect(option.id).strain} strain</span></button>)}</div></div></section>
    <section className="care-panel care-panel-green"><div className="care-panel-heading"><span className="wellbeing-eyebrow">Selected treatment</span><HeartPulse className="h-4 w-4 text-emerald-300"/></div><div className="care-panel-body"><h2>{treatment.title}</h2><p>{treatment.description}</p><div className="care-stat-pair"><div><span>Cost now</span><strong>{formatMoney(treatment.cost)}</strong></div><div><span>Cash after treatment</span><strong>{formatMoney(gameState.player.cash-treatment.cost)}</strong></div></div><h3>Immediate changes</h3><dl className="care-preview">{preview.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{number(item.before)}{item.unit} <span>→</span> <strong>{number(item.after)}{item.unit}</strong></dd></div>)}</dl><p>{recoveryNeeded?'Recovery effects apply immediately. Follow-up availability is shown after treatment.':'No treatment needed. Fatigue, strain, burnout and injury time are already zero.'}</p><p role="status" className="care-feedback">{duringMatch?'Use interval recovery during your match; treatment is available afterwards.':!affordable&&recoveryNeeded?'Not enough cash for this treatment.':gameState.lastAction}</p></div><footer className="care-panel-actions"><button type="button" className="btn-primary w-full justify-center text-xs" disabled={underway||!recoveryNeeded||duringMatch||!affordable} onClick={()=>scheduleTreatment(treatment.id)}>{underway?`Review on ${gameState.health.treatmentReviewOn}`:recoveryNeeded?'Apply treatment':'No treatment needed'}</button></footer></section>
   </div>}
   {tab==='History'&&<section className="care-panel h-full"><div className="care-panel-heading"><div><h2>Injury and treatment history</h2><p>{injuryHistory.length} recorded entries · Most recent first</p></div></div><div className="care-history-scroll" tabIndex={0} aria-label="Health history scroll area"><table className="care-history-table"><thead><tr>{['Date','Issue','Severity','Treatment','Time out','Notes'].map(heading=><th key={heading}>{heading}</th>)}</tr></thead><tbody>{injuryHistory.map(row=><tr key={row.id}><td>{row.date}</td><td>{row.issue}</td><td>{row.severity}</td><td>{row.treatment}</td><td>{row.timeOut}</td><td>{row.notes}</td></tr>)}{!injuryHistory.length&&<tr><td colSpan={6}>No injuries or treatments recorded yet.</td></tr>}</tbody></table></div></section>}
  </div>
  <footer className="wellbeing-footer"><span>{underway?`Treatment review · ${gameState.health.treatmentReviewOn}`:recoveryNeeded?'Protect recovery before your next match.':'No recovery load recorded.'}</span><div><button className="btn-secondary text-xs" onClick={()=>navigate('/mental')}>Mental state</button><button className="btn-secondary text-xs" title={blocker?.reason} onClick={()=>blocker?navigate(blocker.route):continueWeek()}>{blocker?blocker.label:'Advance week'}</button></div></footer>
 </div>;
}
