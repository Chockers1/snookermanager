import type { GameState, LiveMatchState } from '../../hooks/useGameState';
import type { Match, TrainingPlannerDay } from '../../types/game';
import { bounded, plusDays } from '../careerDepth/shared';
import { lifeOf, lifeStory, putLife, storyStep } from './shared';
import type { FormEvidence, FormIssue, RecoveryRoute } from './types';
export const emptyEvidence = ():FormEvidence=>({openings:0,openingsMade:0,strongLeads:0,leadsLost:0});
export function diagnoseForm(rows:FormEvidence[]):{kind:FormIssue['kind'];evidence:string}|undefined {
 if(rows.length<6)return;
 const recent=rows.slice(-3), baseline=rows.slice(0,-3);
 const total=(xs:FormEvidence[],key:keyof FormEvidence)=>xs.reduce((n,x)=>n+x[key],0);
 const a=total(recent,'openings'),b=total(baseline,'openings');
 const normal=total(baseline,'openingsMade')/b, now=total(recent,'openingsMade')/a;
 if(a>=12 && b>=12 && normal-now>=.2 && recent.every(x=>x.openings>=3 && x.openingsMade/x.openings<normal-.1))
 return {kind:'long-pot',evidence:`Modelled long openings: ${total(recent,'openingsMade')}/${a} over 3 matches; own earlier baseline ${total(baseline,'openingsMade')}/${b}. These are simulation opportunities, not measured shot distances.`};
 const leads=total(recent,'strongLeads'), oldLeads=total(baseline,'strongLeads');
 if(leads>=3 && oldLeads>=3 && recent.every(x=>x.leadsLost>0) && total(recent,'leadsLost')/leads-total(baseline,'leadsLost')/oldLeads>=.25)
 return {kind:'closing',evidence:`Lost ${total(recent,'leadsLost')} of ${leads} strong late-frame leads in 3 matches; earlier ${total(baseline,'leadsLost')}/${oldLeads}. Strong means at least 25 ahead with at most 75 points remaining. Simulation evidence cannot prove the cause.`};
}
export function recordForm(s:GameState,m:Match):GameState {
 if(!m.formEvidence)return s;
 const l=lifeOf(s);if(l.evidence.some(x=>x.id===m.id))return s;
 const evidence=[...l.evidence,{...m.formEvidence,id:m.id,date:m.playedOn??s.currentDate}].slice(-15);
 let next=putLife(s,{...l,evidence});const diagnosis=diagnoseForm(evidence);
 if(!diagnosis || l.form || (l.formCooldown??'')>s.currentDate)return next;
 const issue:FormIssue={...diagnosis,id:'form:'+m.id,started:s.currentDate,ends:plusDays(s.currentDate,42),progress:0,route:'patience',fatigue:s.player.fatigue,confidence:s.player.confidence};
 next=putLife(next,{...lifeOf(next),form:issue,formCooldown:plusDays(s.currentDate,56)});
 return lifeStory(next,{id:issue.id,kind:'form',title:diagnosis.kind==='long-pot'?'Long-opening reliability concern':'Closing frames: a pattern to review',created:s.currentDate,deadline:issue.ends,defaultText:'Patience: temporary effects fade within six weeks. No permanent attribute loss.',steps:[{date:s.currentDate,text:issue.evidence}]});
}
export function chooseRecovery(s:GameState,route:RecoveryRoute):GameState {
 const l=lifeOf(s);if(!l.form)return s;
 if(route==='coach'&&!s.coachContracts.length)return {...s,lastAction:'Coach-supported recovery requires an employed coach. Training, tactical protection and patience remain available.'};
 const next=putLife(s,{...l,form:{...l.form,route}});
 return storyStep(next,l.form.id,`Recovery choice: ${route}. At most one recovery credit per completed training week; no immediate cure.`);
}
export function settleFormDate(s:GameState):GameState {
 const l=lifeOf(s),f=l.form;if(!f)return s;
 const passive=Math.min(100,Math.max(0,(Date.parse(s.currentDate)-Date.parse(f.started))/86400000/42*100));
 const progress=Math.max(f.progress,passive);
 if(progress>=100 || s.currentDate>=f.ends){const next=storyStep(s,f.id,'Recovery period complete. The temporary effect has ended; recent evidence remains available for review.',true);return putLife(next,{...lifeOf(next),form:undefined});}
 return progress===f.progress?s:putLife(s,{...l,form:{...f,progress}});
}
export function formTraining(s:GameState,plan:TrainingPlannerDay[]):GameState {
 const l=lifeOf(s),f=l.form,key=s.season+':'+s.week;
 if(!f||f.lastTraining===key)return s;
 const protectedWeek=s.trainingCondition.injuryWeeks>0||plan.some(d=>d.competitionName && d.planningBlockKind!=='training');
 const titles=plan.flatMap(d=>[d.morning.title,d.afternoon.title,d.evening.title]);
 const relevant=titles.filter(x=>f.kind==='long-pot'?/Long Pot|Line-Up/.test(x):/Match|Mental|Safety/.test(x)).length;
 const coached=f.route==='coach'&&s.coachContracts.length>0;
 const earned=!protectedWeek&&(f.route==='training'&&relevant>=3 || coached&&relevant>=2 || f.route==='protect'&&titles.filter(x=>/Safety|Match Prep/.test(x)).length>=3);
 const progress=Math.min(100,f.progress+(earned?34:0));
 return settleFormDate(putLife(s,{...l,form:{...f,lastTraining:key,progress}}));
}
export function formLiveAdjustment(live:LiveMatchState):LiveMatchState {
 const f=live.formIssue;if(!f || live.teamContext)return live;
 const penalty=Math.min(3,3*(1-f.progress/100));
 const protective=f.route==='protect';
 const relevant=f.kind==='long-pot' || live.formLeadFrame===live.currentFrame;
 if(!relevant)return live;
 // Cue-action adjustment already has its own cost; don't apply another penalty while rebuilding.
 if(live.formProjectProtected)return live;
 const p=live.playerVisitProfile;
 return {...live,tacticalPlan:protective?'Safety':live.tacticalPlan,playerVisitProfile:{...p,longPotting:bounded(p.longPotting-(f.kind==='long-pot'?penalty:0)),composure:bounded(p.composure-(f.kind==='closing'?penalty:0))}};
}
