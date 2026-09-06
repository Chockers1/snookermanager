import {describe,it,expect} from 'vitest';
import {createStarterState,advanceWeekState,startNextSeasonState,applyTrainingPlanState,repairGameState} from '../hooks/useGameState';
import {seasonPosition,seasonWeekLabel,ensureSeasonClock,rolloverSeasonClock} from './seasonClock';
import {buildTrainingCell} from '../utils/trainingPlan';

describe('career season and week numbering',()=>{
 it('keeps first-season weeks and migrates a later season without changing gameplay counters',()=>{
  const s=createStarterState();expect(seasonPosition(s)).toEqual({season:1,week:19});
  const old={...s,seasonClock:undefined,season:'2027/28',week:64,currentDate:'2027-07-14',careerDepth:{...s.careerDepth!,nextSettlementDate:'2027-07-20'}};
  // A surviving first-season event establishes the career origin even if snapshots were trimmed.
  old.history={...old.history,snapshots:[{...old.history.snapshots[0],season:'2026/27'}]};
  old.inbox=[{...s.inbox[0],subject:'Week 64 report'}];
  const migrated=ensureSeasonClock(old);
  expect(migrated.inbox[0].subject).toBe('Season 2 · Week 2 report');expect(seasonPosition(migrated)).toEqual({season:2,week:3});
  expect(migrated.week).toBe(old.week);expect(migrated.player.cash).toBe(old.player.cash);expect(migrated.trainingAppliedWeek).toBe(old.trainingAppliedWeek);
  expect(ensureSeasonClock(migrated)).toBe(migrated);
 });
 it('resets to season two week one at rollover and labels the first completed weekly report week one',()=>{
  let s=createStarterState();s={...s,currentDate:'2027-06-29',week:61,tournaments:s.tournaments.map(t=>({...t,status:'Skipped'})),careerDepth:{...s.careerDepth!,nextSettlementDate:'2027-07-02',stories:[]}};
  const rolled=advanceWeekState(s);expect(seasonPosition(rolled)).toEqual({season:2,week:1});expect(rolled.week).toBe(61);
  const reloaded=repairGameState(JSON.parse(JSON.stringify(rolled)));expect(reloaded.seasonClock).toEqual(rolled.seasonClock);
  let next=startNextSeasonState(reloaded);next={...next,tournaments:next.tournaments.map(t=>({...t,status:'Skipped'})),careerDepth:{...next.careerDepth!,stories:[]}};
  for(let i=0;i<20&&next.week===rolled.week;i++)next=advanceWeekState(next);
  expect(next.week).toBe(62);expect(seasonPosition(next)).toEqual({season:2,week:2});
  expect(next.inbox.some(m=>m.subject==='Season 2 · Week 1 report')).toBe(true);
  expect(next.history.snapshots.at(-1)).toMatchObject({week:62,seasonNumber:2,seasonWeek:2});
 },30000);
 it('preserves the career season number beyond the twelve-season archive limit',()=>{
  let s=createStarterState();for(let i=1;i<=50;i++){const year=2026+i,season=year+'/'+String((year+1)%100).padStart(2,'0');s={...s,week:s.week+52,seasonClock:rolloverSeasonClock({...s,week:s.week+52},season),season};}
  s.history={...s.history,seasonRecords:[],snapshots:[]};expect(seasonWeekLabel(s)).toBe('Season 51 · Week 1');
 });
 it('allows recovered zero health values but records strain and burnout under heavy training',()=>{
  const s=createStarterState();s.player.fatigue=85;s.trainingAppliedWeek=null;
  const heavy=s.trainingPlan.map(d=>({...d,morning:buildTrainingCell('fitness'),afternoon:buildTrainingCell('fitness'),evening:buildTrainingCell('fitness')}));
  const worked=applyTrainingPlanState(s,heavy);expect(worked.trainingCondition.strain).toBeGreaterThan(0);expect(worked.trainingCondition.burnout).toBeGreaterThan(0);
  const rest=s.trainingPlan.map(d=>({...d,morning:buildTrainingCell('rest'),afternoon:buildTrainingCell('rest'),evening:buildTrainingCell('rest')}));
  const recovered=applyTrainingPlanState({...s,player:{...s.player,fatigue:10}},rest);expect(recovered.trainingCondition.strain).toBe(0);expect(recovered.trainingCondition.burnout).toBe(0);
 });
});
