import { describe, expect, it } from 'vitest';
import { createStarterState } from '../hooks/useGameState';
import type { GameState } from '../hooks/useGameState';
import type { InboxMessage, Tournament } from '../types/game';
import { createSeasonStartReport, preserveSeasonStartEmails, seasonStartReportForMessage } from './seasonStartReport';
const message: InboxMessage = { id:'new-season', sender:'Career Manager', subject:'2027/28 season started', preview:'Old short introduction', priority:'High', date:'Today' };
function fixture() {
  const state=createStarterState(); state.season='2027/28'; state.currentDate='2027-07-01';
  state.player.rankingLabel='World Ranking'; state.player.cash=188275;
  state.careerSystems.pro.hasTourCard=true;
  const base=state.tournaments.find(t=>t.name==='World Championship')!;
  state.tournaments=[{...base,id:'shanghai',name:'Shanghai Masters',startDate:'2027-07-26',endDate:'2027-07-30',status:'Available'}, {...base,id:'uk',name:'UK Championship',startDate:'2027-11-20',endDate:'2027-11-30',status:'Available'}, {...base,id:'masters',name:'Masters',startDate:'2028-01-10',endDate:'2028-01-18',status:'Available'}, {...base,id:'world',name:'World Championship',startDate:'2028-04-17',endDate:'2028-05-03',status:'Available'}];
  state.inbox=[{...message}];
  return state;
}
const access=(_state:GameState,event:Tournament)=>({allowed:event.id!=='masters',reason:event.id==='masters'?'Requires a Top 16 place at the cutoff.':null});
function history(event:Tournament,season='2026/27',result='Lost in Last 32'):GameState['history']['tournamentHistory'][number] {
  return {id:season+event.id,season,tournamentId:event.id,tournamentName:event.name,eventType:event.eventClass??event.type,stageId:null,tourCircuit:'Main Tour',location:event.location,startDate:'2027-04-17',status:'Completed',result,rounds:['Last 32'],matchesPlayed:1,wins:0,losses:1,prizeMoney:0,rankingPoints:0,highestBreak:95,centuries:0,fatigueChange:0,entryFee:0,bookedTravelCost:855};
}
describe('new-season briefing',()=>{
  it('matches the previous season and exact event without mixing qualifiers or older results',()=>{
    const state=fixture(),world=state.tournaments.find(t=>t.id==='world')!;
    state.history.tournamentHistory=[history({...world,id:'world-qual',name:'World Championship Qualifying'},'2026/27','Winner'),history(world,'2025/26','Winner'),history(world)];
    const report=createSeasonStartReport(state,access);
    expect(report.previousSeason).toBe('2026/27');
    expect(report.events.find(e=>e.id==='world')).toMatchObject({previousFinish:'Lost in Last 32',previousPrize:0});
    expect(report.events.find(e=>e.id==='masters')).toMatchObject({status:'Not eligible',reason:'Requires a Top 16 place at the cutoff.',previousFinish:'No recorded appearance'});
    expect(report.nextEventId).toBe('shanghai');
  });
  it('refreshes existing current-season messages when funds, dates or entries change',()=>{
    const state=fixture();
    const initial=seasonStartReportForMessage(state,message,access)!;
    state.player.cash=12345;state.currentDate='2027-07-08';state.tournaments[0].status='Entered';
    const report=seasonStartReportForMessage(state,{...message,seasonStartReport:initial},access)!;
    expect(report.cash).toBe(12345);expect(report.asOf).toBe('2027-07-08');
    expect(report.events[0].status).toBe('Entered');
    expect(initial.cash).toBe(188275);expect(initial.events[0].status).toBe('Entry available');
  });
  it('keeps archived briefings frozen and does not invent an older briefing',()=>{
    const state=fixture(),saved=preserveSeasonStartEmails(state,access);
    expect(saved.inbox[0].seasonStartReport).toBeDefined();
    expect(preserveSeasonStartEmails(saved,access)).toBe(saved);
    saved.season='2028/29';saved.player.cash=1;saved.tournaments=[];
    expect(seasonStartReportForMessage(saved,saved.inbox[0],access)?.cash).toBe(188275);
    expect(seasonStartReportForMessage(saved,message,access)).toBeNull();
  });
  it('shows pathway events and a clear empty state when no entry is possible',()=>{
    const state=fixture();state.careerSystems.pro.hasTourCard=false;
    const denied=()=>({allowed:false,reason:'Qualification needed'});
    expect(createSeasonStartReport(state,denied).events).toEqual([]);
    expect(createSeasonStartReport(state,denied).nextEventId).toBeUndefined();
    state.tournaments=[{...state.tournaments[0],id:'q-tour',name:'Q Tour Event 1',type:'Q Tour'}];
    expect(createSeasonStartReport(state,()=>({allowed:true,reason:null})).events[0].name).toBe('Q Tour Event 1');
  });
  it('supports changed event ids by exact name and circuit, and preserves skipped status',()=>{
    const state=fixture(),event=state.tournaments[0];
    state.history.tournamentHistory=[{...history({...event,id:'previous-id'}),status:'Skipped',result:'Skipped'}];
    const report=createSeasonStartReport(state,access);
    expect(report.events[0].previousFinish).toBe('Skipped');
    expect(report.events[0].previousPrize).toBeUndefined();
  });
});
