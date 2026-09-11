import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {advanceWeekState,repairGameState,startNextSeasonState,type GameState} from '../src/hooks/useGameState';
import {careerDepthAction} from '../src/game/careerDepth';
import {pendingStory} from '../src/game/careerDepth/shared';
import {seasonLifeAction} from '../src/game/seasonLife';
import {lifeOf} from '../src/game/seasonLife/shared';
import {recordWorldAudit} from './worldAuditRecorder';
import {recordCenturyAudit,playCenturyMatch} from './centuryAuditRecorder';
const source=process.argv[2],directory=process.argv[3];if(!source||!directory)throw Error('Supply original stopped save and output directory');
fs.mkdirSync(directory,{recursive:true});
const raw=fs.readFileSync(source,'utf8');const hash=(x:string)=>crypto.createHash('sha256').update(x).digest('hex');
let randomState=104729;Math.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
let state=repairGameState(JSON.parse(raw) as GameState),opening=state;const initialCash=state.player.cash;
const manifest={source,sourceSha256:hash(raw),startDate:state.currentDate,completedOriginalSeasons:68,targetTotalSeasons:100,randomReseed:104729,reason:'Original failed run did not preserve terminal RNG state. Preserve its world and recorded results; explicitly reseed only future play.',policy:'Finish the existing seniors entry through Match Centre. No new human entries after retirement. Resolve mandatory career decisions conservatively; decline optional invitations and staff requests. Advance with public weekly and season actions.',startedAt:new Date().toISOString()};
fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2));
let completed=68,stalled=0,steps=0;const outcomes:unknown[]=[];const started=Date.now();
try {
 while(completed<100&&steps++<15000){
  const before=state;
  const waiting=pendingStory(state);if(waiting)state=careerDepthAction(state,{type:'decision',id:waiting.id,choice:waiting.kind==='deciders'||waiting.kind==='early-exits'?'continue':'protect'});
  if(state.seasonReview?.pending)state=startNextSeasonState(state);
  for(const [id,r] of Object.entries(lifeOf(state).staff))if(r.notice&&!r.notice.choice)state=seasonLifeAction(state,{type:'life-staff',id,choice:'decline'});
  for(const e of lifeOf(state).teams)if(e.status==='invited')state=seasonLifeAction(state,{type:'life-team',id:e.id,choice:'decline'});
  const entered=state.tournaments.find(t=>t.status==='Entered');
  if(entered){const oldId=state.matches[0]?.id;state=playCenturyMatch(state,entered.id);if(state.matches[0]?.id===oldId)throw Error('Existing event cannot finish: '+state.lastAction);outcomes.push({event:entered.name,date:state.currentDate,result:state.lastAction});continue;}
  const closing=state;state=advanceWeekState(state);
  if(!state.careerSystems.lateCareer.retired)throw Error('Retirement was lost');
  if(state.careerDepth?.seasonLife?.teams.some(e=>e.accepted&&e.accepted>=manifest.startDate))throw Error('New retired team participation');
  if(state.season!==closing.season){
   recordWorldAudit(path.join(directory,'world'),opening,closing,state);recordCenturyAudit(path.join(directory,'life'),opening,closing,state);
   completed++;opening=state;
   fs.writeFileSync(path.join(directory,'progress.json'),JSON.stringify({completed,steps,date:state.currentDate,seconds:(Date.now()-started)/1000,randomState}));
   console.log(JSON.stringify({completed,date:state.currentDate,retired:state.careerSystems.lateCareer.retired,seconds:(Date.now()-started)/1000}));
   if(completed%10===0){fs.writeFileSync(path.join(directory,'checkpoint-'+completed+'.json'),JSON.stringify(state));fs.writeFileSync(path.join(directory,'checkpoint-'+completed+'-rng.json'),JSON.stringify({randomState}));}
  }
  stalled=state.currentDate===before.currentDate&&state.season===before.season?stalled+1:0;
  if(stalled>=3)throw Error('Calendar stalled: '+state.currentDate+' '+state.lastAction);
 }
 if(completed!==100)throw Error('Step bound reached');
 fs.writeFileSync(path.join(directory,'final-save.json'),JSON.stringify(state));
 fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify({complete:true,completed,steps,date:state.currentDate,initialCash,finalCash:state.player.cash,randomState,outcomes,seconds:(Date.now()-started)/1000,sourceUnchanged:hash(fs.readFileSync(source,'utf8'))===manifest.sourceSha256},null,2));
}catch(error){fs.writeFileSync(path.join(directory,'failure-save.json'),JSON.stringify(state));fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify({complete:false,completed,steps,date:state.currentDate,randomState,error:String(error)},null,2));throw error;}
