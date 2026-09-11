import {beforeAll,describe,expect,it,vi} from 'vitest';
import {createStarterState,processRankingCalendar,evolveWorldPlayersForNextSeason,finishSeasonState,startNextSeasonState,type GameState} from '../hooks/useGameState';
import {pathwayCardAwards,pathwayStandings,qTourQualification} from './pathwayRules';
import {qualifiedNames} from './rollingRankings';
let season:GameState;
beforeAll(()=>{
 let seed=20260908;const random=vi.spyOn(Math,'random').mockImplementation(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});
 try {
  const state=createStarterState();state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));
  season=processRankingCalendar({...state,currentDate:'2027-06-30'});
 } finally {random.mockRestore();}
},60000);
describe('complete-season promotion routes',()=>{
 it('carries automatic, all playoff sections, both Q Schools and federation awards into a unique 128-player tour',()=>{
  const cards=pathwayCardAwards(season),qualification=qTourQualification(season);
  expect(qualification.automatic).toBeTruthy();expect(cards.get(qualification.automatic!)).toBe('Q Tour');
  for(const region of ['Asia Pacific','Middle East','Americas'] as const){
   const rows=pathwayStandings(season,region);expect(rows.length).toBeGreaterThan(2);
  }
  const playoff=Object.values(season.rollingRankings!.events).find(e=>/Q Tour.*Play-Off/i.test(e.name))!;
  expect(qualifiedNames(playoff.bracket)).toHaveLength(3);
  for(const name of qualifiedNames(playoff.bracket))expect(cards.get(name)).toBe('Q Tour');
  for(const region of ['UK / Europe','Asia-Oceania']){
   const events=Object.values(season.rollingRankings!.events).filter(e=>e.name.includes(region)&&/Q School Event/.test(e.name));
   expect(events).toHaveLength(2);
   const winners=events.flatMap(e=>qualifiedNames(e.bracket));
   expect(winners).toHaveLength(region==='UK / Europe'?8:4);expect(new Set(winners).size).toBe(winners.length);
   for(const name of winners)expect(cards.get(name),name).toBe('Q School');
  }
  expect([...cards.values()]).toContain('Federation Route');
  const evolved=evolveWorldPlayersForNextSeason(season.worldPlayers,season.competitionTables,{...season.player,age:season.player.age+1},season.careerSystems.pro.hasTourCard,season.careerSystems.pro,2027,cards);
  for(const [name,source] of cards)expect(evolved.find(p=>p.playerName===name),name).toMatchObject({hasTourCard:true,cardSource:source,yearsRemaining:2});
  const cardHolders=evolved.filter(p=>p.hasTourCard&&!p.retired);
  expect(new Set(cardHolders.map(p=>p.id)).size).toBe(cardHolders.length);expect(cardHolders.length).toBeLessThanOrEqual(128);
 },60000);
 for(const route of ['automatic','playoff','school','federation'] as const)it('restores a human '+route+' card from the published ledger when older summary records are absent',()=>{
  const awards=pathwayCardAwards(season);const automatic=qTourQualification(season).automatic!;
  const winner=route==='automatic'?automatic:route==='playoff'?[...awards].find(([name,source])=>source==='Q Tour'&&name!==automatic)![0]:[...awards].find(([,source])=>source===(route==='school'?'Q School':'Federation Route'))![0];
  const state=structuredClone(season);state.player.fullName=winner;state.player.worldRanking=999;state.player.careerStage='Amateur';
  state.careerSystems.pro={...state.careerSystems.pro,hasTourCard:false,worldRank:999,yearsRemaining:0};
  state.worldPlayers=state.worldPlayers.filter(p=>p.playerName!==winner);
  state.competitionTables.world=state.competitionTables.world.filter(p=>p.playerName!==winner);
  state.history.tournamentHistory=[];state.inbox=[];state.seasonReview=null;
  const next=startNextSeasonState(finishSeasonState(state));
  expect(next.season).toBe('2027/28');expect(next.careerSystems.pro.hasTourCard,winner+' '+route).toBe(true);
  expect(next.careerSystems.pro.yearsRemaining).toBe(2);
 },60000);
});
