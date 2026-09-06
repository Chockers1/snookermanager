import { describe,it,expect } from 'vitest';
import { createStarterState, processRankingCalendar, advanceWeekState, evolveWorldPlayersForNextSeason } from '../hooks/useGameState';
import { annualCpuDevelopment, uniqueRankingRows, cpuSeasonEvidence, repairCpuHistoricalRecords } from './worldIntegrity';
import { pathwayEntryReason, pathwayCardAwards } from './pathwayRules';
import { careerBudget, nextClubWorkDate, reconcileCareerBudget } from './careerBudget';
import { scheduleCommitment, settleCommitments, protectCommitmentSessions } from './careerDepth/commitments';
import { plusDays } from './careerDepth/shared';

describe('world endurance regressions',()=>{
 it('develops prospects and gradually ages even successful veterans from 40',()=>{
  expect(annualCpuDevelopment(22,70,90,'Veteran',{startAge:40,rate:1})).toBeGreaterThan(1);
  expect(annualCpuDevelopment(38,90,95,'Veteran',{startAge:40,rate:1})).toBe(0);
  expect(annualCpuDevelopment(40,90,95,'Veteran',{startAge:40,rate:1})).toBeLessThan(0);
  expect(annualCpuDevelopment(40,90,95,'Veteran',{startAge:40,rate:1})).toBeGreaterThan(-1);
  expect(annualCpuDevelopment(50,90,95,'Veteran',{startAge:40,rate:1})).toBeLessThan(annualCpuDevelopment(40,90,95,'Veteran',{startAge:40,rate:1}));
 });
 it('deduplicates copied ranking rows without doubling their points',()=>{
  const row=createStarterState().competitionTables.qTour[0];
  expect(uniqueRankingRows([row,{...row,id:'copy'}, {...row,id:'updated',eventsPlayed:row.eventsPlayed+1,points:row.points+50}])).toEqual([{...row,id:'updated',eventsPlayed:row.eventsPlayed+1,points:row.points+50}]);
 });
 it('runs every circuit with named eligible entrants, stores the League and archives exact match totals',()=>{
  const opening=createStarterState();
  const closed=processRankingCalendar({...opening,currentDate:'2027-06-29',tournaments:opening.tournaments.map(t=>({...t,status:'Skipped'}))});
  const events=Object.values(closed.rollingRankings!.events).filter(e=>e.season===closed.season);
  expect(events).toHaveLength(opening.tournaments.length);
  expect(events.find(e=>e.name==='Championship League')?.completedOn).toBe('2026-07-23');
  const players=new Map(closed.worldPlayers.map(p=>[p.playerName,p]));
  for(const e of events)for(const round of e.bracket)for(const m of round.matches)for(const entrant of [m.top,m.bottom]) {
    if(entrant.name==='TBD')continue;
    const p=players.get(entrant.name);expect(p,e.name+' '+entrant.name).toBeDefined();
    expect(pathwayEntryReason(opening.tournaments.find(t=>t.id===e.tournamentId)!,{name:p!.playerName,nation:p!.nation,age:p!.age,hasTourCard:p!.hasTourCard,retired:p!.retired})).toBeNull();
  }
  const evidence=cpuSeasonEvidence(closed,()=>({prizeMoney:0}));
  const rolled=advanceWeekState({...closed,careerDepth:{...closed.careerDepth!,stories:[],nextSettlementDate:'2027-07-02'}});
  expect(rolled.season).toBe('2027/28');expect(rolled.currentDate).toBe('2027-06-30');
  for(const p of rolled.worldPlayers){const s=p.seasons.find(s=>s.season===closed.season);if(!s||p.playerName===closed.player.fullName)continue;expect(s.matches).toBe(s.wins+s.losses+(evidence.get(p.playerName)?.draws??0));expect(s.matches).toBe(evidence.get(p.playerName)?.matches??0);expect(p.majorTitles).toBeGreaterThanOrEqual(evidence.get(p.playerName)?.majors??0);}
  for(const name of pathwayCardAwards(closed).keys())expect(rolled.worldPlayers.find(p=>p.playerName===name)?.hasTourCard,name).toBe(true);
  expect(rolled.worldPlayers.filter(p=>p.hasTourCard)).toHaveLength(128);
 },30000);
 it('honours earned cards even when legacy protected contracts fill the nominal pool',()=>{
  const s=createStarterState(),candidate=s.worldPlayers.find(p=>!p.hasTourCard&&p.age>=18)!;
  const records=s.worldPlayers.map(p=>s.competitionTables.world.some(r=>r.playerName===p.playerName)?{...p,hasTourCard:true,yearsRemaining:2}:p);
  const next=evolveWorldPlayersForNextSeason(records,s.competitionTables,{...s.player,age:s.player.age+1},true,s.careerSystems.pro,2027,new Map([[candidate.playerName,'Q School']]));
  expect(next.find(p=>p.id===candidate.id)).toMatchObject({hasTourCard:true,cardSource:'Q School',yearsRemaining:2});
 });
 it('repairs provable historical match totals idempotently without inventing breaks',()=>{
  const s=createStarterState(),p=s.worldPlayers.find(p=>p.playerName!==s.player.fullName)!;p.totalMatches=2;p.wins=8;p.losses=3;p.highestBreak=0;
  const fixed=repairCpuHistoricalRecords(s);expect(fixed.worldPlayers.find(r=>r.id===p.id)).toMatchObject({totalMatches:11,highestBreak:0});expect(repairCpuHistoricalRecords(fixed)).toEqual(fixed);
 });
 it('warns before funds run out and pays club work once, with a reserved training day',()=>{
  let s=createStarterState();s={...s,player:{...s.player,cash:-10},finance:{...s.finance,cashFlow:-5},trainingAppliedWeek:null};
  expect(careerBudget(s).warning).toBe(true);const warned=reconcileCareerBudget(s);expect(reconcileCareerBudget(warned).inbox).toEqual(warned.inbox);
  const date=nextClubWorkDate(s)!;const booked=scheduleCommitment(s,'club-work',date);expect(booked.player.cash).toBe(-10);
  expect(booked.careerDepth!.commitments.at(-1)).toMatchObject({kind:'club-work',income:120,status:'scheduled'});
  expect(scheduleCommitment(booked,'club-work',plusDays(date,2)).lastAction).toContain('one paid shift');
  const plan=protectCommitmentSessions(booked,booked.trainingPlan);expect(plan.some(d=>d.careerCommitmentId==='club-work:'+date)).toBe(true);
  const paid=settleCommitments({...booked,currentDate:plusDays(date,1)});expect(paid.player.cash).toBe(110);expect(settleCommitments(paid).player.cash).toBe(110);
 });
});
