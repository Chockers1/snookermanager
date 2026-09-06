import fs from 'node:fs';
import path from 'node:path';
import { createStarterState, processRankingCalendar, advanceWeekState, startNextSeasonState } from '../src/hooks/useGameState';
import { recordWorldAudit } from './worldAuditRecorder';
import { pathwayCardAwards } from '../src/game/pathwayRules';
const years=Number(process.argv.find(a=>a.startsWith('--years='))?.split('=')[1]??50);
const seed=20260906;let rng=seed;Math.random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
const directory=path.resolve(process.argv.find(a=>a.startsWith('--output='))?.slice('--output='.length) ?? 'artifacts/simulations/world-integrity-'+years+'-years-seed-'+seed);
fs.mkdirSync(directory,{recursive:true});
let state=createStarterState();
const results=[];
for(let i=0;i<years;i++) {
 const opening=state,year=Number(state.season.slice(0,4))+1;
 state={...state,tournaments:state.tournaments.map(t=>({...t,status:'Skipped' as const})),currentDate:year+'-06-29',careerDepth:{...state.careerDepth!,nextSettlementDate:year+'-07-02',stories:[]}};
 const closing=processRankingCalendar(state), awards=pathwayCardAwards(closing);
 const next=advanceWeekState(closing);
 if(next.season===opening.season)throw new Error('Rollover stalled: '+next.lastAction);
 recordWorldAudit(directory,opening,closing,next);
 const events=Object.values(next.rollingRankings!.events).filter(e=>e.season===opening.season);
 const missing=opening.tournaments.filter(t=>!events.some(e=>e.tournamentId===t.id));
 const unknown=[...new Set(events.flatMap(e=>e.bracket.flatMap(r=>r.matches.flatMap(m=>[m.top.name,m.bottom.name]))))].filter(n=>n!=='TBD'&&!next.worldPlayers.some(p=>p.playerName===n));
 const lost=[...awards.keys()].filter(n=>n!==state.player.fullName&&!next.worldPlayers.find(p=>p.playerName===n)?.hasTourCard);
 const cards=next.worldPlayers.filter(p=>p.hasTourCard).length;
 const badStats=next.worldPlayers.filter(p=>p.totalMatches<p.wins+p.losses||p.seasons.some(s=>s.matches<s.wins+s.losses)).length;
 const summary={season:opening.season,events:events.length,missing:missing.map(t=>t.name),unknown,lost,cards,badStats};results.push(summary);console.log(JSON.stringify(summary));
 fs.writeFileSync(path.join(directory,'checks.json'),JSON.stringify(results,null,2));
 state=startNextSeasonState(next);
}
