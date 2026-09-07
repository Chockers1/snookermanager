import {describe,it,expect} from 'vitest';
import {createStarterState,rebuildDevelopmentRankings,getTournamentPlacementAwards} from '../hooks/useGameState';
import {recordRankingEvent,initializeRollingRankings} from './rollingRankings';
import type {BracketRound,Tournament} from '../types/game';
const final=(winner:string,loser:string):BracketRound[]=>[{label:'Final',matches:[{id:winner,top:{name:winner,nation:'ENG',rank:1,score:3},bottom:{name:loser,nation:'ENG',rank:2,score:1}}]}];
function fixture(){const state=createStarterState();state.currentDate='2026-09-30';const players=state.worldPlayers.filter(p=>p.playerName!==state.player.fullName).slice(0,4);const event:Tournament={...state.tournaments.find(t=>t.rankingType==='Youth')!,id:'earned-youth',name:'Earned Youth Open',type:'Junior',rankingType:'Youth',rankingValue:100,startDate:'2026-09-01',endDate:'2026-09-03',winnerPrize:25,runnerUpPrize:10};state.tournaments=[event];state.rollingRankings=initializeRollingRankings({...state,rollingRankings:undefined,currentDate:'2026-07-01'}).rollingRankings;state.competitionTables.youth=players.map((p,i)=>({id:p.id,playerName:p.playerName,nation:p.nation,ranking:i+1,movement:0,points:500-i,prizeMoney:99999,eventsPlayed:0,wins:0,losses:0,titles:0}));return {state,players,event};}
describe('earned youth and amateur standings',()=>{
 it('replaces seed values with recorded finish points and keeps finances unchanged',()=>{
  const {state,players,event}=fixture();const recorded=recordRankingEvent(state,event,final(players[0].playerName,players[1].playerName),getTournamentPlacementAwards);
  const cash=recorded.player.cash;const rebuilt=rebuildDevelopmentRankings(recorded);
  expect(rebuilt.competitionTables.youth[0]).toMatchObject({playerName:players[0].playerName,points:100,prizeMoney:25,eventsPlayed:1,titles:1,wins:1});
  expect(rebuilt.competitionTables.youth.find(p=>p.playerName===players[2].playerName)).toMatchObject({points:0,eventsPlayed:0,prizeMoney:0});
  expect(rebuilt.player.cash).toBe(cash);expect(rebuilt.rollingRankings).toBe(recorded.rollingRankings);expect(rebuildDevelopmentRankings(rebuilt).competitionTables).toEqual(rebuilt.competitionTables);
 });
 it('does not award seed, future, previous-season or non-ranking club points',()=>{
  const {state,players,event}=fixture();const recorded=recordRankingEvent(state,{...event,rankingType:'None'},final(players[0].playerName,players[1].playerName),getTournamentPlacementAwards);
  recorded.tournaments=[{...event,rankingType:'None'}];expect(rebuildDevelopmentRankings(recorded).competitionTables.youth.every(r=>r.points===0&&r.eventsPlayed===0)).toBe(true);
  recorded.tournaments=[event];expect(rebuildDevelopmentRankings(recorded,'2026-09-02').competitionTables.youth.every(r=>r.points===0)).toBe(true);
  recorded.season='2027/28';expect(rebuildDevelopmentRankings(recorded).competitionTables.youth.every(r=>r.points===0)).toBe(true);
 });
 it('never uses cash as a tie-break and credits an age-limited amateur event to both pathways',()=>{
  const {state,players,event}=fixture();players[0].playerName='Aaron Test';players[1].playerName='Zane Test';state.competitionTables.youth[0].playerName=players[0].playerName;state.competitionTables.youth[1].playerName=players[1].playerName;let recorded=recordRankingEvent(state,event,final(players[0].playerName,players[2].playerName),getTournamentPlacementAwards);
  const rich={...event,id:'rich-youth',name:'Rich Youth Open',winnerPrize:100000};recorded.tournaments.push(rich);
  recorded=recordRankingEvent(recorded,rich,final(players[1].playerName,players[3].playerName),getTournamentPlacementAwards);
  const ranked=rebuildDevelopmentRankings(recorded).competitionTables.youth;
  expect(ranked.slice(0,2).map(r=>r.playerName)).toEqual([players[0].playerName,players[1].playerName]);expect(ranked[1].prizeMoney).toBe(100000);
  const amateur={...event,id:'amateur-u21',name:'Amateur Under-21 Open',type:'Amateur' as const,rankingType:'Amateur' as const};recorded.tournaments.push(amateur);
  recorded=recordRankingEvent(recorded,amateur,final(players[0].playerName,players[2].playerName),getTournamentPlacementAwards);
  const rebuilt=rebuildDevelopmentRankings(recorded);expect(rebuilt.competitionTables.amateur.find(r=>r.playerName===players[0].playerName)?.points).toBe(100);expect(rebuilt.competitionTables.youth[0].points).toBe(200);
 });
});
