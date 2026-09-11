import {describe,it,expect} from 'vitest';
import {createStarterState,advanceWeekState,finishSeasonState,startNextSeasonState,repairGameState} from '../hooks/useGameState';
import {ensureCoachContractDates} from './coachContractDates';
import {reconcileStaff,staffChoice} from './seasonLife/staff';
import {plusDays} from './careerDepth/shared';

function quietCareer() {
 const s=createStarterState();s.tournaments=s.tournaments.map(t=>({...t,status:'Skipped'}));s.matches=[];s.liveMatch=null;s.player.cash=100000;
 s.careerDepth!.stories=[];s.careerDepth!.seasonLife!.teams=[];
 return s;
}
describe('long career corrections',()=>{
 it('keeps a midweek contract until the announced date and completes its CPU move',()=>{
  let s=quietCareer();s.currentDate='2026-08-23';s.careerDepth!.nextSettlementDate='2026-08-25';s.coachContracts=[{coachId:s.coaches[0].id,slot:'Lead Coach',weeksRemaining:4,startedWeek:s.week,contractWeeks:4,contractLabel:'4 weeks',weeklyCost:100,totalCost:400}];s.careerDepth!.seasonLife!.staff={};
  s=reconcileStaff(s);const id=s.coaches[0].id,end=s.coachContracts[0].endsOn!;expect(end).toBe('2026-09-20');s=staffChoice(s,id,'decline');
  for(let i=0;i<4;i++)s=advanceWeekState(s);
  expect(s.currentDate).toBe('2026-09-15');expect(s.coachContracts.find(c=>c.coachId===id)?.endsOn).toBe(end);
  const before=repairGameState({...s,currentDate:plusDays(end,-1)});expect(before.coachContracts.some(c=>c.coachId===id)).toBe(true);
  const after=advanceWeekState(s);expect(after.currentDate).toBe(end);expect(after.coachContracts.some(c=>c.coachId===id)).toBe(false);
  const staff=after.careerDepth!.seasonLife!.staff[id];expect(staff.employer).toBe(staff.notice!.destination);expect(staff.history.at(-1)?.date).toBe(end);
  expect(repairGameState(after).careerDepth!.seasonLife!.staff[id]).toEqual(staff);
 },30000);
 it('migrates legacy contracts to their announced date without shortening it on reload',()=>{
  const s=quietCareer(),id=s.coaches[0].id;s.coachContracts=[{coachId:id,slot:'Lead Coach',weeksRemaining:1,startedWeek:1,contractWeeks:4,contractLabel:'4 weeks',weeklyCost:100,totalCost:400}];
  s.careerDepth!.seasonLife!.staff[id]={ambition:'pay',experience:0,history:[],contractKey:'1:4:400',end:plusDays(s.currentDate,10)};
  const next=ensureCoachContractDates(s);expect(next.coachContracts[0].endsOn).toBe(plusDays(s.currentDate,10));expect(ensureCoachContractDates(next)).toBe(next);
 });
 it('preserves the opening snapshot after the rolling graph history is replaced and retains every summary',()=>{
  const s=quietCareer(),opening=s.history.seasonOpenings![s.season];
  s.currentDate='2027-06-29';s.careerDepth!.nextSettlementDate='2027-07-01';s.history.snapshots=s.history.snapshots.map(x=>({...x,date:'2027-03-01',ranking:77}));
  const first=finishSeasonState(s);expect(first.seasonReview!.completedSeason.startedOn).toBe(opening.snapshot.date);expect(first.seasonReview!.completedSeason.openingRanking).toBe(opening.snapshot.ranking);expect(first.seasonReview!.completedSeason.openingSnapshotPartial).toBe(false);
  const template=first.seasonReview!.completedSeason;
  const old=Array.from({length:25},(_,i)=>({...template,id:'old-'+i,season:`${2000+i}/${String(2001+i).slice(2)}`}));
  s.history.seasonRecords=old;const done=finishSeasonState(s);expect(done.history.seasonRecords).toHaveLength(26);
  const reloaded=repairGameState(JSON.parse(JSON.stringify(done)));expect(reloaded.history.seasonOpenings).toEqual(done.history.seasonOpenings);
  const next=startNextSeasonState(reloaded);expect(next.history.seasonOpenings![next.season].snapshot.date).toBe('2027-06-30');expect(next.history.seasonOpenings![next.season].partial).toBe(false);expect(next.history.seasonOpenings![s.season]).toEqual(opening);
 },30000);
 it('labels an older missing opening as partial instead of inventing a start rank',()=>{
  const s=quietCareer();delete s.history.seasonOpenings;s.currentDate='2027-06-29';s.history.snapshots=s.history.snapshots.map(x=>({...x,date:'2027-03-01'}));s.careerDepth!.nextSettlementDate='2027-07-01';
  const done=finishSeasonState(s);expect(done.seasonReview!.completedSeason.startedOn).toBe('2027-03-01');expect(done.seasonReview!.completedSeason.openingSnapshotPartial).toBe(true);
 },30000);
});
