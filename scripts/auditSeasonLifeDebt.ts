import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {advanceWeekState,startNextSeasonState,fireCoachState,withdrawTournamentState,type GameState} from '../src/hooks/useGameState';
import {realismAction,realismOf} from '../src/game/realism';
import {careerDepthAction} from '../src/game/careerDepth';
import {depthOf,pendingStory,plusDays} from '../src/game/careerDepth/shared';
const source=process.argv[2];if(!source)throw new Error('Supply the insolvent career snapshot');
const bytes=fs.readFileSync(source),hash=createHash('sha256').update(bytes).digest('hex');let s=JSON.parse(bytes.toString()) as GameState;
const opening={date:s.currentDate,cash:s.player.cash},samples=[];let booked=0;
for(const c of s.coachContracts)s=fireCoachState(s,c.coachId);
for(const e of s.tournaments.filter(t=>t.status==='Entered'))s=withdrawTournamentState(s,e.id);
for(let n=0;n<104&&s.player.cash<0;n++){
 if(s.seasonReview?.pending)s=startNextSeasonState(s);
 if(realismOf(s).location!==realismOf(s).home)s=realismAction(s,{type:'return-home',emergencyCredit:true});
 if(realismOf(s).base!=='club')s=realismAction(s,{type:'base',base:'club',location:realismOf(s).home});
 const story=pendingStory(s);if(story)s=careerDepthAction(s,{type:'decision',id:story.id,choice:story.kind==='deciders'||story.kind==='early-exits'?'continue':'protect'});
 if(!depthOf(s).commitments.some(c=>c.kind==='club-work'&&c.status==='scheduled'))for(let day=1;day<=35;day++){
  const next=careerDepthAction(s,{type:'commitment',kind:'club-work',startDate:plusDays(s.currentDate,day)});
  if(depthOf(next).commitments.length>depthOf(s).commitments.length){s=next;booked++;break;}
 }
 const date=s.currentDate;s=advanceWeekState(s);if(date===s.currentDate)throw new Error(s.lastAction);samples.push({date:s.currentDate,cash:s.player.cash});
}
const report={source,sourceUnchanged:createHash('sha256').update(fs.readFileSync(source)).digest('hex')===hash,policy:'Release staff, withdraw optional entries, return home at the quoted fare if needed, use a free club base and book legal paid club shifts. No cash edits or new sponsors.',opening,closing:{date:s.currentDate,cash:s.player.cash},booked,days:(Date.parse(s.currentDate)-Date.parse(opening.date))/86400000,recovered:s.player.cash>=0,samples};
fs.writeFileSync('artifacts/season-life-debt-recovery.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,samples:undefined}));if(!report.recovered||!report.sourceUnchanged)process.exitCode=1;
