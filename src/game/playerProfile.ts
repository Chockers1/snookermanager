import type { GameState } from '../hooks/useGameState';
import { scoutingReport } from './realism/scouting';
export function resolveProfilePlayer(state: GameState, idOrName: string) {
 const byId=state.worldPlayers.find(p=>p.id===idOrName);if(byId)return byId;
 const names=state.worldPlayers.filter(p=>p.playerName===idOrName);return names.length===1?names[0]:undefined;
}
export function playerEventHistory(state: GameState, name: string) {
 return Object.values(state.rollingRankings?.events??{}).filter(e=>e.completedOn<=state.currentDate&&e.applied).flatMap(e=>{
  const matches=e.bracket.flatMap(round=>round.matches.filter(m=>!m.placeholder&&[m.top.name,m.bottom.name].includes(name)&&typeof m.top.score==='number'&&typeof m.bottom.score==='number').map(m=>{const own=m.top.name===name?m.top:m.bottom,other=m.top.name===name?m.bottom:m.top;return {id:e.key+':'+m.id,round:round.label,opponent:other.name,score:own.score+'–'+other.score,result:own.score===other.score?'Drawn':own.score!>other.score!?'Won':'Lost'};}));
  const archived=e.outcomes?.find(o=>o.player===name);if(!matches.length&&!archived)return [];
  const last=matches.at(-1);const type=e.eventType??state.history.tournamentHistory.find(h=>h.tournamentId===e.tournamentId&&h.season===e.season)?.eventType??state.tournaments.find(t=>t.id===e.tournamentId)?.type;
  return [{key:e.key,name:e.name,date:e.completedOn,season:e.season,ranking:e.ranking,circuit:type??(e.ranking?'Main tour':'Unrecorded circuit'),prize:e.prizeAwards?.[name],stats:matches.length?{matches:matches.length,wins:matches.filter(m=>m.result==='Won').length,losses:matches.filter(m=>m.result==='Lost').length,draws:matches.filter(m=>m.result==='Drawn').length}:archived?.matches===undefined?undefined:{matches:archived.matches,wins:archived.wins??0,losses:archived.losses??0,draws:archived.draws??0},category:type==='Exhibition'?'Exhibition achievement':type==='Q School'||/qualif|play[ -]?off/i.test(e.name)?'Qualification achievement':e.ranking?'Ranking title':'Non-ranking title',result:archived?.finish??(last?.result==='Won'&&/^final$/i.test(last.round)?'Winner':last?.result==='Lost'?'Lost in '+last.round:'Reached '+last?.round),matches}];
 }).sort((a,b)=>b.date.localeCompare(a.date));
}
export function playerRankingHistory(state: GameState, name: string) {
 const player=resolveProfilePlayer(state,name);
 const archived=(player?.seasons??[]).map(s=>({label:s.season,world:s.worldRank,oneYear:s.oneYearRank})).reverse();
 const live=(state.rollingRankings?.revisions??[]).filter(r=>r.world[name]||r.oneYear[name]).map(r=>({label:r.date,world:r.world[name]??null,oneYear:r.oneYear[name]??null}));
 return [...archived,...live];
}
export function profileScouting(state: GameState, name: string) {
 return scoutingReport(state,name);
}

export const profileRankingColumns = [
 ['world', 'worldRank', 'World'], ['oneYear', 'oneYearRank', 'One-year'],
 ['youth', 'youthRank', 'Youth'], ['amateur', 'amateurRank', 'Amateur'],
 ['qTour', 'qTourRank', 'Q Tour'], ['qSchool', 'qSchoolRank', 'Q School'], ['senior', 'seniorRank', 'Seniors'],
] as const;

/** Combine durable season summaries with published events, never the player's current tour alone. */
export function playerSeasonHistory(state: GameState, name: string, history = playerEventHistory(state, name)) {
 const player = resolveProfilePlayer(state, name);
 const seasons = new Set([...(player?.seasons.map(s=>s.season)??[]), ...history.map(e=>e.season)]);
 if(player && !player.retired) seasons.add(state.season);
 return [...seasons].sort((a,b)=>b.localeCompare(a)).map(season=>{
  const saved = player?.seasons.find(s=>s.season===season);
  const events = history.filter(e=>e.season===season);
  const live = season===state.season && !saved;
  const complete = events.length>0 && events.every(e=>e.stats!==undefined);
  const sum = (key: 'matches'|'wins'|'losses'|'draws') => events.reduce((n,e)=>n+(e.stats?.[key]??0),0);
  const ranks = profileRankingColumns.map(([table,key])=>live?state.competitionTables[table].find(p=>p.playerName===name)?.ranking??null:saved?.[key]??null);
  const trophies = events.filter(e=>e.result==='Winner' && ['Ranking title','Non-ranking title'].includes(e.category)).length;
  return { season, live, ranks, status: saved?.status??(live?player?.tourSurvivalStatus:'Not recorded'),
   matches: saved?.matches??(complete||(live&&!events.length)?sum('matches'):null), wins:saved?.wins??(complete||(live&&!events.length)?sum('wins'):null), losses:saved?.losses??(complete||(live&&!events.length)?sum('losses'):null),
   draws: saved ? (saved as typeof saved & {draws?:number}).draws??null : complete||(live&&!events.length)?sum('draws'):null,
   titles: saved?Math.max(saved.titles,trophies):trophies,
   prize: saved?.prizeMoney??(events.every(e=>e.prize!==undefined)?events.reduce((n,e)=>n+e.prize!,0):null),
   partial: !saved && !complete && events.length>0, events,
  };
 });
}
