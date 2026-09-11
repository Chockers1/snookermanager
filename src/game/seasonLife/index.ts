import {ensureCoachContractDates} from '../coachContractDates';
import { replayTeamFoul } from './live';
import type { GameState } from '../../hooks/useGameState';
import type { TrainingPlannerDay } from '../../types/game';
import { plusDays, depthOf } from '../careerDepth/shared';
import { lifeOf, lifeStory, putLife, storyStep } from './shared';
import { recordForm, chooseRecovery, settleFormDate, formTraining } from './form';
import { reviewJunior, juniorCoaches, reconcileStaff, staffChoice, staffRecord, staffTraining } from './staff';
import { offerTeam, teamChoice, startTeamMatch } from './teams';
import { offerInterview, answerInterview, reviewMajorPreparation } from './media';
import type { SeasonLifeAction, SeasonLifeState } from './types';
export function initializeSeasonLife(s:GameState):GameState {
 s=ensureCoachContractDates(s);
 if(s.careerDepth?.seasonLife?.version===1)return s;
 const staff:SeasonLifeState['staff']={};
 // Short legacy contracts receive no backdated demand or forced outside employment.
 for(const c of s.coachContracts)staff[c.coachId]={...staffRecord(c.coachId),contractKey:c.startedWeek+':'+c.contractWeeks+':'+c.totalCost,end:c.endsOn!};
 const l:SeasonLifeState={version:1,initialized:s.currentDate,checkedDate:s.currentDate,matchCursor:s.matches[0]?.id,televisedBreakthroughSeen:s.matches.some(m=>m.televised&&m.result==='Won'),evidence:[],staff,interviews:[],stories:[],partnerships:{},teams:[],injuredRivals:[],summaries:[],season:s.season};
 return {...putLife(s,l),coaches:juniorCoaches(s.coaches)};
}
export function reconcileSeasonLife(state:GameState):GameState {
 let s=initializeSeasonLife(state);
 if(s.coachContracts.some(c=>c.endsOn!<=s.currentDate))s=reconcileStaff(s);
 let l=lifeOf(s);
 if(l.checkedDate===s.currentDate && l.matchCursor===s.matches[0]?.id)return s;
 if(l.matchCursor!==s.matches[0]?.id){
  // New records are newest-first. Stop at the cursor; never scan the old career on inbox navigation.
  const fresh=[];for(const m of s.matches){if(m.id===l.matchCursor)break;fresh.push(m);if(fresh.length===32)break;}
  for(const m of fresh.reverse()){s=recordForm(s,m);s=offerInterview(s,m);s=reviewMajorPreparation(s,m);}
  s=putLife(s,{...lifeOf(s),matchCursor:s.matches[0]?.id});
 }
 if(l.checkedDate!==s.currentDate){
  s=settleFormDate(s);s=reconcileStaff(s);l=lifeOf(s);
  for(const story of l.stories)if(story.kind==='junior'&&!story.resolved&&story.deadline&&s.currentDate>story.deadline&&story.subjectId)s=reviewJunior(s,story.subjectId,'supported');
  for(const id of l.injuredRivals){const p=s.worldPlayers.find(x=>x.id===id);if(p&&!p.injuryWeeks&&!p.retired)s=lifeStory(s,{id:'return:'+id+':'+s.currentDate,subjectId:id,kind:'return',title:p.playerName+' returns from injury',created:s.currentDate,deadline:plusDays(s.currentDate,7),defaultText:'No reply: no public comment, no penalty.',steps:[{date:s.currentDate,text:'A previously recorded injury has cleared. Their next meeting with you will provide competitive evidence.'}]});}
  l=lifeOf(s);
  const teams=l.teams.map(t=>t.status==='invited'&&s.currentDate>t.deadline?{...t,status:'declined' as const}:t.status==='accepted'&&s.currentDate>t.end?{...t,status:'withdrawn' as const,settled:true,award:0}:t);
  s=putLife(s,{...l,checkedDate:s.currentDate,injuredRivals:s.worldPlayers.filter(p=>p.injuryWeeks&&depthOf(s).relationships[p.id]?.rivalry).map(p=>p.id),interviews:l.interviews.map(i=>!i.response&&s.currentDate>i.deadline?{...i,response:'private',answered:i.deadline,reaction:'Deadline passed; declined comment without penalty.'}:i),teams});
  for(const t of teams)if((t.status==='declined'||t.status==='withdrawn')&&!lifeOf(s).stories.find(x=>x.id===t.id)?.resolved)s=storyStep(s,t.id,t.status==='declined'?'Invitation expired: declined without penalty.':'Event dates passed. Entry withdrawn, no award; career advancement was not blocked.',true);
  if(l.season!==s.season){s=putLife(s,{...lifeOf(s),season:s.season,summaries:[...l.summaries,{season:l.season,text:`Career history at season close: ${l.stories.filter(x=>x.resolved).length} stored conclusions; ${l.teams.filter(t=>t.season===l.season&&t.champion===t.teams[0].name).length} team trophies this season. Singles ranking credit: none from team events.`}].slice(-80),archivedTeams:[...(l.archivedTeams??[]),...lifeOf(s).teams.slice(0,-80).map(e=>{
   const names=new Map(e.teams.flatMap(t=>t.members.map(p=>[p.id,p.name] as const)));
   return {id:e.id,season:e.season,name:e.name,champion:e.champion,won:e.champion===e.teams[0].name,award:e.award??0,results:e.ties.flatMap(t=>t.results.map(r=>r.kind+': '+r.home.map(id=>names.get(id)).join(' & ')+' '+r.score.join('–')+' '+r.away.map(id=>names.get(id)).join(' & ')))};
  })],teams:lifeOf(s).teams.slice(-80)});}
  s=offerTeam(s);
 }
 return s;
}
export function seasonLifeAction(state:GameState,a:SeasonLifeAction):GameState {
 const s=initializeSeasonLife(state);
 switch(a.type){
  case 'life-recovery':return chooseRecovery(s,a.route);
  case 'life-staff':return staffChoice(s,a.id,a.choice);
  case 'life-interview':return answerInterview(s,a.id,a.response);
  case 'life-team':return teamChoice(s,a.id,a.choice,a.partnerId);
  case 'life-play-team':return startTeamMatch(s,a.id);
  case 'life-junior-review':return reviewJunior(s,a.id,a.choice);
  case 'life-foul-replay':return s.liveMatch?{...s,liveMatch:replayTeamFoul(s.liveMatch)}:s;
  case 'life-return':return storyStep(s,a.id,'Welcomed their return. The next recorded meeting will conclude this story.');
 }
}
export function seasonLifeTraining(state:GameState,plan:TrainingPlannerDay[]):GameState {return staffTraining(formTraining(initializeSeasonLife(state),plan),plan);}
export function lifeBoundary(s:GameState):string[]{const l=s.careerDepth?.seasonLife;if(!l)return [];return [...l.teams.filter(t=>t.status==='accepted').flatMap(t=>[t.start,t.end]),...l.interviews.filter(i=>!i.response).map(i=>plusDays(i.deadline,1)),...Object.values(l.staff).flatMap(r=>[r.end,r.promise?.due].filter((d):d is string=>!!d))];}
