import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { SectionTabs } from '../components/ui/SectionTabs';
import { PlayerNames } from '../components/game/PlayerNames';
import { useGame } from '../context/useGame';
import { staffUnavailable } from '../game/seasonLife/staff';
import { getCoachAvailability, getCoachProjectedImpact, getCoachContractOptions, getCoachSlotLimit, getCoachAffordabilityForecast } from '../utils/coachMarket';
import { formatMoney, formatPercent } from '../utils/formatters';
import './SupportWorkspaces.css';

const profileTabs = ['Specialism', 'Strengths & weaknesses'] as const;
export function CoachProfilePage() {
  const { id } = useParams();
  return <CoachProfileContent key={id} id={id}/>;
}
function CoachProfileContent({id}:{id?:string}) {
  const { gameState:s, hireCoach } = useGame();
  const coach = s.coaches.find(c=>c.id===id);
  const [label,setLabel]=useState('8 Week Trial');
  const [tab,setTab]=useState<typeof profileTabs[number]>('Specialism');
  if(!coach) return <div className="support-workspace"><header className="support-header"><div><h1>Coach not found</h1><p>This coach is not in the current career.</p></div><Link className="btn-secondary" to="/staff/coaches">Back to Staff</Link></header></div>;
  const ranking=s.rankings.find(r=>r.playerName===s.player.fullName)?.ranking ?? s.player.amateurRanking ?? s.player.worldRanking ?? 999;
  const availability=getCoachAvailability(coach,ranking,s.player.reputation);
  const elsewhere=staffUnavailable(s,coach.id);
  const options=getCoachContractOptions(coach), option=options.find(o=>o.label===label) ?? options[0];
  const contract=s.coachContracts.find(c=>c.coachId===coach.id);
  const slots=(['Lead Coach','Specialist Coach'] as const).slice(0,getCoachSlotLimit(ranking,s.player.reputation));
  const slot=slots.find(slot=>!s.coachContracts.some(c=>c.slot===slot));
  const spend=s.coachContracts.reduce((sum,c)=>sum+c.weeklyCost,0);
  const forecast=getCoachAffordabilityForecast(s.player.cash,s.finance.cashFlow,spend,option);
  const blocked=contract ? 'Already in your team' : elsewhere ?? (!availability.available ? availability.reason : !slot ? 'All unlocked coaching slots are filled.' : !forecast.affordable ? 'Insufficient cash cover for this contract.' : undefined);
  const impact=getCoachProjectedImpact(coach);
  const overall=Math.round((coach.technical+coach.tactical+coach.mental+coach.motivation)/4);
  const ratings=[['Overall',overall],['Technical',coach.technical],['Tactical',coach.tactical],['Mental',coach.mental],['Motivation',coach.motivation],['Discipline',coach.discipline]] as const;
  return <div className="support-workspace" data-testid="coach-profile-workspace">
    <header className="support-header"><div className="coach-identity"><span className="support-avatar">{coach.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span><div><p className="support-eyebrow">Coach profile · {coach.level}</p><h1>{coach.name}</h1><p>{coach.type} · {coach.specialism}</p></div></div><Link className="btn-secondary" to="/staff/coaches">Back to Staff <ArrowUpRight size={15}/></Link></header>
    <div className="support-columns coach-profile-columns">
      <div className="support-stack"><section className="support-panel coach-ratings"><header><h2>Coach ratings</h2><div className="coach-meta"><span>Player fit <b>{formatPercent(coach.compatibility)}</b></span><span>Base salary <b>{formatMoney(coach.weeklyCost)}/wk</b></span></div></header><dl className="coach-ratings-grid">{ratings.map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></section>
      <section className="support-panel coach-profile-info"><SectionTabs id="coach-profile" label="Coaching profile" tabs={profileTabs} active={tab} onChange={setTab}/><div className="support-panel-body" id="coach-profile-panel" role="tabpanel" aria-labelledby={`coach-profile-tab-${profileTabs.indexOf(tab)}`}>
        {tab==='Specialism'?<><p className="support-eyebrow">Relevant training gains</p><strong className="support-big-number">+{formatPercent(impact.trainingBonus*100)}</strong><div className="support-chips">{impact.skills.map(skill=><span key={skill}>{skill}</span>)}</div><p className="support-muted">Applies to scheduled practice in either staff slot. Overlapping bonuses add up to 30%; this is not a fixed weekly attribute increase.</p></>:<div className="coach-pros-cons"><section><h3>Strengths</h3><ul>{coach.strengths.map(x=><li key={x}>{x}</li>)}</ul></section><section><h3>Weaknesses</h3><ul>{coach.weaknesses.map(x=><li key={x}>{x}</li>)}</ul></section></div>}
      </div></section></div>
      <section className="support-panel coach-contract"><header><div><p className="support-eyebrow">{contract ? contract.slot : slot ?? 'No open slot'}</p><h2>{contract?'Current contract':'Contract Options'}</h2></div><span className="support-badge">{contract?'Hired':elsewhere?'Unavailable':availability.available?forecast.status:'Stage locked'}</span></header>
      {contract ? <div className="support-panel-body"><dl className="support-detail-list"><div><dt>Contract</dt><dd>{contract.contractLabel}</dd></div><div><dt>Time remaining</dt><dd>{contract.weeksRemaining} weeks</dd></div><div><dt>Weekly cost</dt><dd>{formatMoney(contract.weeklyCost)}</dd></div>{contract.endsOn&&<div><dt>Ends</dt><dd>{contract.endsOn}</dd></div>}</dl><p>Renewals, agreed goals and termination terms are available in My team.</p><Link className="btn-primary" to="/staff/coaches?tab=team">Manage contract</Link></div>:<>
        <div className="coach-contract-grid">{options.map(o=><button key={o.label} type="button" aria-pressed={o.label===option.label} onClick={()=>setLabel(o.label)}><strong>{o.label}</strong><b>{formatMoney(o.weeklyCost)}<small>/week</small></b><span>{formatMoney(o.totalCost)} total commitment</span></button>)}</div>
        <div className="coach-contract-forecast"><p className="support-eyebrow">After signing</p><dl className="support-detail-list"><div><dt>Staff spend</dt><dd>{formatMoney(forecast.projectedStaffSpend)}/wk</dd></div><div><dt>Weekly cash flow</dt><dd>{formatMoney(forecast.projectedWeeklyCashFlow)}</dd></div></dl><p className="support-muted">Paid weekly. Early termination requires paying the remaining contracted salary.</p></div>
        <footer className="support-panel-body coach-contract-actions">{blocked&&<p className="support-warning"><PlayerNames text={blocked}/></p>}<button type="button" className="btn-primary" disabled={Boolean(blocked)} onClick={()=>{if(!blocked&&slot)hireCoach(coach.id,option.label,slot);}}>Hire Coach</button><p className="support-muted">{slot ? `Appointment: ${slot}` : 'Manage your existing team to free a slot.'}</p></footer>
      </>}
      </section>
    </div>
  </div>;
}
