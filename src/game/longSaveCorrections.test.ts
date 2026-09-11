import {serializeCareerSave} from './asyncSave';
import {describe,it,expect} from 'vitest';
import {createStarterState,getTournamentEntryAccess,buildTournamentDraw} from '../hooks/useGameState';
import {alignMajorSelection,lockTournamentSeedings,rankingEventKey,type RankedEvent} from './rollingRankings';
import {championInvitations} from './championInvitations';
import {pathwayStandings,seniorQualification} from './pathwayRules';

function fixture(){
 const s=createStarterState();s.currentDate='2051-04-03';s.season='2050/51';
 const world=s.tournaments.find(t=>t.formatId==='worldChampionshipMain')!;
 const qual=s.tournaments.find(t=>t.formatId==='worldChampionshipQualifying')!;
 s.tournaments=[{...qual,startDate:'2051-04-07',endDate:'2051-04-16',status:'Available',seedingCutoffDate:undefined},{...world,startDate:'2051-04-18',endDate:'2051-05-04',status:'Available',seedingCutoffDate:undefined}];
 s.careerSystems.pro.hasTourCard=true;
 return s;
}
describe('shared major selection',()=>{
 it.each([13,17])('keeps the route selected at rank %i after a later ranking change',rank=>{
  let s=fixture();s.rollingRankings!.revisions=[{date:'2051-03-31',world:{[s.player.fullName]:rank},oneYear:{}}];s.rollingRankings!.seedings={};
  s=lockTournamentSeedings(s,'2051-04-03');s.currentDate='2051-04-10';s.player.worldRanking=rank===13?17:13;
  s.competitionTables.world=s.competitionTables.world.map(r=>r.playerName===s.player.fullName?{...r,ranking:s.player.worldRanking!}:r);
  const [qual,main]=s.tournaments;expect(qual.seedingCutoffDate).toBe('2051-03-31');expect(main.seedingCutoffDate).toBe(qual.seedingCutoffDate);
  expect(s.rollingRankings!.seedings[rankingEventKey(main)].world[s.player.fullName]).toBe(rank);
  expect(getTournamentEntryAccess(s,main).allowed).toBe(rank<=16);
  // Existing qualifying entry remains on its selected route after its entry deadline.
  expect(getTournamentEntryAccess(s,{...qual,status:'Entered'}).allowed).toBe(rank>16);
 });
 it('repairs mismatched legacy snapshots from the original qualifying selection, idempotently',()=>{
  const s=fixture(),[qual,main]=s.tournaments;
  s.rollingRankings!.seedings={[rankingEventKey(qual)]:{date:'2051-03-31',world:{[s.player.fullName]:13},oneYear:{}},[rankingEventKey(main)]:{date:'2051-04-11',world:{[s.player.fullName]:17},oneYear:{}}};
  const fixed=alignMajorSelection(s);expect(fixed.rollingRankings!.seedings[rankingEventKey(main)].world[s.player.fullName]).toBe(13);expect(alignMajorSelection(fixed)).toBe(fixed);
 });
});
describe('dated Champion of Champions field',()=>{
 it('replaces a non-participating human with the next eligible CPU player',()=>{
  const s=createStarterState(),t=s.tournaments.find(e=>e.formatId==='championOfChampions')!;
  const field=championInvitations(s,t,false).names;
  expect(field).toHaveLength(16);expect(field).not.toContain(s.player.fullName);
  expect(buildTournamentDraw(s,t,'Last 16',false)[0].matches).toHaveLength(8);
 });
 it('rejects a lifetime champion off tour but admits a recent qualifying winner without a card',()=>{
  const s=createStarterState();s.currentDate='2026-11-01';s.careerSystems.pro.hasTourCard=false;
  const event={...s.tournaments.find(t=>t.formatId==='championOfChampions')!,startDate:'2026-11-10',status:'Available' as const};
  const prize={key:'recent',tournamentId:'world',name:'World Championship',season:s.season,completedOn:'2026-05-04',ranking:true,applied:true,eventType:'Major',bracket:[{label:'Final',matches:[{id:'f',top:{name:s.player.fullName,rank:20,score:18},bottom:{name:s.worldPlayers[1].playerName,rank:2,score:10}}]}]} as RankedEvent;
  s.rollingRankings={...s.rollingRankings!,events:{old:{...prize,completedOn:'2020-05-04'}}};
  expect(getTournamentEntryAccess(s,event).allowed).toBe(false);
  s.rollingRankings={...s.rollingRankings,events:{recent:prize}};expect(getTournamentEntryAccess(s,event).allowed).toBe(true);
  s.rollingRankings={...s.rollingRankings,events:{recent:{...prize,eventType:'Exhibition'}}};expect(getTournamentEntryAccess(s,event).allowed).toBe(false);
  s.rollingRankings={...s.rollingRankings,events:{recent:{...prize,name:'World Championship Qualifying'}}};expect(getTournamentEntryAccess(s,event).allowed).toBe(false);
 });
 it('fills a bounded unique field and never revives retired players',()=>{
  const s=createStarterState(),event=s.tournaments.find(t=>t.formatId==='championOfChampions')!;
  const result=championInvitations(s,event);expect(new Set(result.names).size).toBe(result.names.length);expect(result.names.length).toBeLessThanOrEqual(16);
  const name=result.names.find(n=>n!==s.player.fullName)!;s.worldPlayers=s.worldPlayers.map(p=>p.playerName===name?{...p,retired:true}:p);
  expect(championInvitations(s,event).names).not.toContain(name);
 });
});
describe('long-history selector invalidation',()=>{
 it('reuses standings for display-only changes and invalidates on published results',()=>{
  const s=createStarterState(),first=pathwayStandings(s,'Senior',s.currentDate);
  const read={...s,player:{...s.player,inboxCount:1}};
  expect(pathwayStandings(read,'Senior',s.currentDate)).toBe(first);
  const next={...s,rollingRankings:{...s.rollingRankings!,events:{...s.rollingRankings!.events}}};
  expect(pathwayStandings(next,'Senior',s.currentDate)).not.toBe(first);
 });
 it('reuses senior selection across badge changes, but invalidates age and roster changes',()=>{
  const s=createStarterState(),first=seniorQualification(s,s.currentDate);
  expect(seniorQualification({...s,player:{...s.player,inboxCount:1}},s.currentDate)).toBe(first);
  expect(seniorQualification({...s,worldPlayers:[...s.worldPlayers]},s.currentDate)).not.toBe(first);
  expect(seniorQualification({...s,player:{...s.player,age:50}},s.currentDate)).not.toBe(first);
 });
});

 describe('responsive save serialization',()=>{
  it('preserves complete nested save data and standard JSON semantics',async()=>{
   const state=createStarterState();
   expect(await serializeCareerSave(state)).toBe(JSON.stringify(state));
   const edge={missing:undefined,arr:[undefined,NaN,null,'Élliot'],date:new Date('2026-01-01'),deep:{a:{b:[1,2,3]}}};
   expect(await serializeCareerSave(edge)).toBe(JSON.stringify(edge));
  });
 });
