import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {advanceWeekState,startNextSeasonState,type GameState} from '../src/hooks/useGameState';
import {realismAction,realismOf} from '../src/game/realism';
import {careerDepthAction} from '../src/game/careerDepth';
import {depthOf,pendingStory,plusDays} from '../src/game/careerDepth/shared';
const source='artifacts/simulations/15-season-start-age-13-start-regional-youth-middle-support-simulation-seed-204732-gameplay-entry-v2-save.json';
const bytes=fs.readFileSync(source);const hash=createHash('sha256').update(bytes).digest('hex');let state=JSON.parse(bytes.toString()) as GameState;
const opening={date:state.currentDate,cash:state.player.cash};let shiftsBooked=0;const samples=[];
for(let step=0;step<100&&state.player.cash<0;step++){
 if(state.seasonReview?.pending)state=startNextSeasonState(state);
 if(realismOf(state).location!==realismOf(state).home&&!Object.values(realismOf(state).journeys).some(j=>!j.applied))state=realismAction(state,{type:'return-home',emergencyCredit:true});
 const story=pendingStory(state);if(story)state=careerDepthAction(state,{type:'decision',id:story.id,choice:story.kind==='deciders'||story.kind==='early-exits'?'continue':'protect'});
 if(!depthOf(state).commitments.some(c=>c.kind==='club-work'&&c.status==='scheduled'))for(let day=1;day<=28;day++){
  const candidate=careerDepthAction(state,{type:'commitment',kind:'club-work',startDate:plusDays(state.currentDate,day)});
  if(depthOf(candidate).commitments.length>depthOf(state).commitments.length){state=candidate;shiftsBooked++;break}
 }
 const date=state.currentDate;state=advanceWeekState(state);samples.push({date:state.currentDate,cash:state.player.cash});
 if(state.currentDate===date)throw new Error('Recovery blocked: '+state.lastAction);
}
const report={source,policy:'Book the quoted emergency return fare as debt, pause optional entries and training; reserve legal paid club shifts, advance normally, use free conservative story responses. No cash, contracts or expenses were edited.',opening,closing:{date:state.currentDate,cash:state.player.cash},days:(Date.parse(state.currentDate)-Date.parse(opening.date))/86400000,shiftsBooked,recovered:state.player.cash>=0,samples,sourceUnchanged:createHash('sha256').update(fs.readFileSync(source)).digest('hex')===hash};
fs.writeFileSync('artifacts/release-readiness/debt-recovery.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,samples:undefined}));if(!report.recovered||!report.sourceUnchanged)process.exitCode=1;
