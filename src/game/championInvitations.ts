import type { GameState } from '../hooks/useGameState';
import type { Tournament } from '../types/game';
import { indexedEvents } from './resultIndex';
import { rankingCutoffDate, rankingEventKey, shiftYears, qualifiedNames } from './rollingRankings';

type SelectionState = Pick<GameState,'player'|'careerSystems'|'competitionTables'|'history'> & Partial<Pick<GameState,'rollingRankings'|'currentDate'|'worldPlayers'>>;
export function championInvitations(state: SelectionState, event: Tournament, includeHuman = true) {
  const cutoff=rankingCutoffDate(event);
  const through=state.currentDate && state.currentDate<cutoff ? state.currentDate : cutoff;
  const from=shiftYears(cutoff,-1);
  const ranks=state.rollingRankings?.seedings[rankingEventKey(event)]?.world;
  const roster=new Map((state.worldPlayers??[]).map(p=>[p.playerName,p]));
  const active=(name:string)=>name===state.player.fullName ? includeHuman&&!state.careerSystems.lateCareer.retired : !!roster.get(name)&&!roster.get(name)!.retired;
  const priority=(name:string)=>/^world championship$/i.test(name)?0:/^uk championship$/i.test(name)?1:/^masters$/i.test(name)?2:/^champion of champions$/i.test(name)?3:4;
  const qualifying=indexedEvents(state.rollingRankings).filter(e=>e.completedOn>=from&&e.completedOn<=through&&['Professional','Major','Invitational'].includes(e.eventType??'')&&!/qualif|play.off/i.test(e.name))
    .sort((a,b)=>priority(a.name)-priority(b.name)||b.completedOn.localeCompare(a.completedOn));
  const selected=new Set<string>();
  for(const e of qualifying) for(const name of qualifiedNames(e.bracket)) if(active(name)) selected.add(name);
  // A legacy save can still prove a dated human singles title without a CPU ledger.
  for(const trophy of state.history.legacy?.trophies??[]) {
    // A recorded event is authoritative, including its publication date and category.
    if(state.rollingRankings?.events[`${trophy.tournamentId}:${trophy.date}`]) continue;
    if(trophy.date>=from&&trophy.date<=through&&['Professional','Major','Invitational'].includes(trophy.category)&&! /qualif|play.off/i.test(trophy.name)&&active(state.player.fullName)) selected.add(state.player.fullName);
  }
  const names=[...selected].slice(0,16);
  const rows=[...state.competitionTables.world].sort((a,b)=>(ranks?.[a.playerName]??a.ranking)-(ranks?.[b.playerName]??b.ranking));
  for(const row of rows) {
    if(names.length>=16) break;
    const card=row.playerName===state.player.fullName ? state.careerSystems.pro.hasTourCard : roster.get(row.playerName)?.hasTourCard;
    if(card&&active(row.playerName)&&!names.includes(row.playerName)) names.push(row.playerName);
  }
  return {names,from,through,cutoff};
}
