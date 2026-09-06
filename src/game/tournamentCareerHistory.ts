import { tournamentCatalog } from '../data/gameContent';
import type { GameState } from '../hooks/useGameState';
import type { InboxMessage, Tournament } from '../types/game';
import { isNonCompetitiveTournamentResult } from '../utils/canonicalTournamentResult';

export type TournamentArchiveEntry = GameState['history']['tournamentHistory'][number];
export type TournamentIdentity = { id: string; name: string; eventType: TournamentArchiveEntry['eventType']; circuit: string };
export type TournamentEditionSummary = { season: string; date: string; finish: string; played: boolean; matches: number; wins: number; losses: number; draws: number; prize: number | null; highestBreak: number | null; centuries: number | null; lastOpponent?: string; lastScore?: string };
export type TournamentBriefing = { tournament: TournamentIdentity; season: string; startDate: string; previousSeason: string; previous?: TournamentEditionSummary; lastAppearance?: TournamentEditionSummary; best?: TournamentEditionSummary; appearances: number };
const nameKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
export function eventIdentity(t: Tournament): TournamentIdentity { return { id: t.id, name: t.name, eventType: t.eventClass ?? t.type, circuit: t.tourCircuit ?? t.eventClass ?? t.type }; }
function archivedIdentity(e: TournamentArchiveEntry): TournamentIdentity { return { id:e.tournamentId, name:e.tournamentName, eventType:e.eventType, circuit:e.tourCircuit || e.eventType || 'Other' }; }
export function sameCareerTournament(entry: TournamentArchiveEntry, event: TournamentIdentity) {
  // Exact names can bridge changed IDs. Never use substring matching: qualifiers
  // and similarly named youth/senior events are distinct competitions.
  return entry.tournamentId === event.id || (nameKey(entry.tournamentName) === nameKey(event.name) && entry.eventType === event.eventType);
}
export function tournamentHistoryOptions(state: GameState): TournamentIdentity[] {
  const options = state.tournaments.map(eventIdentity);
  for (const entry of state.history.tournamentHistory) if (!options.some(t => sameCareerTournament(entry,t))) options.push(archivedIdentity(entry));
  return options.sort((a,b) => a.name.localeCompare(b.name) || a.circuit.localeCompare(b.circuit));
}
export function tournamentCareerEditions(state: GameState, event: TournamentIdentity) {
  const unique = new Map<string,TournamentArchiveEntry>();
  for (const entry of state.history.tournamentHistory.filter(e => sameCareerTournament(e,event))) {
    const key = entry.season + ':' + entry.startDate;
    const existing = unique.get(key);
    if (!existing || (entry.roundResults?.length ?? entry.matchesPlayed) > (existing.roundResults?.length ?? existing.matchesPlayed)) unique.set(key,entry);
  }
  return [...unique.values()].sort((a,b) => b.startDate.localeCompare(a.startDate) || b.season.localeCompare(a.season));
}
export function tournamentRoundHistory(state: GameState, entry: TournamentArchiveEntry) {
  if (entry.roundResults?.length) return entry.roundResults.map(r => ({ round:r.round, opponent:r.opponentName, result:r.result, score:r.playerFrames+'–'+r.opponentFrames }));
  const bracketRounds = (entry.bracket ?? []).flatMap(round=>round.matches.flatMap(match=>{
    const player = match.top.name===state.player.fullName ? match.top : match.bottom.name===state.player.fullName ? match.bottom : null;
    if(!player) return [];
    const opponent = player===match.top ? match.bottom : match.top;
    if(typeof player.score!=='number' || typeof opponent.score!=='number' || match.placeholder) return [];
    return [{round:round.label,opponent:opponent.name,result:player.score>opponent.score?'Won':player.score<opponent.score?'Lost':'Drawn',score:player.score+'–'+opponent.score}];
  }));
  if(bracketRounds.length) return bracketRounds;
  const log = state.history.matchLog.filter(m => m.season === entry.season && m.tournamentId === entry.tournamentId && m.date >= entry.startDate && (!entry.endDate || m.date <= entry.endDate)).sort((a,b) => a.date.localeCompare(b.date));
  if (log.length) return log.map(m => ({round:m.round,opponent:m.opponentName,result:m.result,score:m.score}));
  return entry.rounds.map(text => { const [round,details=''] = text.split(':'); const result = /^(Won|Lost|Drawn)\s+(\d+[-–]\d+)/i.exec(details.trim()); return {round,opponent:'Not recorded',result:result?.[1] ?? details.trim(),score:result?.[2] ?? ''}; });
}
export function tournamentEditionSummary(state: GameState, entry: TournamentArchiveEntry): TournamentEditionSummary {
  const rounds = tournamentRoundHistory(state,entry);
  const complete = Boolean(entry.roundResults?.length);
  const wins = complete ? rounds.filter(r=>r.result==='Won').length : Math.max(entry.wins,rounds.filter(r=>r.result==='Won').length);
  const losses = complete ? rounds.filter(r=>r.result==='Lost').length : Math.max(entry.losses,rounds.filter(r=>r.result==='Lost').length);
  const draws = rounds.filter(r=>r.result==='Drawn').length;
  const matches = complete ? rounds.length : Math.max(entry.matchesPlayed,wins+losses+draws,rounds.length);
  const last = rounds.at(-1);
  return { season:entry.season,date:entry.startDate,finish:entry.result || entry.status,played:entry.status!=='Skipped' && entry.status!=='High Cost' && (matches>0 || entry.status==='Completed' && !isNonCompetitiveTournamentResult(entry.result)),matches,wins,losses,draws,prize:entry.recoveredFromLedger && !entry.recoveredFromLedger.prizeKnown ? null : entry.prizeMoney,highestBreak:entry.recoveredFromLedger ? null : entry.highestBreak,centuries:entry.recoveredFromLedger ? null : entry.centuries,...(last && last.opponent!=='Not recorded' ? {lastOpponent:last.opponent,lastScore:last.score} : {}) };
}
function finishOrder(finish: string) {
  if (/winner|champion|^qualified$|tour card secured/i.test(finish)) return 1000;
  if (/semi.?final/i.test(finish)) return 800;
  if (/quarter.?final/i.test(finish)) return 700;
  if (/\bfinal\b|runner.?up/i.test(finish)) return 900;
  const last = /last (\d+)/i.exec(finish); if(last) return 600 - Number(last[1]);
  const stage = /stage (one|two|three|\d+)|round (\d+)/i.exec(finish);
  return stage ? ({one:1,two:2,three:3}[stage[1] as 'one'|'two'|'three'] ?? Number(stage[1] ?? stage[2])) : 0;
}
export function bestTournamentEdition(editions: TournamentEditionSummary[]) {
  return editions.filter(e=>e.played && !/advanced|continues|in progress|recorded through/i.test(e.finish)).sort((a,b)=>finishOrder(b.finish)-finishOrder(a.finish) || b.wins-a.wins || b.date.localeCompare(a.date))[0];
}
export function createTournamentBriefing(state: GameState, tournament: Tournament, season=state.season): TournamentBriefing {
  const identity = eventIdentity(tournament);
  // Exclude this edition and all future data, even when an old email is viewed.
  const previous = tournamentCareerEditions(state,identity).filter(e=>e.season < season && e.startDate < tournament.startDate).map(e=>tournamentEditionSummary(state,e));
  const year=Number(season.slice(0,4)); const previousSeason=(year-1)+'/'+String(year).slice(-2);
  return {tournament:identity,season,startDate:tournament.startDate,previousSeason,previous:previous.find(e=>e.season===previousSeason),lastAppearance:previous.find(e=>e.played),best:bestTournamentEdition(previous),appearances:previous.filter(e=>e.played).length};
}
export function tournamentMessageEvents(state: GameState, message: InboxMessage): Tournament[] {
  if (message.tournamentReference) return state.tournaments.filter(t=>t.id===message.tournamentReference!.id && t.startDate===message.tournamentReference!.startDate);
  return state.tournaments.filter(t => ['Invitation: '+t.name,'Entered '+t.name,t.name+' travel booked',t.name+' preparation confirmed'].includes(message.subject));
}
export function enrichTournamentMessages(state: GameState): GameState {
  let changed=false;
  const inbox=state.inbox.map(message=>{
    if (message.tournamentBriefings) return message;
    const events=tournamentMessageEvents(state,message);
    if(!events.length) return message;
    changed=true;
    return {...message,tournamentReference:message.tournamentReference ?? {id:events[0].id,startDate:events[0].startDate},tournamentBriefings:events.map(t=>createTournamentBriefing(state,t))};
  });
  return changed ? {...state,inbox} : state;
}
/** Keep every player edition; only the bulky full-field draws have a recent limit. */
export function retainTournamentArchive(entries: TournamentArchiveEntry[]) {
  return entries.map((entry,index)=> index>=240 && entry.bracket && entry.roundResults?.length ? {...entry,bracket:undefined} : entry);
}

