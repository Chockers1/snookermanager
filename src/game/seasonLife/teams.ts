import { applyTourSkills } from '../tourDevelopment';
import type { GameState, LiveMatchState } from '../../hooks/useGameState';
import { createTeamLiveMatch, advanceLiveVisit } from '../../hooks/useGameState';
import { careerMessage, plusDays, overlaps, depthOf } from '../careerDepth/shared';
import { lifeOf, putLife, lifeStory, storyStep, settleLifeMoney } from './shared';
import type { Team, TeamEvent, TeamMember, TeamRubber, TeamTie } from './types';
export function member(s:GameState,id:string):TeamMember {
 const cpu=s.worldPlayers.find(p=>p.id===id), own=id===s.player.id;
 const rating=cpu?.overallRating??50,a=s.attributes;
 const profile=own?{longPotting:a.technical['Long Potting'],breakBuilding:a.technical['Break Building'],cueBallControl:a.technical['Cue Ball Control'],safetyPlay:a.technical['Safety Play'],consistency:a.technical.Consistency,composure:a.mental.Composure,focus:a.mental.Focus,bigMatchNerve:a.mental['Big Match Nerve'],handSteadiness:a.physical['Hand Steadiness'],stamina:a.physical.Stamina}:Object.fromEntries(['longPotting','breakBuilding','cueBallControl','safetyPlay','consistency','composure','focus','bigMatchNerve','handSteadiness','stamina'].map(k=>[k,rating])) as LiveMatchState['playerVisitProfile'];
 return {id,name:own?s.player.fullName:cpu!.playerName,nation:own?(s.competitionTables.world.find(p=>p.playerName===s.player.fullName)?.nation??s.player.nationality):cpu!.nation,profile:own?profile:applyTourSkills(profile,cpu?.skillDevelopment),confidence:own?s.player.confidence:65,fatigue:own?s.player.fatigue:cpu?.fatigue??15,visits:0,pots:0,fouls:0,points:0,highestBreak:0};
}
export function teamConflict(s:GameState,start:string,end:string,except?:string):string|undefined {
 if(s.tournaments.some(t=>t.status==='Entered'&&overlaps(start,end,plusDays(t.startDate,-1),t.endDate??t.startDate)))return 'Conflicts with an entered tournament or its travel day.';
 if(depthOf(s).commitments.some(c=>c.status==='scheduled'&&overlaps(start,end,c.startDate,c.endDate)))return 'Conflicts with a scheduled commitment.';
 if(depthOf(s).board?.blocks.some(b=>overlaps(start,end,b.start,b.end)))return 'Conflicts with a protected planning block.';
 if(s.careerDepth?.seasonLife?.teams.some(t=>t.id!==except&&t.status==='accepted'&&overlaps(start,end,t.start,t.end)))return 'Conflicts with an accepted team event.';
}
export function availableTeamMember(s:GameState,id:string,start:string,end:string,kind:TeamEvent['kind']):boolean {
 const p=s.worldPlayers.find(x=>x.id===id);if(!p||p.retired||p.injuryWeeks||p.playerName===s.player.fullName)return false;
 if(kind!=='nations' && p.hasTourCard || kind==='youth' && p.age>=21 || kind==='amateur' && p.age<17)return false;
 // Only offer side windows clear of that player's regular circuit. No invented CPU bookings.
 return !s.tournaments.some(t=>overlaps(start,end,t.startDate,t.endDate??t.startDate)&&(p.hasTourCard?['Professional Tour','Ranking','Major','Invitational'].includes(t.type):[...['Amateur','Q Tour','Q School'],...(p.age<21?['Junior','Regional Youth','National Youth']:[])].includes(t.type)));
}
export function offerTeam(s:GameState):GameState {
 const l=lifeOf(s);if(s.careerSystems.lateCareer.retired || s.careerSystems.lateCareer.retirementPending || s.currentDate<=l.initialized || (l.nextTeamOfferDate??'')>s.currentDate || s.liveMatch?.status==='In Progress' || s.seasonReview?.pending)return s;
 const existing=l.teams.filter(t=>t.season===s.season);
 if(existing.length>=2 || existing.some(t=>t.status==='invited'||t.status==='accepted') || existing.at(-1)&&s.currentDate<plusDays(existing.at(-1)!.start,90))return s;
 const kind:TeamEvent['kind']=s.careerSystems.pro.hasTourCard?'nations':s.player.age<21&&/youth|junior/i.test(s.player.rankingLabel+' '+s.player.careerStage)?'youth':'amateur';
 const name=kind==='nations'?'Nations Pairs Invitational':kind==='youth'?'Youth Club Pairs':'Amateur Club Pairs';
 const own=member(s,s.player.id);
 const ranks=new Map(s.competitionTables.world.map(p=>[p.playerName,p.ranking]));
 for(let offset=14;offset<=56;offset++){
  const start=plusDays(s.currentDate,offset),end=plusDays(start,1);
  if(start.slice(0,7)!==end.slice(0,7) || teamConflict(s,start,end))continue;
  const pool=s.worldPlayers.filter(p=>availableTeamMember(s,p.id,start,end,kind)).sort((a,b)=> (ranks.get(a.playerName)??999)-(ranks.get(b.playerName)??999));
  let teams:Team[]=[],options:TeamMember[]=[];
  if(kind==='nations'){
   const national=pool.filter(p=>p.nation===own.nation);if(!national.length)continue;
   const ownRank=s.player.worldRanking??999;
   if(national.filter(p=>(ranks.get(p.playerName)??999)<ownRank).length>=2)continue;
   options=[member(s,national[0].id)];teams=[{name:own.nation,members:[own,options[0]]}];
   for(const nation of [...new Set(pool.map(p=>p.nation))]){if(nation===own.nation)continue;const pair=pool.filter(p=>p.nation===nation).slice(0,2);if(pair.length===2)teams.push({name:nation,members:[member(s,pair[0].id),member(s,pair[1].id)]});if(teams.length===4)break;}
  } else if(pool.length>=7){
   options=pool.slice(0,Math.min(6,pool.length-6)).map(p=>member(s,p.id));
   teams=[{name:own.name+' & '+options[0].name,members:[own,options[0]]}];
   const opponents=pool.filter(p=>!options.some(x=>x.id===p.id)).slice(0,6);
   for(let i=0;i<6;i+=2)teams.push({name:opponents[i].playerName+' & '+opponents[i+1].playerName,members:[member(s,opponents[i].id),member(s,opponents[i+1].id)]});
  }
  if(teams.length!==4)continue;
  const event:TeamEvent={id:'pairs:'+s.season+':'+existing.length,season:s.season,name,kind,cutoff:s.currentDate,start,end,deadline:plusDays(start,-3),status:'invited',teams,partnerOptions:options,ties:[{home:0,away:1,results:[]},{home:2,away:3,results:[]}],fee:kind==='nations'?0:25,travel:100,support:100,winnerShare:kind==='nations'?1000:250,runnerUpShare:kind==='nations'?400:100};
  const next=putLife(s,{...l,teams:[...l.teams,event]});
  return lifeStory(next,{id:event.id,subjectId:event.id,kind:'team',title:name+' · invitation',created:s.currentDate,deadline:event.deadline,defaultText:'Optional. No reply declines without penalty. Local host covers £100 travel; no hotel required.',steps:[{date:s.currentDate,text:`Fictional two-day pairs event, ${start}–${end}. Four named teams. Two singles and a deciding doubles, each best of three.`}]});
 }
 return putLife(s,{...l,nextTeamOfferDate:plusDays(s.currentDate,28)});
}
export function teamChoice(s:GameState,id:string,choice:'accept'|'decline'|'withdraw',partnerId?:string):GameState {
 const l=lifeOf(s),e=l.teams.find(t=>t.id===id);if(!e)return s;
 if(choice==='withdraw'){
  if(e.status!=='accepted'||s.liveMatch?.status==='In Progress'&&s.liveMatch.teamContext?.eventId===id)return {...s,lastAction:'Finish the active match before withdrawing.'};
  return storyStep(putLife(s,{...l,teams:l.teams.map(t=>t.id===id?{...t,status:'withdrawn',settled:true,award:0}:t)}),id,'Withdrawn. Entry and travel already settled; no award. Singles records are unchanged.',true);
 }
 if(e.status!=='invited'||s.currentDate>e.deadline)return {...s,lastAction:'Invitation closed. Silence declines without a penalty.'};
 if(choice==='decline')return storyStep(putLife(s,{...l,teams:l.teams.map(t=>t.id===id?{...t,status:'declined'}:t)}),id,'Invitation declined without penalty.',true);
 if(s.careerSystems.lateCareer.retired||s.careerSystems.lateCareer.retirementPending)return {...s,lastAction:'You are retired or completing your final booked events. Decline this invitation to close it.'};
 if(l.teams.filter(t=>t.season===s.season&&t.accepted).length>=2)return {...s,lastAction:'Two accepted side events is the season limit.'};
 if(e.kind!=='nations'&&s.careerSystems.pro.hasTourCard||e.kind==='youth'&&s.player.age>=21)return {...s,lastAction:'Your current age or professional status no longer meets this invitation.'};
 const partner=e.partnerOptions.find(p=>p.id===(partnerId??e.partnerOptions[0]?.id));
 if(!partner || !availableTeamMember(s,partner.id,e.start,e.end,e.kind))return {...s,lastAction:'Partner is no longer eligible or available.'};
 if(e.teams.slice(1).some(t=>t.members.some(p=>!availableTeamMember(s,p.id,e.start,e.end,e.kind))))return {...s,lastAction:'A complete eligible field is no longer available.'};
 const conflict=teamConflict(s,e.start,e.end,id);if(conflict)return {...s,lastAction:conflict};
 if(s.player.cash<e.fee+e.travel-e.support)return {...s,lastAction:'Insufficient funds for the disclosed net booking cost.'};
 const teams=e.teams.map((t,i)=>i===0?{...t,name:e.kind==='nations'?t.name:s.player.fullName+' & '+partner.name,members:[t.members[0],partner] as [TeamMember,TeamMember]}:t);
 let next=putLife(s,{...l,teams:l.teams.map(t=>t.id===id?{...t,status:'accepted',accepted:s.currentDate,teams}:t)});
 next=settleLifeMoney(next,id+':fee',-e.fee,e.name+' entry');next=settleLifeMoney(next,id+':travel',-e.travel,e.name+' travel');next=settleLifeMoney(next,id+':support',e.support,e.name+' host travel support');
 return storyStep(next,id,`Partnership accepted with ${partner.name}. Entry £${e.fee}; travel £${e.travel}; support £${e.support}. Each player receives £${e.winnerShare} for winning or £${e.runnerUpShare} as runner-up; no ranking credit.`);
}
function rubberIndex(t:TeamTie){return t.results.length;}
export function nextTeamMatch(e:TeamEvent){return e.ties.findIndex(t=>t.winner===undefined&&(t.home===0||t.away===0));}
export function startTeamMatch(s:GameState,id:string):GameState {
 const e=lifeOf(s).teams.find(t=>t.id===id);if(!e||e.status!=='accepted')return s;
 if(s.liveMatch?.status==='In Progress')return {...s,lastAction:'Finish your current match first.'};
 const tie=nextTeamMatch(e),date=tie===2?e.end:e.start;
 if(s.currentDate<date)return {...s,lastAction:`Team match is on ${date}. Advance through the calendar; optional team invitations do not block advancement.`};
 if(s.currentDate>e.end || tie<0)return s;
 if(s.careerSystems.lateCareer.retired)return {...s,lastAction:'You are retired from competitive events. Withdraw this optional entry to close it.'};
 if(s.trainingCondition.injuryWeeks>0 || e.kind!=='nations'&&s.careerSystems.pro.hasTourCard || e.kind==='youth'&&s.player.age>=21)return {...s,lastAction:'Current injury, age or professional status prevents participation. Withdraw the optional event to continue.'};
 if(e.teams.some(t=>t.members.some(p=>p.id!==s.player.id&&(s.worldPlayers.find(w=>w.id===p.id)?.retired||s.worldPlayers.find(w=>w.id===p.id)?.injuryWeeks))))return {...s,lastAction:'A named participant is unavailable. Withdraw this optional entry; no anonymous replacement is created.'};
 return {...s,liveMatch:createTeamLiveMatch(s,e,tie,rubberIndex(e.ties[tie])),lastAction:e.name+' · team match ready'};
}
export function simulateTeamRubber(s:GameState,e:TeamEvent,tie:number,rubber:number):TeamRubber {
 let live=createTeamLiveMatch(s,e,tie,rubber);
 for(let i=0;i<6000&&live.status==='In Progress';i++)live=advanceLiveVisit(live,undefined,'simulated');
 if(live.status!=='Completed')throw new Error('Team match did not finish within the visit bound');
 return teamRubber(live);
}
export function teamRubber(live:LiveMatchState):TeamRubber {
 const c=live.teamContext!;return {id:live.sessionId!,kind:c.kind,home:c.kind==='doubles'?c.members.slice(0,2).map(p=>p.id):[c.members[c.order[0]].id],away:c.kind==='doubles'?c.members.slice(2).map(p=>p.id):[c.members[c.order[1]].id],score:[live.playerFrames,live.opponentFrames],frames:live.frameHistory,individuals:c.members};
}
export function settleTeamMatch(s:GameState,live:LiveMatchState):GameState {
 const l=lifeOf(s),ctx=live.teamContext!,e=l.teams.find(t=>t.id===ctx.eventId);if(!e||e.status!=='accepted'||live.status!=='Completed')return s;
 if(e.ties.some(t=>t.results.some(r=>r.id===live.sessionId)))return s;
 let event={...e,ties:e.ties.map(t=>({...t,results:[...t.results]})),teams:e.teams.map(t=>({...t,members:t.members.map(p=>({...p})) as [TeamMember,TeamMember]}))};
 function append(index:number,result:TeamRubber){
  event.ties[index].results.push(result);
  const played=new Set([...result.home,...result.away]);
  for(const t of event.teams)t.members=t.members.map(p=>played.has(p.id)?{...result.individuals.find(m=>m.id===p.id)!}:p) as [TeamMember,TeamMember];
 }
 function decide(index:number){const t=event.ties[index],wins=t.results.filter(r=>r.score[0]>r.score[1]).length,losses=t.results.length-wins;if(wins===2||losses===2)t.winner=wins===2?t.home:t.away;}
 function cpuTie(index:number){append(index,simulateTeamRubber(s,event,index,0));append(index,simulateTeamRubber(s,event,index,1));decide(index);if(event.ties[index].winner===undefined){append(index,simulateTeamRubber(s,event,index,2));decide(index);}}
 const tie=event.ties[ctx.tie];append(ctx.tie,teamRubber(live));
 if(tie.results.length===1)append(ctx.tie,simulateTeamRubber(s,event,ctx.tie,1));
 decide(ctx.tie);
 if(ctx.tie===0&&tie.winner!==undefined){
  cpuTie(1);
  event.ties.push({home:tie.winner,away:event.ties[1].winner!,results:[]});
  if(tie.winner!==0)cpuTie(2);
 }
 const final=event.ties[2];
 if(final?.winner!==undefined){event={...event,playerAwards:Object.fromEntries(event.teams.flatMap((t,i)=>t.members.map(p=>[p.id,i===final.winner?e.winnerShare:i===final.home||i===final.away?e.runnerUpShare:0]))),status:'completed',settled:true,champion:event.teams[final.winner].name,award:final.winner===0?e.winnerShare:final.home===0||final.away===0?e.runnerUpShare:0};}
 const partner=e.teams[0].members[1].id,old=l.partnerships[partner]??{trust:50,familiarity:0,matches:0};
 const own=ctx.members.find(p=>p.id===s.player.id);
 let next=putLife({...s,liveMatch:null,player:{...s.player,fatigue:own?.fatigue??s.player.fatigue,confidence:own?.confidence??s.player.confidence}},{...l,teams:l.teams.map(t=>t.id===e.id?event:t),partnerships:{...l.partnerships,[partner]:{trust:Math.min(80,old.trust+1),familiarity:Math.min(100,old.familiarity+3),matches:old.matches+1}}});
 if(event.status==='completed'&&!lifeOf(next).interviews.some(i=>i.eventId===e.id)){
  const interview={id:'interview:'+e.id,eventId:e.id,title:'After the team event',opponentId:event.teams[final?.home===0?final.away:1].members[0].id,context:`${event.champion} won ${e.name}. You partnered ${e.teams[0].members[1].name}.`,created:s.currentDate,deadline:plusDays(s.currentDate,3)};
  next=putLife(next,{...lifeOf(next),interviews:[interview,...lifeOf(next).interviews].slice(0,100)});
  next=careerMessage(next,interview.id,interview.title,interview.context+' Optional interview; silence declines without penalty.');
 }
 if(event.status==='completed'){next=settleLifeMoney(next,e.id+':award',event.award??0,e.name+' · player award share');next=storyStep(next,e.id,`${event.champion} won. Your award share £${event.award}. Team trophies and doubles results are separate from singles titles and ranking earnings.`,true);}
 return {...next,lastAction:`${e.name}: ${live.playerFrames}–${live.opponentFrames}. ${tie.winner===undefined?'Tie level: deciding doubles next.':event.status==='completed'?'Team event complete.':'Semi-final settled; final on '+e.end+'.'}`};
}
