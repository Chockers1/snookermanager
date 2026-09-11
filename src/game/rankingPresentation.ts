import type {GameState} from '../hooks/useGameState';
import type {RankingTableKey} from '../utils/rankingProjections';
import {pathwayStandings} from './pathwayRules';

export function currentRankingTab(state: GameState): RankingTableKey {
 const label=state.player.rankingLabel.toLowerCase();
 if(label.includes('youth'))return 'youth';
 if(label.includes('q school'))return 'qSchool';
 if(label.includes('q tour'))return 'qTour';
 if(label.includes('senior'))return 'senior';
 if(label.includes('amateur'))return 'amateur';
 return 'world';
}
/** Seeding records remain available to gameplay; they are not earned standings. */
export function rankingRoster(state:GameState,key:RankingTableKey){
 const players=new Map(state.worldPlayers.map(p=>[p.playerName,p]));
 const seeded = state.competitionTables[key];
 // Youth eligibility overlaps amateur/Q Tour participation; a seed table is not a membership register.
 const seededNames = new Set(seeded.map(row => row.playerName));
 const roster: typeof seeded = key === 'youth' ? [...seeded, ...state.worldPlayers.filter(p => !seededNames.has(p.playerName)).map((p, index) => ({ id: p.id, playerName: p.playerName, nation: p.nation, ranking: seeded.length + index + 1, movement: 0, points: 0, prizeMoney: 0, eventsPlayed: 0, titles: 0, wins: 0, losses: 0 }))] : seeded;
 return roster.filter(row=>{
  const p=players.get(row.playerName),human=row.playerName===state.player.fullName;
  if(!human&&!p)return false;
  const age=human?state.player.age:p!.age,card=human?state.careerSystems.pro.hasTourCard:p!.hasTourCard;
  if(human?state.careerSystems.lateCareer.retired:p!.retired)return false;
  if(key==='youth')return age<21&&!card;
  if(key==='senior')return age>=40;
  if(['amateur','qTour','qSchool'].includes(key))return !card;
  return true;
 }).map(row=>({...row,movement:0,points:0,prizeMoney:0,eventsPlayed:0,wins:0,losses:0,titles:0}));
}
export function currentPublishedRanking(state:GameState){
 const key=currentRankingTab(state),name=state.player.fullName;
 const lists=key==='qTour'?['Europe','Asia Pacific','Middle East','Americas'] as const:key==='qSchool'?['Q School UK','Q School Asia'] as const:key==='senior'?['Senior'] as const:[];
 if(lists.length){
  for(const list of lists){const rows=pathwayStandings(state,list,state.currentDate,key==='senior');const index=rows.findIndex(row=>row.name===name);if(index>=0)return {ranking:index+1,movement:0};}
  return undefined;
 }
 return state.competitionTables[key].find(row=>row.playerName===name&&(!['youth','amateur'].includes(key)||row.eventsPlayed>0));
}