/** Restore missing personal editions from genuine, completed tour-ledger draws.
 * No simulation is rerun and no cash, ranking earnings or aggregate stats are awarded.
 */
export function recoverTournamentArchive(state: GameState): GameState {
  const recovered: TournamentArchiveEntry[] = [];
  for(const ledger of Object.values(state.rollingRankings?.events ?? {})) {
    if(!ledger.applied || ledger.season >= state.season || ledger.completedOn > state.currentDate) continue;
    const startDate = /:(\d{4}-\d{2}-\d{2})$/.exec(ledger.key)?.[1];
    if(!startDate || state.history.tournamentHistory.some(e=>e.tournamentId===ledger.tournamentId && e.season===ledger.season && e.startDate===startDate)) continue;
    const rounds: NonNullable<TournamentArchiveEntry['roundResults']> = ledger.bracket.flatMap(round=>round.matches.flatMap(match=>{
      const player = match.top.name===state.player.fullName ? match.top : match.bottom.name===state.player.fullName ? match.bottom : null;
      if(!player || !player.highlighted || match.placeholder) return [];
      const opponent = player===match.top ? match.bottom : match.top;
      if(typeof player.score!=='number' || typeof opponent.score!=='number') return [];
      return [{round:round.label,opponentName:opponent.name,result:player.score>opponent.score?'Won' as const:player.score<opponent.score?'Lost' as const:'Drawn' as const,playerFrames:player.score,opponentFrames:opponent.score}];
    }));
    if(!rounds.length) continue;
    const event=state.tournaments.find(t=>t.id===ledger.tournamentId) ?? tournamentCatalog.find(t=>t.id===ledger.tournamentId);
    if(!event) continue;
    const last=rounds.at(-1)!;
    const finish=last.result==='Won' && /^final$/i.test(last.round) ? 'Winner' : last.result==='Lost' && !/group/i.test(last.round) ? 'Lost in '+last.round : 'Recorded through '+last.round;
    const earning=state.rollingRankings?.earnings.find(e=>e.eventKey===ledger.key && e.playerName===state.player.fullName && !e.estimated);
    recovered.push({id:ledger.season+'-'+ledger.tournamentId,season:ledger.season,tournamentId:ledger.tournamentId,tournamentName:ledger.name,eventType:event.eventClass??event.type,tourCircuit:event.tourCircuit??event.type,stageId:event.stageId??null,formatId:event.formatId,location:event.location,startDate,endDate:ledger.completedOn,status:'Completed',result:finish,rounds:rounds.map(r=>r.round+': '+r.result+' '+r.playerFrames+'-'+r.opponentFrames),roundResults:rounds,matchesPlayed:rounds.length,wins:rounds.filter(r=>r.result==='Won').length,losses:rounds.filter(r=>r.result==='Lost').length,prizeMoney:earning?.amount??0,rankingPoints:0,highestBreak:0,centuries:0,fatigueChange:0,entryFee:0,bookedTravelCost:0,recoveredFromLedger:{prizeKnown:Boolean(earning)}});
  }
  if(!recovered.length) return state;
  return {...state,history:{...state.history,tournamentHistory:retainTournamentArchive([...state.history.tournamentHistory,...recovered].sort((a,b)=>b.startDate.localeCompare(a.startDate)))}};
}
