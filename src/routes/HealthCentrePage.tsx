import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BedDouble, Check, Dumbbell, HeartPulse, Moon, Stethoscope, Wallet } from 'lucide-react';
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
const treatmentIcons=[BedDouble,HeartPulse,Activity,Dumbbell,Stethoscope,Moon];

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
   {tab==='Treatments'&&<div className="care-treatment-layout health-treatments">
    <section className="care-panel"><div className="care-panel-heading"><div><h2>Treatment options</h2><p>Choose one treatment. Review your exact changes before applying.</p></div><span className="care-badge">{treatments.length} options</span></div><div className="care-panel-body"><div className="health-treatment-options">{treatments.map((option,index)=>{
     const Icon=treatmentIcons[index]??HeartPulse,effect=getTreatmentEffect(option.id),selected=option.id===treatment.id;
     return <button key={option.id} type="button" aria-pressed={selected} onClick={()=>setTreatmentId(option.id)} className="health-treatment-option">
      <div className="health-treatment-option-top"><Icon aria-hidden="true"/><strong>{formatMoney(option.cost)}</strong></div>
      <h3>{option.title}</h3>
      <div className="health-treatment-benefits"><span>Fatigue <strong>−{effect.fatigue}</strong></span><span>Strain <strong>−{effect.strain}</strong></span></div>
      <span className="health-treatment-selection">{selected?<><Check aria-hidden="true"/>Selected</>:'View treatment'}</span>
     </button>;
    })}</div><p className="health-treatment-hint">Maximum reductions shown. The preview accounts for your current load, burnout and injury time.</p></div></section>
    <section className="care-panel care-panel-green health-treatment-preview"><div className="care-panel-heading"><div><span className="wellbeing-eyebrow">Selected treatment</span><h2>{treatment.title}</h2></div><HeartPulse className="h-5 w-5 text-emerald-300"/></div><div className="care-panel-body"><p>{treatment.description}</p>
     <dl className="health-treatment-costs"><div><dt>Cost now</dt><dd>{formatMoney(treatment.cost)}</dd></div><div><dt>Cash after treatment</dt><dd>{formatMoney(gameState.player.cash-treatment.cost)}</dd></div></dl>
     <h3>Immediate changes</h3><dl className="health-treatment-effects">{preview.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{number(item.before)}{item.unit} <span>→</span> <strong>{number(item.after)}{item.unit}</strong></dd></div>)}</dl>
     <p className="health-treatment-hint">{recoveryNeeded?'Effects apply immediately. Follow-up availability is shown after treatment.':'No treatment needed. All recovery loads are already zero.'}</p>
     {(duringMatch||!affordable&&recoveryNeeded||underway)&&<p role="status" className="care-feedback">{duringMatch?'Use interval recovery during your match; treatment is available afterwards.':underway?`Treatment applied. Review on ${gameState.health.treatmentReviewOn}.`:'Not enough cash for this treatment.'}</p>}
    </div><footer className="care-panel-actions"><button type="button" className="btn-primary w-full justify-center text-xs" disabled={underway||!recoveryNeeded||duringMatch||!affordable} onClick={()=>scheduleTreatment(treatment.id)}>{underway?`Review on ${gameState.health.treatmentReviewOn}`:recoveryNeeded?'Apply treatment':'No treatment needed'}</button></footer></section>
   </div>}
   {tab==='History'&&<section className="care-panel h-full"><div className="care-panel-heading"><div><h2>Injury and treatment history</h2><p>{injuryHistory.length} recorded entries · Most recent first</p></div></div><div className="care-history-scroll" tabIndex={0} aria-label="Health history scroll area"><table className="care-history-table"><thead><tr>{['Date','Issue','Severity','Treatment','Time out','Notes'].map(heading=><th key={heading}>{heading}</th>)}</tr></thead><tbody>{injuryHistory.map(row=><tr key={row.id}><td>{row.date}</td><td>{row.issue}</td><td>{row.severity}</td><td>{row.treatment}</td><td>{row.timeOut}</td><td>{row.notes}</td></tr>)}{!injuryHistory.length&&<tr><td colSpan={6}>No injuries or treatments recorded yet.</td></tr>}</tbody></table></div></section>}
  </div>
  <footer className="wellbeing-footer"><span>{underway?`Treatment review · ${gameState.health.treatmentReviewOn}`:recoveryNeeded?'Protect recovery before your next match.':'No recovery load recorded.'}</span><div><button className="btn-secondary text-xs" onClick={()=>navigate('/mental')}>Mental state</button><button className="btn-secondary text-xs" title={blocker?.reason} onClick={()=>blocker?navigate(blocker.route):continueWeek()}>{blocker?blocker.label:'Advance week'}</button></div></footer>
 </div>;
}
