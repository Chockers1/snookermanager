import fs from 'node:fs';
import path from 'node:path';
import {startLiveMatchState, playOutLiveFrame, finalizeLiveMatch, type GameState} from '../src/hooks/useGameState';
import {pendingMatchBreak,resolveSessionBreak} from '../src/game/realism/sessions';
let previousTime=Date.now();
/** Read-only annual evidence, separate from the game and its balancing rules. */
export function recordCenturyAudit(directory:string, opening:GameState, closing:GameState, next:GameState){
 fs.mkdirSync(directory,{recursive:true});
 const l=next.careerDepth?.seasonLife,teams=l?.teams.filter(e=>e.season===opening.season)??[];
 const rows=next.finance.ledger.filter(r=>r.date>=opening.currentDate&&r.date<next.currentDate);
 const ids=new Set<string>(),duplicates:string[]=[];for(const r of next.finance.ledger){if(ids.has(r.id))duplicates.push(r.id);ids.add(r.id);}
 const flagged:{kind:string;detail:string}[]=[];
 if(duplicates.length)flagged.push({kind:'duplicate-ledger-id',detail:duplicates.slice(0,20).join(', ')});
 if(teams.filter(t=>t.accepted).length>2)flagged.push({kind:'team-season-cap',detail:opening.season});
 for(const e of teams){
  const people=e.teams.flatMap(t=>t.members.map(p=>p.id));if(new Set(people).size!==8)flagged.push({kind:'team-field-identity',detail:e.id});
  if(opening.careerSystems.lateCareer.retired&&e.accepted)flagged.push({kind:'retired-human-team-entry',detail:e.name+' '+e.start});
  for(const t of e.ties){for(const r of t.results){if(Math.max(...r.score)!==2||Math.min(...r.score)>1)flagged.push({kind:'team-rubber-format',detail:r.id});if(r.frames.length!==r.score[0]+r.score[1])flagged.push({kind:'team-frame-count',detail:r.id});}
   if(t.results.length===3&&t.results[2].kind!=='doubles')flagged.push({kind:'team-decider-type',detail:e.id});
   if(t.results.length===3&&((t.results[0].score[0]>t.results[0].score[1])===(t.results[1].score[0]>t.results[1].score[1])))flagged.push({kind:'unnecessary-doubles',detail:e.id});
  }
  if(e.status==='completed'&&Object.values(e.playerAwards??{}).filter(v=>v===e.winnerShare).length!==2)flagged.push({kind:'team-winner-share',detail:e.id});
 }
 for(const [id,r]of Object.entries(l?.staff??{})){
  if(r.notice&&Date.parse(r.notice.deadline)-Date.parse(r.notice.date)<14*86400000)flagged.push({kind:'staff-notice-short',detail:id});
  if(r.employer&&(r.employedUntil??'')>next.currentDate&&next.coachContracts.some(c=>c.coachId===id))flagged.push({kind:'double-coach-employment',detail:id});
 }
 const now=Date.now();const data={season:opening.season,from:opening.currentDate,to:next.currentDate,seconds:(now-previousTime)/1000,heapMb:Math.round(process.memoryUsage().heapUsed/1048576),human:{name:next.player.fullName,age:next.player.age,retired:next.careerSystems.lateCareer.retired,attributes:next.attributes,cash:next.player.cash,fatigue:next.player.fatigue,confidence:next.player.confidence,health:next.trainingCondition,legacy:next.history.legacy,card:next.careerSystems.pro},ledger:{rows:rows.length,duplicates:duplicates.length,income:rows.filter(r=>r.type==='Income').reduce((n,r)=>n+r.amount,0),expenses:rows.filter(r=>r.type==='Expense').reduce((n,r)=>n+r.amount,0),byCategory:Object.fromEntries([...new Set(rows.map(r=>r.category))].map(k=>[k,rows.filter(r=>r.category===k).reduce((n,r)=>n+(r.type==='Income'?r.amount:-r.amount),0)]))},sponsors:next.sponsors,contracts:next.coachContracts,seasonLife:l,teamsThisSeason:teams,flags:flagged,closingMatchCount:closing.matches.length};
 fs.writeFileSync(path.join(directory,opening.season.replace('/','-')+'.json'),JSON.stringify(data));previousTime=now;
}

/** Exercise the normal Match Centre frame/visit engine, with neutral automatic choices. */
export function playCenturyMatch(state:GameState,tournamentId:string):GameState {
 const started=startLiveMatchState(state,tournamentId);let live=started.liveMatch;
 if(!live||live.status!=='In Progress')return started;
 for(let frames=0;frames<300&&live.status==='In Progress';frames++)live=pendingMatchBreak(live)?resolveSessionBreak(live,'recover'):playOutLiveFrame(live,'simulated');
 if(live.status!=='Completed')throw new Error('Century audit: live match did not complete for '+tournamentId);
 return finalizeLiveMatch({...started,liveMatch:live},live);
}
