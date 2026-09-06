import {describe,it,expect} from 'vitest';
import {playerDecline,annualDecline,ageAttributeLoss,ensurePlayerDeclines} from './playerAgeing';
import {annualCpuDevelopment,ensureWorldPopulation} from './worldIntegrity';
import {createStarterState,repairGameState,evolveWorldPlayersForNextSeason} from '../hooks/useGameState';
import {evolveTourSkills} from './tourDevelopment';

describe('individual player ageing',()=>{
 it('uses all onset ages 35–40 and varied independent rates, stable for the same seeded identity',()=>{
  const profiles=Array.from({length:1200},(_,i)=>playerDecline({id:'player-'+i},20260906));
  expect([...new Set(profiles.map(p=>p.startAge))].sort()).toEqual([35,36,37,38,39,40]);
  for(const age of [35,36,37,38,39,40])expect(new Set(profiles.filter(p=>p.startAge===age).map(p=>p.rate)).size).toBeGreaterThan(20);
  for(const p of profiles){expect(p.rate).toBeGreaterThanOrEqual(.65);expect(p.rate).toBeLessThanOrEqual(1.45);}
  expect(playerDecline({id:'player-1'},20260906)).toEqual(profiles[1]);
  expect(Array.from({length:20},(_,i)=>playerDecline({id:'player-'+i},9))).not.toEqual(profiles.slice(0,20));
 });
 it('starts only at each assigned age and makes higher rates consistently decline faster',()=>{
  for(let startAge=35;startAge<=40;startAge++)for(const rate of [.65,1,1.45]){
   const p={startAge,rate};expect(annualDecline(startAge-1,p)).toBe(0);
   expect(annualCpuDevelopment(startAge-1,90,95,'same',p)).toBeGreaterThanOrEqual(0);
   expect(annualCpuDevelopment(startAge,90,95,'same',p)).toBeCloseTo(-.55*rate);
   expect(annualDecline(startAge+10,p)).toBeGreaterThan(annualDecline(startAge,p));
   expect(ageAttributeLoss(startAge-1,p).physical).toBeCloseTo(0);
  }
  expect(annualDecline(42,{startAge:38,rate:1.45})).toBeGreaterThan(annualDecline(42,{startAge:38,rate:.65}));
 });
 it('migrates old saves without changing attributes, rating, cash, or rerolling on reload',()=>{
  const s=createStarterState();s.player.declineProfile=undefined;s.worldPlayers=s.worldPlayers.map(p=>({...p,declineProfile:undefined}));
  const before=structuredClone(s),assigned=ensurePlayerDeclines(s);
  expect(assigned.player.cash).toBe(before.player.cash);expect(assigned.attributes).toEqual(before.attributes);
  expect(assigned.worldPlayers.map(p=>p.overallRating)).toEqual(before.worldPlayers.map(p=>p.overallRating));
  const reloaded=repairGameState(JSON.parse(JSON.stringify(assigned)));
  expect(reloaded.worldPlayers.map(p=>p.declineProfile)).toEqual(assigned.worldPlayers.map(p=>p.declineProfile));
  expect(reloaded.player.declineProfile).toEqual(assigned.player.declineProfile);
  expect(ensurePlayerDeclines(assigned)).toBe(assigned);
  expect(playerDecline({id:'renamed-id',declineProfile:{startAge:36,rate:.8}},999)).toEqual({startAge:36,rate:.8});
 });
 it('uses the personal onset and rate in monthly skills, without rerolling on repeated processing',()=>{
  let s=createStarterState();const player=s.worldPlayers.find(p=>p.playerName!==s.player.fullName)!;
  const prototype={...player,age:37,retired:false,skillDevelopment:{reviewedMonth:'2026-05',focus:'safetyPlay' as const,offsets:{longPotting:0,breakBuilding:0,safetyPlay:0,composure:0,stamina:0},history:[]}};
  const monthly=(startAge:number,rate:number)=>evolveTourSkills({...s,currentDate:'2026-06-11',worldPlayers:[{...prototype,declineProfile:{startAge,rate}}]}).worldPlayers[0];
  const notYet=monthly(40,1),slow=monthly(35,.65),fast=monthly(35,1.45);
  expect(notYet.skillDevelopment!.offsets.stamina).toBeGreaterThanOrEqual(0);
  expect(slow.skillDevelopment!.offsets.stamina).toBeLessThan(notYet.skillDevelopment!.offsets.stamina);
  expect(fast.skillDevelopment!.offsets.stamina).toBeLessThan(slow.skillDevelopment!.offsets.stamina);
  s={...s,currentDate:'2026-06-11',worldPlayers:[fast]};expect(evolveTourSkills(s).worldPlayers).toEqual(s.worldPlayers);
 });
 it('retains profiles at rollover and assigns persistent profiles to new recruits',()=>{
  const s=createStarterState(),old=new Map(s.worldPlayers.map(p=>[p.id,p.declineProfile]));
  const next=evolveWorldPlayersForNextSeason(s.worldPlayers,s.competitionTables,{...s.player,age:s.player.age+1},s.careerSystems.pro.hasTourCard,s.careerSystems.pro,2027,new Map(),s.worldSeed);
  for(const p of next){expect(p.declineProfile).toBeDefined();if(old.has(p.id))expect(p.declineProfile).toEqual(old.get(p.id));}
  const expanded=ensureWorldPopulation({...s,season:'2027/28',worldPlayers:next});
  for(const p of expanded.worldPlayers)expect(p.declineProfile).toBeDefined();
 });
});
