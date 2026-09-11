import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {advanceWeekState,startNextSeasonState,fireCoachState,type GameState} from '../src/hooks/useGameState';
import {realismAction,realismOf,overseasWeeklyCost} from '../src/game/realism';
import {careerDepthAction} from '../src/game/careerDepth';
import {depthOf,pendingStory,plusDays} from '../src/game/careerDepth/shared';
const source='artifacts/simulations/15-season-start-age-13-start-regional-youth-middle-support-simulation-seed-204732-gameplay-entry-v2-save.json';
const bytes=fs.readFileSync(source),hash=createHash('sha256').update(bytes).digest('hex');
const reports=[];
for(const scenario of ['no-sponsors','expiring-sponsors','staff-costs','blocked-work-dates']){
 let state=JSON.parse(bytes.toString()) as GameState;state.sponsors=scenario==='expiring-sponsors'?state.sponsors.map(s=>({...s,weeksRemaining:1,renewalStatus:'Declined'})):[];
 if(scenario==='staff-costs')state.coachContracts=[{coachId:state.coaches[0].id,slot:'Lead Coach',contractLabel:'Audit existing contract',contractWeeks:52,weeksRemaining:52,weeklyCost:200,totalCost:10400,startedWeek:state.week}];
 state.careerDepth={...depthOf(state),schedule:null,stories:[],commitments:[]};
 if(scenario==='blocked-work-dates')state.careerDepth.board={priorities:[],blocks:[{id:'protected-audit',start:state.currentDate,end:plusDays(state.currentDate,20),kind:'rest',focus:'stamina'}]};
 const opening={cash:state.player.cash,date:state.currentDate,staff:state.coachContracts.reduce((n,c)=>n+c.weeklyCost,0),sponsors:state.sponsors.length};
 const samples=[];let booked=0,rejectedDates=0,releasedStaff=0;
 for(let step=0;step<104&&state.player.cash<0;step++){
  if(state.seasonReview?.pending)state=startNextSeasonState(state);
  if(step>=2)for(const c of state.coachContracts){state=fireCoachState(state,c.coachId);releasedStaff++;}
  if(realismOf(state).location!==realismOf(state).home&&!Object.values(realismOf(state).journeys).some(j=>!j.applied))state=realismAction(state,{type:'return-home',emergencyCredit:true});
  const story=pendingStory(state);if(story)state=careerDepthAction(state,{type:'decision',id:story.id,choice:story.kind==='deciders'||story.kind==='early-exits'?'continue':'protect'});
  if(!depthOf(state).commitments.some(c=>c.kind==='club-work'&&c.status==='scheduled'))for(let day=1;day<=35;day++){
   const next=careerDepthAction(state,{type:'commitment',kind:'club-work',startDate:plusDays(state.currentDate,day)});
   if(depthOf(next).commitments.length>depthOf(state).commitments.length){state=next;booked++;break;}rejectedDates++;
  }
  const previous=state.currentDate;state=advanceWeekState(state);
  samples.push({date:state.currentDate,cash:state.player.cash,staff:state.coachContracts.length,sponsors:state.sponsors.length,overseasCost:overseasWeeklyCost(state)});
  if(state.currentDate===previous)throw new Error(scenario+': '+state.lastAction);
 }
 const result={scenario,opening,closing:{cash:state.player.cash,date:state.currentDate},days:(Date.parse(state.currentDate)-Date.parse(opening.date))/86400000,booked,rejectedDates,releasedStaff,recovered:state.player.cash>=0,samples};reports.push(result);console.log(JSON.stringify({...result,samples:undefined}));
}
const unchanged=createHash('sha256').update(fs.readFileSync(source)).digest('hex')===hash;
fs.writeFileSync('artifacts/release-readiness-2026-09-08/debt-edges.json',JSON.stringify({source,sourceUnchanged:unchanged,fixture:'Four isolated copies of the previously insolvent 15-season career. Sponsors expire or are absent; one case begins with a £200/week staff contract, another with 21 protected calendar days. No mid-run cash edits.',policy:'Emergency return at quoted fare, no new sponsorship, release staff after two advancement steps, pause optional events/training, book one legal club shift per seven days. Search up to 35 days for free work dates.',reports},null,2));
if(!unchanged||reports.some(r=>!r.recovered))process.exitCode=1;
