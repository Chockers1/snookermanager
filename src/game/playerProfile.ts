import type { GameState } from '../hooks/useGameState';
import { scoutingReport } from './realism/scouting';
export function resolveProfilePlayer(state: GameState, idOrName: string) {
 const byId=state.worldPlayers.find(p=>p.id===idOrName);if(byId)return byId;
 const names=state.worldPlayers.filter(p=>p.playerName===idOrName);return names.length===1?names[0]:undefined;
}
export function playerEventHistory(state: GameState, name: string) {
 return Object.values(state.rollingRankings?.events??{}).filter(e=>e.completedOn<=state.currentDate&&e.applied).flatMap(e=>{
  const matches=e.bracket.flatMap(round=>round.matches.filter(m=>[m.top.name,m.bottom.name].includes(name)&&typeof m.top.score==='number'&&typeof m.bottom.score==='number').map(m=>{const own=m.top.name===name?m.top:m.bottom,other=m.top.name===name?m.bottom:m.top;return {id:e.key+':'+m.id,round:round.label,opponent:other.name,score:own.score+'–'+other.score,result:own.score===other.score?'Drawn':own.score!>other.score!?'Won':'Lost'};}));
  const archived=e.outcomes?.find(o=>o.player===name);if(!matches.length&&!archived)return [];
  const last=matches.at(-1);const type=e.eventType??state.history.tournamentHistory.find(h=>h.tournamentId===e.tournamentId&&h.season===e.season)?.eventType??state.tournaments.find(t=>t.id===e.tournamentId)?.type;
  return [{key:e.key,name:e.name,date:e.completedOn,season:e.season,ranking:e.ranking,category:type==='Exhibition'?'Exhibition achievement':type==='Q School'||/qualif|play[ -]?off/i.test(e.name)?'Qualification achievement':e.ranking?'Ranking title':'Non-ranking title',result:archived?.finish??(last?.result==='Won'&&/^final$/i.test(last.round)?'Winner':last?.result==='Lost'?'Lost in '+last.round:'Reached '+last?.round),matches}];
 }).sort((a,b)=>b.date.localeCompare(a.date));
}
export function playerRankingHistory(state: GameState, name: string) {
 const player=resolveProfilePlayer(state,name);
 const archived=(player?.seasons??[]).map(s=>({label:s.season,world:s.worldRank,oneYear:s.oneYearRank})).reverse();
 const live=(state.rollingRankings?.revisions??[]).filter(r=>r.world[name]||r.oneYear[name]).map(r=>({label:r.date,world:r.world[name]??null,oneYear:r.oneYear[name]??null}));
 return [...archived,...live];
}
export function profileScouting(state: GameState, name: string) {
 const report=scoutingReport(state,name);
 return {...report,ability:report.samples===0?'Not scouted':report.ability};
}
