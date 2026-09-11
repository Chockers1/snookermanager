import {ensureCoachContractDates} from '../coachContractDates';
import type { GameState } from '../../hooks/useGameState';
import type { Coach, TrainingPlannerDay } from '../../types/game';
import { bounded, depthOf, plusDays } from '../careerDepth/shared';
import { lifeOf, lifeStory, putLife, storyStep } from './shared';
import type { StaffRecord } from './types';
const ambitions = ['facilities','progression','methods','pay'] as const;
export function staffRecord(id:string):StaffRecord { return {ambition:ambitions[Array.from(id).reduce((n,c)=>n+c.charCodeAt(0),0)%4],experience:0,history:[]}; }
export function juniorCoaches(coaches:Coach[]):Coach[] {
 if(!coaches.length)return coaches;
 const juniors=['Alex Fenwick','Morgan Li'].map((name,i)=>({...coaches[0],id:'junior-coach-'+i,name,type:i?'Mental' as const:'Technical' as const,level:'Low' as const,minimumRanking:undefined,minimumReputation:0,unlockLabel:'Junior coach · uses an ordinary staff slot',weeklyCost:35+i*5,reputation:20,compatibility:65,technical:35,mental:35,tactical:30,motivation:55,discipline:45,specialism:i?'Focus':'Long Potting',strengths:['Affordable supervised development'],weaknesses:['Limited experience']}));
 return [...coaches,...juniors.filter(j=>!coaches.some(c=>c.id===j.id))];
}
export function staffUnavailable(s:GameState,id:string):string|undefined {
 const r=s.careerDepth?.seasonLife?.staff[id];
 if(r?.employer && (r.employedUntil??'')>s.currentDate)return `Employed by ${s.worldPlayers.find(p=>p.id===r.employer)?.playerName??'another player'} until ${r.employedUntil}.`;
}
export function reconcileStaff(s:GameState):GameState {
 s=ensureCoachContractDates(s);
 s={...s,coachContracts:s.coachContracts.filter(c=>c.endsOn!>s.currentDate)};
 let next=s;const staff={...lifeOf(s).staff};
 for(const c of s.coaches){
  let r={...(staff[c.id]??staffRecord(c.id))};const contract=s.coachContracts.find(x=>x.coachId===c.id);
  if(r.employer && (r.employedUntil??'')<=s.currentDate)r={...r,employer:undefined,history:[...r.history,{date:s.currentDate,text:'Returned to the recruitment market.'}].slice(-12)};
  if(contract){
   const key=contract.startedWeek+':'+contract.contractWeeks+':'+contract.totalCost;
   if(r.contractKey!==key)r={...r,contractKey:key,end:contract.endsOn!,notice:undefined,employer:undefined,history:[...r.history,{date:s.currentDate,text:'Contract active with '+s.player.fullName}].slice(-12)};
   const days=(Date.parse(r.end!)-Date.parse(s.currentDate))/86400000;
   if(r.notice?.choice==='extend' && r.notice.deadline!==r.end && days<=35)r={...r,notice:undefined};
   if(!r.notice && days>=14 && days<=35){
    const ambition=r.ambition;
    const reason=ambition==='facilities' && s.realism?.base!=='academy'?'Wants academy facilities for the next contract.':ambition==='methods' && s.trainingCondition.strain>=40?'Wants a lighter workload after recorded training strain.':ambition==='progression'?`Review competitive progression: currently ${s.player.rankingLabel} #${s.player.worldRanking??s.player.amateurRanking??'unranked'}.`:'Review remuneration before renewing the contract.';
    const cpu=s.worldPlayers.filter(p=>!p.retired && !p.injuryWeeks).find(p=>!Object.values(staff).some(x=>x.employer===p.id));
    r.notice={id:'staff:'+c.id+':'+r.end,date:s.currentDate,deadline:r.end!,reason,destination:cpu?.id,quotedWeekly:contract.weeklyCost};
   }
  } else if(r.contractKey){
   const destination=r.notice?.choice!=='extend'?r.notice?.destination:undefined;
   const honoured=!r.end || s.currentDate>=r.end;
   r={...r,contractKey:undefined,employer:honoured?destination:undefined,employedUntil:honoured&&destination?plusDays(s.currentDate,364):undefined,history:[...r.history,{date:s.currentDate,text:honoured&&destination?'Joined '+s.worldPlayers.find(p=>p.id===destination)?.playerName:'Employment with '+s.player.fullName+' ended.'}].slice(-12)};
   if(r.notice)next=storyStep(next,r.notice.id,`${c.name}'s contract ended. ${honoured&&destination?'Joined '+s.worldPlayers.find(p=>p.id===destination)?.playerName+'. ':''}Recruitment has replacements; independent training remains available.`,true);
  }
  if(r.promise && r.promise.met===undefined && s.currentDate>=r.promise.due){
   const met=r.promise.kind==='facilities'?s.realism?.base==='academy':s.trainingCondition.strain<40 && s.trainingCondition.burnout<40;
   r={...r,promise:{...r.promise,met},history:[...r.history,{date:s.currentDate,text:met?'Agreed commitment fulfilled.':'Commitment missed; trust reduced, signed terms remain binding.'}].slice(-12)};
   const d=depthOf(next),old=d.coachRelationships[c.id]??{trust:55,note:''};
   next={...next,careerDepth:{...d,coachRelationships:{...d.coachRelationships,[c.id]:{...old,trust:bounded(old.trust+(met?3:-5)),note:r.history.at(-1)!.text}}}};
   if(r.notice)next=storyStep(next,r.notice.id,r.history.at(-1)!.text);
  }
  staff[c.id]=r;
 }
 next=putLife(next,{...lifeOf(next),staff});
 for(const [id,r] of Object.entries(staff))if(r.notice)next=lifeStory(next,{id:r.notice.id,subjectId:id,kind:'staff',title:s.coaches.find(c=>c.id===id)?.name+' · renewal review',created:r.notice.date,deadline:r.notice.deadline,defaultText:'No reply: current contract honoured; no new spending. Departure at contract expiry.',steps:[{date:r.notice.date,text:r.notice.reason+' Current terms last until '+r.end+'.'}]});
 return next;
}
export function staffChoice(s:GameState,id:string,choice:'extend'|'facilities'|'workload'|'decline'):GameState {
 const l=lifeOf(s),r=l.staff[id],c=s.coachContracts.find(x=>x.coachId===id);
 if(!r?.notice || (r.notice.choice && !(r.notice.choice==='promise'&&choice==='extend')) || !c || s.currentDate>=r.notice.deadline)return {...s,lastAction:'This renewal decision is no longer available.'};
 const amount=r.notice.quotedWeekly*13;
 if(choice==='extend' && s.player.cash<amount)return {...s,lastAction:`Extension needs a £${amount} cash reserve for 13 additional weeks. No money was spent.`};
 const record:StaffRecord={...r,notice:{...r.notice,choice:choice==='extend'?'extend':choice==='decline'?'decline':'promise'},promise:choice==='facilities'||choice==='workload'?{kind:choice,due:plusDays(s.currentDate,28)}:r.promise};
 let next=putLife(s,{...l,staff:{...l.staff,[id]:record}});
 if(choice==='extend'){
  // Additional weeks are billed by the existing weekly ledger, never a second upfront fee.
  const contracts=s.coachContracts.map(x=>x.coachId===id?{...x,endsOn:plusDays(x.endsOn??r.end!,91),weeksRemaining:x.weeksRemaining+13,contractWeeks:x.contractWeeks+13,totalCost:x.totalCost+amount}:x);
  const updated={...record,end:plusDays(r.end!,91),contractKey:contracts.find(x=>x.coachId===id)!.startedWeek+':'+contracts.find(x=>x.coachId===id)!.contractWeeks+':'+contracts.find(x=>x.coachId===id)!.totalCost};
  next={...putLife(next,{...lifeOf(next),staff:{...lifeOf(next).staff,[id]:updated}}),coachContracts:contracts};
 }
 return storyStep(next,r.notice.id,choice==='extend'?`Extension signed: 13 extra weeks. Current weekly rate £${c.weeklyCost} remains binding; agreed renewal reviewed at the next expiry.`:choice==='decline'?'Request declined. Existing contract continues until its stated end.':`Dated ${choice} commitment recorded for ${record.promise!.due}. Arrange it yourself; no automatic spending.`);
}
export function staffTraining(s:GameState,plan:TrainingPlannerDay[]):GameState {
 if(plan.some(d=>d.competitionName && d.planningBlockKind!=='training') || s.trainingCondition.injuryWeeks>0)return s;
 let next=s;const staff={...lifeOf(s).staff},key=s.season+':'+s.week;
 for(const contract of s.coachContracts.filter(c=>c.coachId.startsWith('junior-coach-'))){
  const old=staff[contract.coachId]??staffRecord(contract.coachId);if(old.lastTraining===key)continue;
  const relevant=plan.flatMap(d=>[d.morning,d.afternoon,d.evening]).filter(c=>/Technical|Mental/.test(c.category)).length;
  if(relevant<3)continue;
  const mentored=old.juniorResponsibility!=='specialist'&&s.coachContracts.some(c=>c.coachId!==contract.coachId&&!c.coachId.startsWith('junior-coach-'));
  const experience=old.experience+(mentored?2:1);staff[contract.coachId]={...old,lastTraining:key,experience};
  next=lifeStory(next,{id:'junior:'+contract.coachId,subjectId:contract.coachId,kind:'junior',title:'Junior coach development',created:s.currentDate,defaultText:'Development comes from completed coaching work in an occupied staff slot.',steps:[{date:s.currentDate,text:'Junior appointment: three relevant sessions are needed per training week. An employed senior can mentor them.'}]});
  if(old.experience<12&&experience>=12){
   next=storyStep(next,'junior:'+contract.coachId,'Development milestone: supervised coaching experience is improving their specialism. Review their responsibilities in Staff.');
   next=putLife(next,{...lifeOf(next),stories:lifeOf(next).stories.map(x=>x.id==='junior:'+contract.coachId?{...x,deadline:plusDays(s.currentDate,28),defaultText:'No reply retains the supported role and existing pay. No additional slot is granted.'}:x)});
  }
 }
 next=putLife(next,{...lifeOf(next),staff});
 return {...next,coaches:next.coaches.map(c=>c.id.startsWith('junior-coach-')?{...c,[c.type==='Mental'?'mental':'technical']:Math.min(60,35+Math.floor((staff[c.id]?.experience??0)/3)+(staff[c.id]?.juniorResponsibility==='specialist'?2:0))}:c)};
}

export function reviewJunior(s:GameState,id:string,choice:'supported'|'specialist'):GameState {
 const l=lifeOf(s),r=l.staff[id],story=l.stories.find(x=>x.id==='junior:'+id);
 if(!r || r.experience<12 || r.juniorResponsibility || !story || story.resolved)return s;
 const selected=s.currentDate>(story.deadline??'')?'supported':choice;
 const next=putLife({...s,coaches:s.coaches.map(c=>c.id===id?{...c,[c.type==='Mental'?'mental':'technical']:Math.min(60,35+Math.floor(r.experience/3)+(selected==='specialist'?2:0))}:c)},{...l,staff:{...l.staff,[id]:{...r,juniorResponsibility:selected}}});
 return storyStep(next,story.id,selected==='specialist'?'Responsibility review: leads their trained specialism. Two coaching skill points earned; senior mentoring no longer accelerates weekly development. Same occupied slot and pay.':'Responsibility review: retained the supported role. An employed senior can continue mentoring; same occupied slot and pay.',true);
}
