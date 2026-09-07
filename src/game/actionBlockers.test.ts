import { describe, expect, it } from 'vitest';
import { advancementBlocker, createStarterState, enterTournamentState, getNextEligibleTournament, tournamentEntryBlocker } from '../hooks/useGameState';
import { depthOf } from './careerDepth/shared';

function fixture() {
 const state=createStarterState();
 state.tournaments=state.tournaments.map(t=>({...t,status:'Available'}));
 const event=getNextEligibleTournament(state)!;
 return {state,event};
}
describe('actionable career blockers',()=>{
 it('checks usable chalk, even when a chalk item is equipped, without spending cash',()=>{
  const {state,event}=fixture();state.equipment.chalkStock[state.equipment.currentChalkId!]=0;
  const blocker=tournamentEntryBlocker(state,event)!;
  expect(blocker).toMatchObject({label:'Buy or equip chalk',route:'/equipment/chalk-tips'});
  const after=enterTournamentState(state,event.id);
  expect(after.lastAction).toBe(blocker.reason);expect(after.player.cash).toBe(state.player.cash);
  expect(after.tournaments.find(t=>t.id===event.id)?.status).not.toBe('Entered');
 });
 it('links sponsor conflicts to commitments and cash shortages to paid work',()=>{
  const {state,event}=fixture();
  state.careerDepth={...depthOf(state),commitments:[{id:'clash',kind:'appearance',startDate:event.startDate,endDate:event.startDate,status:'scheduled',income:0,cost:0,fatigue:0,sharpness:0}]};
  expect(tournamentEntryBlocker(state,event)?.route).toBe('/calendar?commitments=1');
  state.careerDepth.commitments=[];state.player.cash=-10;
  expect(tournamentEntryBlocker(state,event)).toMatchObject({route:'/finance',label:'Open finances & club work'});
  expect(tournamentEntryBlocker(state,event)?.reason).toContain('short');
 });
 it('identifies active events, qualification requirements and a direct qualifying link',()=>{
  const {state,event}=fixture();state.tournaments=state.tournaments.map(t=>t.id===event.id?{...t,status:'Entered'}:t);
  const other=state.tournaments.find(t=>t.id!==event.id)!;
  expect(tournamentEntryBlocker(state,other)?.route).toBe('/tournaments/hub');
  state.currentDate=event.startDate;
  expect(advancementBlocker(state)?.route).toBe('/tournaments/hub');
  const future=fixture().state;future.player.worldRanking=25;future.careerSystems.pro.hasTourCard=true;future.careerSystems.pro.worldRank=25;
  future.competitionTables.world=future.competitionTables.world.map(r=>r.playerName===future.player.fullName?{...r,ranking:25}:r);
  const world=future.tournaments.find(t=>t.name==='World Championship')!;
  expect(tournamentEntryBlocker(future,world)?.label).toBe('View World Championship Qualifying');
 });
});
