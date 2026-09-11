import { resolveTestDecisions } from '../../test-support/resolveTestDecisions';
import { describe,it,expect } from 'vitest';
import { leagueFixture } from '../../test-support/leagueFixture';
import { leagueFixtureSchedule,nextLeagueFixture } from './leagueSchedule';
import { betweenMatchInfo } from './betweenMatches';
import { finalizeLiveMatch,startLiveMatchState,simulateTournamentMatchState,prepareScheduledMatchState,repairGameState } from '../hooks/useGameState';
import { plusDays } from './careerDepth/shared';
import { reconcileRealism } from './realism';

describe('dated junior league',()=>{
 it('gives each player three matches per day and keeps the same dates without old matchday metadata',()=>{
  const {state,event}=leagueFixture(),round=state.tournamentProgress.draw[0];
  const names=new Set(round.matches.flatMap(m=>[m.top.name,m.bottom.name]));
  expect(names.size).toBe(16);expect(round.matches).toHaveLength(120);
  for(const name of names){const counts:Record<string,number>={};for(const m of round.matches.filter(m=>m.top.name===name||m.bottom.name===name)){const d=leagueFixtureSchedule(event,round,m)!.date;counts[d]=(counts[d]??0)+1;}expect(Object.values(counts)).toEqual([3,3,3,3,3]);expect(Object.keys(counts).at(-1)).toBe(event.endDate);}
  const dates=round.matches.map(m=>leagueFixtureSchedule(event,round,m)!.date);round.matches.forEach(m=>delete m.matchday);expect(round.matches.map(m=>leagueFixtureSchedule(event,round,m)!.date)).toEqual(dates);
 });
 it('plays all 15 matches across five actual calendar dates and charges four additional hotel nights once',()=>{
  const {state: initial,event}=leagueFixture();let state=initial;const key=event.id+':'+event.startDate,initialCost=state.travel.bookings[event.id].totalCost,rate=state.realism!.journeys[key].hotelNightlyRate!;
  const dates:string[]=[];
  for(let i=0;i<15;i++){
   const expected=plusDays(event.startDate,Math.floor(i/3));
   if(i)expect(betweenMatchInfo(state)?.days).toBe(i%3===0?1:0);
   state=startLiveMatchState(state,event.id);expect(state.liveMatch?.status,state.lastAction).toBe('In Progress');expect(state.currentDate).toBe(expected);
   state=finalizeLiveMatch(state,{...state.liveMatch!,status:'Completed',playerFrames:2,opponentFrames:0});dates.push(state.matches[0].playedOn!);state=resolveTestDecisions(state);
   if(i===8){const before=state.matches.map(m=>[m.id,m.playerFrames,m.opponentFrames]);state=repairGameState(JSON.parse(JSON.stringify(state)));expect(state.matches.map(m=>[m.id,m.playerFrames,m.opponentFrames])).toEqual(before);}
  }
  expect(new Set(dates).size).toBe(5);expect(state.currentDate).toBe(event.endDate);
  expect(state.travel.bookings[event.id].totalCost-initialCost).toBeCloseTo(4*rate,2);
  const repeat=reconcileRealism(state);expect(repeat.travel.bookings[event.id].totalCost).toBe(state.travel.bookings[event.id].totalCost);
 });
 it('Quick Sim uses the fixture date and a selected routine cannot be applied twice',()=>{
  const {state: initial,event}=leagueFixture();let state=initial;for(let i=0;i<3;i++)state=resolveTestDecisions(simulateTournamentMatchState(state,event.id));
  expect(nextLeagueFixture(state)?.date).toBe(plusDays(event.startDate,1));
  const prepared=prepareScheduledMatchState(state,'review',event.id);expect(prepared.currentDate).toBe(plusDays(event.startDate,1));
  const again=prepareScheduledMatchState(prepared,'practice',event.id);expect(again.player.fatigue).toBe(prepared.player.fatigue);expect(again.player.confidence).toBe(prepared.player.confidence);
  const simulated=simulateTournamentMatchState(again,event.id);expect(simulated.matches[0].playedOn).toBe(plusDays(event.startDate,1));
 });
 it('continues an old nine-match save without rewriting results or granting a second preparation choice',()=>{
  const {state: initial,event}=leagueFixture();let state=initial;for(let i=0;i<9;i++)state=resolveTestDecisions(simulateTournamentMatchState(state,event.id));
  state.currentDate=event.startDate;
  state.matches=state.matches.map(m=>({...m,playedOn:event.startDate}));
  const info=betweenMatchInfo(state)!;
  state.travel.bookings[event.id].betweenMatches={key:info.key,choice:'rest',nextDate:event.startDate,fatigueBefore:40,fatigueAfter:34,confidenceBefore:70,confidenceAfter:70};
  const results=state.matches.map(m=>[m.id,m.playedOn,m.playerFrames,m.opponentFrames]);
  state=repairGameState(JSON.parse(JSON.stringify(state)));
  const prepared=prepareScheduledMatchState(state,'review',event.id);
  expect(prepared.currentDate).toBe(plusDays(event.startDate,3));
  expect(prepared.matches.map(m=>[m.id,m.playedOn,m.playerFrames,m.opponentFrames])).toEqual(results);
  expect(prepared.travel.bookings[event.id].betweenMatches?.choice).toBe('rest');
  const repeated=prepareScheduledMatchState(prepared,'review',event.id);expect(repeated.player.cash).toBe(prepared.player.cash);expect(repeated.player.fatigue).toBe(prepared.player.fatigue);
 });
 it('settles a weekly boundary once while moving to the next league date',()=>{
  const {state: initial,event}=leagueFixture();let state=initial;state.careerDepth!.nextSettlementDate=plusDays(event.startDate,1);
  for(let i=0;i<3;i++)state=resolveTestDecisions(simulateTournamentMatchState(state,event.id));
  const week=state.week;const prepared=prepareScheduledMatchState(state,'rest',event.id);
  expect(prepared.week).toBe(week+1);expect(prepared.careerDepth!.nextSettlementDate).toBe(plusDays(event.startDate,8));
  expect(prepareScheduledMatchState(prepared,'rest',event.id).week).toBe(prepared.week);
 });
});
