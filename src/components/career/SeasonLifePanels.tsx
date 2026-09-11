import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import { CareerDisclosure } from './CareerDepthPanels';
import { staffUnavailable } from '../../game/seasonLife/staff';
import { teamConflict, nextTeamMatch } from '../../game/seasonLife/teams';
import type { TeamEvent } from '../../game/seasonLife/types';
const button='btn-secondary min-h-10 whitespace-normal px-3 py-2 text-xs';
export function FormRecoveryPanel() {
 const { gameState: s, actOnCareer } = useGame();
 const life = s.careerDepth?.seasonLife, form = life?.form;
 const evidence = life?.evidence ?? [];
 const routes = { training: 'Targeted training', coach: 'Coach-supported recovery', protect: 'Tactical protection', patience: 'Patience' };
 return <CareerDisclosure summary={form ? `Form assessment · ${form.kind === 'long-pot' ? 'Long openings' : 'Closing frames'} · ${form.progress.toFixed(0)}% recovery` : 'Form assessment · simulation evidence'} title="Form evidence and recovery">
  <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain border-t border-border p-4 text-sm leading-relaxed text-gray-200 sm:p-5">
   <section aria-label="Form assessment" className="space-y-2 rounded-lg border border-border bg-background/50 p-4">
    <h3 className="font-semibold text-white">{form ? 'Current form concern' : evidence.length ? 'Building your performance baseline' : 'No match evidence recorded yet'}</h3>
    <p>{form?.evidence ?? `${evidence.length} matches with recorded simulation evidence. Diagnosis needs an earlier baseline and at least three consistently weaker matches. Isolated bad luck causes no penalty.`}</p>
    {form && <p className="text-gray-300">At assessment: fatigue {form.fatigue.toFixed(2)}%, confidence {form.confidence.toFixed(2)}%. These can contribute; they do not prove causation.</p>}
   </section>
   {form && <section aria-label="Form recovery choices" className="space-y-3">
    <h3 className="font-semibold text-white">Recovery · {form.progress.toFixed(0)}%</h3>
    <p>Current approach: {routes[form.route]}. Ends by {form.ends}.</p>
    <p>Temporary effects are limited to three effective skill points in relevant situations. Permanent attributes remain unchanged.</p>
    <div className="grid gap-2 sm:grid-cols-2">{(['training', 'coach', 'protect', 'patience'] as const).map(route => <button className={button} key={route} aria-pressed={form.route === route} disabled={route === 'coach' && !s.coachContracts.length} onClick={() => actOnCareer({ type: 'life-recovery', route })}>{routes[route]}</button>)}</div>
    <ul className="list-disc space-y-2 pl-5 text-gray-300">
     <li>Training: three relevant sessions per free week. Coach support: two, with an employed coach.</li>
     <li>Tactical protection: three safety/preparation sessions and a safety-first match approach, sacrificing attacking openings.</li>
     <li>Benefits do not stack. Suitable work aims for about three weeks; patience allows recovery within six weeks.</li>
    </ul>
    <p className="text-gray-300">Without a coach, training, protection and patience remain available. A cue-action rebuild keeps its existing adjustment cost, with no duplicate form penalty.</p>
    <Link className="inline-block text-green-400 underline underline-offset-4" to="/training">Open training and existing technique projects</Link>
   </section>}
   <section aria-label="Recorded form evidence" className="space-y-3">
    <h3 className="font-semibold text-white">Recent match evidence</h3>
    {evidence.length ? <>
     <p className="text-gray-300">Latest {Math.min(6, evidence.length)} recorded matches. Openings show successful long openings out of attempts; leads show strong late-frame leads lost out of those established.</p>
     <div className="space-y-2">{evidence.slice(-6).map(record => <dl key={record.id} className="grid gap-3 rounded-lg border border-border bg-background/50 p-3 sm:grid-cols-3">
      <div><dt className="text-gray-400">Match date</dt><dd className="mt-1 font-semibold tabular-nums text-white">{record.date}</dd></div>
      <div><dt className="text-gray-400">Long openings made</dt><dd className="mt-1 font-semibold tabular-nums text-white">{record.openingsMade} of {record.openings}</dd></div>
      <div><dt className="text-gray-400">Strong leads lost</dt><dd className="mt-1 font-semibold tabular-nums text-white">{record.leadsLost} of {record.strongLeads}</dd></div>
     </dl>)}</div>
    </> : <p className="rounded-lg border border-dashed border-border p-4 text-gray-300">Play matches in Match Centre to build an evidence record. Auto Play and Sim Match both record visits.</p>}
    <p className="border-t border-border pt-3 text-gray-300">These are modelled Match Centre visits. Aggregate Quick Sim results without visit evidence are excluded. With an active form issue, Quick Sim also uses the visit engine.</p>
   </section>
  </div>
 </CareerDisclosure>;
}
export function StaffMovementPanel(){
 const {gameState:s,actOnCareer}=useGame(),l=s.careerDepth?.seasonLife;
 return <CareerDisclosure summary="Staff ambitions, renewals & junior development" title="Staff commitments and movement"><div className="space-y-4 text-sm">
 <p>Existing contracts stay binding. Renewals require your choice; ignoring a notice spends no money. Juniors use the same unlocked staff slots as senior coaches.</p>
 {Object.entries(l?.staff??{}).filter(([id,r])=>r.notice||r.employer||s.coachContracts.some(c=>c.coachId===id)).map(([id,r])=><section key={id} className="rounded border border-border p-3 space-y-2"><h3 className="font-semibold">{s.coaches.find(c=>c.id===id)?.name} · {r.ambition}</h3><p>{staffUnavailable(s,id)??`Current contract ends ${r.end??'when signed terms end'}.`}</p>{id.startsWith('junior-coach-')&&<p>Coaching experience {r.experience}. Gains from completed relevant training; an employed senior mentor accelerates development.</p>}
 {r.notice&&<><p>{r.notice.reason}</p><p>Decision by {r.notice.deadline}. Default: contract expires; no automatic spending. {r.notice.destination&&`Outside interest: ${s.worldPlayers.find(p=>p.id===r.notice!.destination)?.playerName}.`}</p><p>Extension: 13 weeks × £{r.notice.quotedWeekly} = £{r.notice.quotedWeekly*13}, paid weekly. Current terms are honoured.</p><div className="flex flex-wrap gap-2">{(['extend','facilities','workload','decline'] as const).map(choice=><button className={button} key={choice} disabled={Boolean(r.notice?.choice&&!(choice==='extend'&&r.notice.choice==='promise'))||s.currentDate>=r.notice!.deadline||!s.coachContracts.some(c=>c.coachId===id)} onClick={()=>actOnCareer({type:'life-staff',id,choice})}>{({extend:'Sign extension',facilities:'Promise academy in 28 days',workload:'Promise reduced strain in 28 days',decline:'Decline renewal request'})[choice]}</button>)}</div></>}
 {id.startsWith('junior-coach-')&&r.experience>=12&&!r.juniorResponsibility&&<div className="flex flex-wrap gap-2"><p>Responsibility review by {l?.stories.find(x=>x.id==='junior:'+id)?.deadline}. Default: retain supported role.</p>{(['supported','specialist'] as const).map(choice=><button key={choice} className={button} onClick={()=>actOnCareer({type:'life-junior-review',id,choice})}>{choice==='supported'?'Retain supported role':'Lead own specialism'}</button>)}</div>}
 {r.promise&&<p>Promise: {r.promise.kind} by {r.promise.due} · {r.promise.met===undefined?'Awaiting review':r.promise.met?'Fulfilled':'Missed; existing terms honoured'}. Arrange changes through Training.</p>}{r.history.slice(-3).map((h,i)=><p key={i} className="text-gray-400">{h.date} · {h.text}</p>)}</section>)}
 <p>Replacement shortlist: {s.coaches.filter(c=>!s.coachContracts.some(x=>x.coachId===c.id)&&!staffUnavailable(s,c.id)).sort((a,b)=>a.weeklyCost-b.weeklyCost).slice(0,3).map(c=>`${c.name} (£${c.weeklyCost}/week)`).join(' · ')}. Normal eligibility and slot limits apply.</p><Link to="/training" className="text-green-400">Continue training independently</Link></div></CareerDisclosure>;
}
function TeamEventCard({event:e}:{event:TeamEvent}){
 const {gameState:s,actOnCareer}=useGame(),navigate=useNavigate(),[partner,setPartner]=useState(e.partnerOptions[0]?.id??'');
 const tie=nextTeamMatch(e),date=tie===2?e.end:e.start,conflict=teamConflict(s,e.start,e.end,e.id);
 return <section className="rounded-lg border border-border p-4 space-y-3"><h2 className="text-lg font-bold">{e.name} · {e.status}</h2><p>Fictional side event · {e.start}–{e.end} · selection cutoff {e.cutoff}. Two singles plus doubles at 1–1; each best of three. Team trophies only, no singles title or ranking credit.</p>
 <p>Entry £{e.fee} · travel £{e.travel} · host support £{e.support} · no hotel required. Net booking £{e.fee+e.travel-e.support}. Awards per player: winner £{e.winnerShare}, runner-up £{e.runnerUpShare}. Two equal shares per team.</p>
 {e.status==='invited'&&<><p>Reply by {e.deadline}. Default: decline without penalty.</p><label className="block">{e.kind==='nations'?'Selected national teammate':'Choose club partner'} <select className="rounded border border-border bg-surface p-2" disabled={e.kind==='nations'} value={partner} onChange={x=>setPartner(x.target.value)}>{e.partnerOptions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="flex flex-wrap gap-2"><button className={button} disabled={!!conflict} onClick={()=>actOnCareer({type:'life-team',id:e.id,choice:'accept',partnerId:partner})}>Accept · £{e.fee+e.travel-e.support}</button><button className={button} onClick={()=>actOnCareer({type:'life-team',id:e.id,choice:'decline'})}>Decline</button></div>{conflict&&<p>{conflict} <Link to="/calendar">Manage calendar</Link></p>}</>}
 {e.status==='accepted'&&<div className="space-y-2"><p>Next team match: {date}. Advance normally through the calendar. Missing both event dates withdraws entry; no prize is paid.</p><div className="flex flex-wrap gap-2">{s.liveMatch?.teamContext?.eventId===e.id&&s.liveMatch.status==='In Progress'&&<Link className={button} to="/match/live">Resume match</Link>}<button className={button} disabled={s.currentDate<date||s.currentDate>e.end||tie<0||s.liveMatch?.status==='In Progress'} onClick={()=>{actOnCareer({type:'life-play-team',id:e.id});navigate('/match/live');}}>Play {tie>=0&&e.ties[tie].results.length===2?'deciding doubles':'your singles'}</button><button className={button} disabled={s.liveMatch?.teamContext?.eventId===e.id} onClick={()=>actOnCareer({type:'life-team',id:e.id,choice:'withdraw'})}>Withdraw</button><Link className={button} to="/calendar">Calendar</Link></div></div>}
 {e.ties.map((t,i)=><details key={i}><summary className="cursor-pointer py-2">{i===2?'Final':'Semi-final'} · {e.teams[t.home].name} vs {e.teams[t.away].name} · {t.winner===undefined?'Awaiting result':e.teams[t.winner].name+' advances'}</summary><div className="space-y-2">{t.results.map((r,j)=><div key={r.id} className="border-t border-border py-2"><p>{j===1?'Teammate singles · simulated':r.kind} · {r.score.join('–')}</p><p>{r.frames.map(f=>`${f.frame}: ${f.player}–${f.opponent}`).join(' · ')}</p><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Player</th><th>Points</th><th>Visits</th><th>Fouls</th><th>Best break</th></tr></thead><tbody>{r.individuals.filter(p=>r.home.includes(p.id)||r.away.includes(p.id)).map(p=><tr key={p.id}><td>{p.name}</td><td>{p.points}</td><td>{p.visits}</td><td>{p.fouls}</td><td>{p.highestBreak}</td></tr>)}</tbody></table></div></div>)}</div></details>)}
 {e.champion&&<div><p className="font-bold text-amber-300">Team champion: {e.champion} · your paid share £{e.award??0}</p><p>{e.teams.flatMap(t=>t.members).filter(p=>(e.playerAwards?.[p.id]??0)>0).map(p=>p.name+' £'+e.playerAwards![p.id]).join(' · ')}</p></div>}
 </section>;
}
export function TeamEventsPage(){const {gameState}=useGame();return <div className="space-y-4 pb-6"><h1 className="text-2xl font-bold">Club & national pairs</h1><p>Optional team invitations and separate team results. At most two accepted side events per season.</p>{gameState.careerDepth?.seasonLife?.teams.slice().reverse().map(e=><TeamEventCard key={e.id} event={e}/>)}{gameState.careerDepth?.seasonLife?.archivedTeams?.slice().reverse().map(e=><details key={e.id}><summary>{e.season} · {e.name} · {e.won?'Team trophy':e.champion??'Archived event'} · £{e.award}</summary>{e.results.map((r,i)=><p key={i}>{r}</p>)}</details>)}{!gameState.careerDepth?.seasonLife?.teams.length&&<p>No invitation yet. Invitations require a free window and a complete eligible named field.</p>}<Link className={button} to="/calendar">Back to calendar</Link></div>}
export function SeasonLifeInbox({messageId}:{messageId:string}){
 const {gameState:s,actOnCareer}=useGame(),l=s.careerDepth?.seasonLife;
 const i=l?.interviews.find(i=>i.id===messageId),story=l?.stories.find(x=>messageId===x.id||messageId.startsWith(x.id+':'));
 if(!i&&!story)return null;
 return <div className="mt-3 space-y-3 rounded border border-border p-3 text-sm">
 {i&&<><p>{i.context}</p><p>Deadline {i.deadline}. No reply means declining comment without penalty.</p>{!i.response&&s.currentDate<=i.deadline?<div className="flex flex-wrap gap-2">{(['praise','candid','challenge','private'] as const).map(response=><button className={button} key={response} onClick={()=>actOnCareer({type:'life-interview',id:i.id,response})}>{({praise:'Praise the opponent',candid:'Speak candidly',challenge:'Competitive challenge',private:'Remain private'})[response]}</button>)}</div>:<p>{i.reaction}</p>}</>}
 {story&&<><p>{story.defaultText} {story.deadline&&`Deadline: ${story.deadline}.`}</p>{story.steps.map((x,j)=><p key={j}>{x.date} · {x.text}</p>)}{story.kind==='form'?<FormRecoveryPanel/>:story.kind==='staff'||story.kind==='junior'?<StaffMovementPanel/>:story.kind==='team'?<Link className={button} to="/career/teams">View invitation, partnership and results</Link>:!story.resolved&&story.steps.length===1&&s.currentDate<=(story.deadline??'')?<button className={button} onClick={()=>actOnCareer({type:'life-return',id:story.id})}>Welcome their return</button>:null}</>}
 </div>;
}
export function TeamLivePanel(){const {gameState:s,actOnCareer}=useGame(),c=s.liveMatch?.teamContext;if(!c)return null;return <details className="shrink-0 rounded border border-border px-3 py-2 text-xs" open><summary className="cursor-pointer">{c.kind} · at table: {c.members[c.order[c.turn]].name} · fixed order {c.order.map(i=>c.members[i].name).join(' → ')}</summary>{c.foulReplayTurn!==undefined&&<button className={button} onClick={()=>actOnCareer({type:"life-foul-replay"})}>Request offender to play again</button>}<div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">{c.members.map(p=><div key={p.id}><b>{p.name}</b><p>Confidence {p.confidence.toFixed(2)}% · fatigue {p.fatigue.toFixed(2)}%</p><p>{p.visits} visits · {p.points} points · {p.fouls} fouls</p></div>)}</div></details>}

export function SeasonLifeHistoryPanel(){const {gameState:s}=useGame(),l=s.careerDepth?.seasonLife;return <CareerDisclosure summary="Season stories, interviews & team trophies" title="In-season career history"><div className="space-y-4 text-sm"><Link to="/career/teams" className={button}>Team trophy cabinet and doubles results</Link><p>Team trophies: {(l?.teams.filter(e=>e.champion===e.teams[0]?.name).length??0)+(l?.archivedTeams?.filter(e=>e.won).length??0)}. Stored separately from singles and major titles.</p>{l?.summaries.map((x,i)=><p key={i}>{x.season} · {x.text}</p>)}{l?.stories.filter(x=>x.resolved).slice(0,20).map(x=><article key={x.id}><h3 className="font-semibold">{x.title} · {x.resolved}</h3><p>{x.steps.at(-1)?.text}</p></article>)}{Boolean(l?.archivedStories?.length)&&<details><summary>Earlier story conclusions · {l?.archivedStories?.length}</summary>{l?.archivedStories?.slice().reverse().map(x=><p key={x.id}>{x.date} · {x.title}: {x.text}</p>)}</details>}{l?.interviews.filter(i=>i.response).slice(0,20).map(i=><article key={i.id}><h3 className="font-semibold">{i.title} · {i.answered}</h3><p>{i.context}</p><p>{i.response} · {i.reaction}</p></article>)}</div></CareerDisclosure>}
