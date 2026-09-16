import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Users } from 'lucide-react';
import { useGame } from '../context/useGame';
import { PlayerLink } from '../components/game/PlayerLink';
import { PlayerNames } from '../components/game/PlayerNames';
import { SectionTabs } from '../components/ui/SectionTabs';
import { availableTeamMember, nextTeamMatch, teamConflict } from '../game/seasonLife/teams';
import type { TeamEvent, TeamMember, SeasonLifeState } from '../game/seasonLife/types';
import { formatMoney, formatPercent } from '../utils/formatters';
import './SupportWorkspaces.css';

const tabs=['Overview & entry','Teams','Results'] as const;
export function TeamEventsPage(){
  const {gameState:s}=useGame();
  const life=s.careerDepth?.seasonLife;
  const events=[...(life?.teams ?? [])].reverse();
  const archived=[...(life?.archivedTeams ?? [])].reverse();
  const [selection,setSelection]=useState('');
  const entries=[...events.map(e=>({key:`live:${e.id}`,name:e.name,season:e.season,detail:`${e.start} · ${e.status}`})),...archived.map(e=>({key:`archive:${e.id}`,name:e.name,season:e.season,detail:e.won?'Team trophy':'Archived result'}))];
  const active=entries.find(e=>e.key===selection) ?? entries.find(e=>events.some(t=>e.key===`live:${t.id}`&&(t.status==='accepted'||t.status==='invited'))) ?? entries[0];
  const event=events.find(e=>`live:${e.id}`===active?.key);
  const archive=archived.find(e=>`archive:${e.id}`===active?.key);
  const trophies=events.filter(e=>e.champion&&e.champion===e.teams[0]?.name).length+archived.filter(e=>e.won).length;
  return <div className="support-workspace pairs-workspace" data-testid="team-events-workspace">
    <header className="support-header"><div><p className="support-eyebrow">Shared competition</p><h1>Club & national pairs</h1><p>Optional events · team trophies and doubles results stay separate from singles rankings.</p></div><Link className="btn-secondary" to="/calendar">Back to calendar</Link></header>
    <div className="support-metrics"><div><span>Season bookings</span><strong>{events.filter(e=>e.season===s.season&&e.accepted).length}<small> / 2</small></strong></div><div><span>Open invitations</span><strong>{events.filter(e=>e.status==='invited'&&e.deadline>=s.currentDate).length}</strong></div><div><span>Team trophies</span><strong>{trophies}</strong></div></div>
    {active?<div className="support-columns pairs-columns"><aside className="support-panel pairs-event-picker"><header><h2>Select event</h2><span className="support-badge">{entries.length}</span></header><nav aria-label="Team events">{entries.map(e=><button key={e.key} type="button" aria-pressed={active.key===e.key} onClick={()=>setSelection(e.key)}><small>{e.season}</small><strong>{e.name}</strong><span>{e.detail}</span></button>)}</nav></aside>
      {event?<EventDetail key={event.id} event={event}/>:archive?<ArchivedEvent key={archive.id} event={archive}/>:null}
    </div>:<section className="support-panel support-empty"><Users size={40}/><h2>Your next partnership starts with an invitation</h2><p>No invitation yet. Invitations require a free window and a complete eligible named field. Youth and amateur club pairs or national invitations appear here when available.</p><Link className="btn-secondary" to="/calendar">Review your calendar</Link></section>}
  </div>;
}
function MemberCard({member,label}:{member:TeamMember;label?:string}){
  return <div className="pairs-member"><span className="support-avatar">{member.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span><div>{label&&<small>{label}</small>}<strong><PlayerLink name={member.name} id={member.id}/></strong><span>{member.nation}</span></div></div>;
}
function EventDetail({event:e}:{event:TeamEvent}){
  const {gameState:s,actOnCareer}=useGame();const navigate=useNavigate();
  const [tab,setTab]=useState<typeof tabs[number]>('Overview & entry');
  const [partnerId,setPartner]=useState(e.partnerOptions[0]?.id??'');
  const partner=e.status==='invited' ? e.partnerOptions.find(p=>p.id===partnerId) : e.teams[0]?.members[1];
  const own=e.teams[0]?.members[0];
  const tie=nextTeamMatch(e),date=tie===2?e.end:e.start;
  const cost=e.fee+e.travel-e.support;
  const conflict=teamConflict(s,e.start,e.end,e.id);
  const limit=(s.careerDepth?.seasonLife?.teams.filter(t=>t.season===s.season&&t.accepted).length??0)>=2;
  const acceptBlock=s.currentDate>e.deadline?'Invitation deadline has passed.':conflict??(limit?'You have already accepted two side events this season.':s.careerSystems.lateCareer.retired||s.careerSystems.lateCareer.retirementPending?'Retirement prevents a new competitive booking.':e.kind!=='nations'&&s.careerSystems.pro.hasTourCard?'Club pairs are for players without professional cards.':e.kind==='youth'&&s.player.age>=21?'Youth pairs require players under 21.':!partner||!availableTeamMember(s,partner.id,e.start,e.end,e.kind)?'This partner is no longer eligible or available.':e.teams.slice(1).some(t=>t.members.some(p=>!availableTeamMember(s,p.id,e.start,e.end,e.kind)))?'A complete eligible field is no longer available.':s.player.cash<cost?'Insufficient funds for the booking cost.':undefined);
  const relation=partner?s.careerDepth?.seasonLife?.partnerships[partner.id]:undefined;
  const live=s.liveMatch?.teamContext?.eventId===e.id&&s.liveMatch.status==='In Progress';
  return <div className="pairs-detail"><SectionTabs id="pairs-event" label="Selected team event" tabs={tabs} active={tab} onChange={setTab}/><div className="pairs-tab-body" id="pairs-event-panel" role="tabpanel" aria-labelledby={`pairs-event-tab-${tabs.indexOf(tab)}`}>
    {tab==='Overview & entry'?<div className="pairs-overview"><section className="support-panel"><header><div><p className="support-eyebrow">{e.status} · {e.start} → {e.end}</p><h2>{e.name}</h2></div><Users size={18}/></header><div className="support-panel-body"><div className="pairs-partnership">{own&&<MemberCard member={own} label="Your player"/>}{partner&&<MemberCard member={partner} label={e.kind==='nations'?'National teammate':'Club partner'}/>}</div>
      {e.status==='invited'&&e.kind!=='nations'&&<label className="support-field">Choose club partner<select value={partnerId} onChange={x=>setPartner(x.target.value)}>{e.partnerOptions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
      <p className="support-muted">{relation?`Partnership: ${relation.matches} shared matches · ${formatPercent(relation.familiarity)} familiarity · ${formatPercent(relation.trust)} trust.`:'New partnership · shared matches build familiarity and trust.'}</p>
      <p>Four teams. Each tie has two singles, then deciding doubles at 1–1. Every match is best of three frames. Your teammate’s separate singles is simulated.</p><p className="support-muted">Fictional side event · selection cutoff {e.cutoff}. Team awards do not grant singles titles or ranking credit.</p>
    </div></section><section className="support-panel pairs-entry"><header><h2>{e.status==='completed'?'Event outcome':'Booking & awards'}</h2></header><div className="support-panel-body"><dl className="support-detail-list"><div><dt>Entry / travel / host support</dt><dd>{formatMoney(e.fee)} / {formatMoney(e.travel)} / −{formatMoney(e.support)}</dd></div><div><dt>Net booking · no hotel needed</dt><dd>{formatMoney(cost)}</dd></div><div><dt>Winner / runner-up per player</dt><dd>{formatMoney(e.winnerShare)} / {formatMoney(e.runnerUpShare)}</dd></div></dl>
      {e.status==='invited'&&<><p>Reply by <b>{e.deadline}</b>. No reply declines without penalty.</p>{acceptBlock&&<p className="support-warning">{acceptBlock} {conflict&&<Link to="/calendar">Manage calendar</Link>}</p>}<div className="support-actions"><button className="btn-primary" disabled={Boolean(acceptBlock)} onClick={()=>actOnCareer({type:'life-team',id:e.id,choice:'accept',partnerId})}>Accept · {formatMoney(cost)}</button><button className="btn-secondary" disabled={s.currentDate>e.deadline} onClick={()=>actOnCareer({type:'life-team',id:e.id,choice:'decline'})}>Decline</button></div></>}
      {e.status==='accepted'&&<><p>Next team match: <b>{date}</b>. Advance through the calendar; missing both dates withdraws entry without a prize.</p><div className="support-actions">{live?<Link className="btn-primary" to="/match/live">Resume match</Link>:<button className="btn-primary" disabled={s.currentDate<date||s.currentDate>e.end||tie<0||s.liveMatch?.status==='In Progress'} onClick={()=>{actOnCareer({type:'life-play-team',id:e.id});navigate('/match/live');}}>Play {tie>=0&&e.ties[tie].results.length===2?'deciding doubles':'your singles'}</button>}<button className="btn-secondary" disabled={Boolean(live)} onClick={()=>actOnCareer({type:'life-team',id:e.id,choice:'withdraw'})}>Withdraw</button></div></>}
      {e.champion&&<div className="pairs-champion"><Trophy size={20}/><div><strong>Team champion: <PlayerNames text={e.champion}/></strong><p>Your paid share {formatMoney(e.award??0)} · equal shares per team.</p></div></div>}
      {(e.status==='declined'||e.status==='withdrawn')&&<p>{e.status==='declined'?'Invitation declined. No entry was booked.':'Entry withdrawn. Settled entry and travel costs remain; no prize is paid.'}</p>}
    </div></section></div>:tab==='Teams'?<div className="pairs-team-grid">{e.teams.map((team,index)=><section className="support-panel" key={index}><header><div><p className="support-eyebrow">{index===0?'Your team':`Team ${index+1}`}</p><h2><PlayerNames text={e.status==='invited'&&index===0?'Proposed partnership':team.name}/></h2></div>{e.champion===team.name&&<Trophy size={20}/>}</header><div className="support-panel-body">{(e.status==='invited'&&index===0&&partner?[team.members[0],partner]:team.members).map(p=><div key={p.id}><MemberCard member={p}/>{e.playerAwards?.[p.id]!==undefined&&<p className="support-muted">Award {formatMoney(e.playerAwards[p.id])}</p>}</div>)}</div></section>)}</div>:<TeamResults event={e}/>}
  </div></div>;
}
function TeamResults({event:e}:{event:TeamEvent}){
  const [tieIndex,setTie]=useState(0),[rubberIndex,setRubber]=useState(0);
  const tie=e.ties[tieIndex];const rubber=tie?.results[rubberIndex]??tie?.results[0];
  return <section className="support-panel pairs-results"><header><div><p className="support-eyebrow">Singles & deciding doubles</p><h2>Results by tie</h2></div><label className="support-field">Tie<select value={tieIndex} onChange={x=>{setTie(Number(x.target.value));setRubber(0);}}>{e.ties.map((t,i)=><option key={i} value={i}>{i===2?'Final':`Semi-final ${i+1}`} · {e.teams[t.home].name} vs {e.teams[t.away].name}</option>)}</select></label></header>
    {tie&&<><div className="pairs-tie-score"><strong><PlayerNames text={e.teams[tie.home].name}/></strong><b>{tie.results.filter(r=>r.score[0]>r.score[1]).length}–{tie.results.filter(r=>r.score[0]<r.score[1]).length}</b><strong><PlayerNames text={e.teams[tie.away].name}/></strong></div><p className="support-note">{tie.winner===undefined?'Tie not yet decided':<><PlayerNames text={e.teams[tie.winner].name}/> {tieIndex===2?'wins the event':'advances'}</>}</p>
      {rubber?<div className="support-panel-body pairs-result-body"><div className="support-actions" aria-label="Matches in this tie">{tie.results.map((r,i)=><button className="btn-secondary" aria-pressed={rubber.id===r.id} key={r.id} onClick={()=>setRubber(i)}>{i===1?'Teammate singles · simulated':r.kind==='doubles'?'Deciding doubles':'Opening singles'} · {r.score.join('–')}</button>)}</div><div className="pairs-individuals">{rubber.individuals.filter(p=>rubber.home.includes(p.id)||rubber.away.includes(p.id)).map(p=><section key={p.id}><h3><PlayerLink name={p.name} id={p.id}/></h3><dl>{[['Points',p.points],['Visits',p.visits],['Fouls',p.fouls],['Best break',p.highestBreak]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>)}</div><h3>Frame scores</h3><div className="pairs-frames">{rubber.frames.map((f,i)=><div key={i}><span>{f.frame}</span><b>{f.player}–{f.opponent}</b></div>)}</div></div>:<div className="support-empty"><p>No completed matches in this tie yet.</p></div>}
    </>}
  </section>;
}
function ArchivedEvent({event:e}:{event:NonNullable<SeasonLifeState['archivedTeams']>[number]}){
  const [tab,setTab]=useState<'Summary'|'Results'>('Summary');
  return <div className="pairs-detail"><SectionTabs id="pairs-archive" label="Archived team event" tabs={['Summary','Results']} active={tab} onChange={setTab}/><section className="support-panel pairs-tab-body" id="pairs-archive-panel" role="tabpanel" aria-labelledby={`pairs-archive-tab-${tab==='Summary'?0:1}`}><header><div><p className="support-eyebrow">{e.season} · archived event</p><h2>{e.name}</h2></div><Trophy size={20}/></header><div className="support-panel-body">{tab==='Summary'?<><h3>{e.won?'Team trophy won':'Recorded team outcome'}</h3><p>Champion: <PlayerNames text={e.champion??'Not recorded'}/></p><strong className="support-big-number">{formatMoney(e.award)}</strong><p>Your paid award share. Kept separately from singles titles and ranking earnings.</p><p className="support-muted">This older event retains a concise results summary; detailed individual match statistics are not in the archive.</p></>:e.results.length?e.results.map((r,i)=><p className="pairs-archive-result" key={i}><PlayerNames text={r}/></p>):<p>No individual results retained for this event.</p>}</div></section></div>;
}
