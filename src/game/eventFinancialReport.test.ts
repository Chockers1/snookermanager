import { describe,expect,it } from 'vitest';
import { bookTravelState,confirmTournamentPreparationState,continueToNextTournamentState,createStarterState,enterTournamentState,finalizeLiveMatch,getNextEligibleTournament,getTravelPackageEstimate,startLiveMatchState,repairGameState } from '../hooks/useGameState';
import { eventFinancialReport,financialReportForMessage } from './eventFinancialReport';
import { plusDays } from './careerDepth/shared';
import { reconcileRealism,realismAction } from './realism';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import type { InboxMessage } from '../types/game';
function booked(){
  let state=createStarterState();state.player.cash=100000;
  const event={...getNextEligibleTournament(state)!,entryFee:60,formatId:'shootOut',endDate:plusDays(getNextEligibleTournament(state)!.startDate,6)};
  state.tournaments=[event];const cash=state.player.cash;state=enterTournamentState(state,event.id);
  const entry=cash-state.player.cash;
  state=bookTravelState(state,event.id);return {state,event,entry};
}
describe('complete event financial reports',()=>{
  it('splits paid hotel extensions without double charging them and preserves actual entry fees',()=>{
    const {state,event,entry}=booked();const before=state.player.cash;
    const estimate=getTravelPackageEstimate(state,undefined,undefined,event.id);
    const advanced=reconcileRealism({...state,tournamentProgress:{...state.tournamentProgress,currentRound:'Final'}});
    const report=eventFinancialReport(advanced,event);
    expect(report.extraNights).toBe(6);expect(report.hotel).toBeCloseTo(report.nights!*report.nightlyRate!,2);
    expect(report.transport+report.hotel).toBeCloseTo(advanced.travel.bookings[event.id].totalCost,2);
    expect(before-advanced.player.cash).toBeCloseTo(6*estimate.nightlyRate,2);
    expect(report.entry).toBe(entry);expect(report.costs).toBeCloseTo(entry+advanced.travel.bookings[event.id].totalCost,2);
    expect(eventFinancialReport({...advanced,tournaments:[{...event,entryFee:99999}]},event).entry).toBe(entry);
  });
  it('includes venue practice and net preparation charges after changes/refunds',()=>{
    const initial=booked();let state=realismAction(initial.state,{type:'familiarise',eventId:initial.event.id});
    expect(state.history.tournamentHistory[0].venuePracticePaid).toBe(35);
    state=confirmTournamentPreparationState(state,initial.event.id,'balanced',getDefaultPreparationAllocations(),['coach']);
    state=confirmTournamentPreparationState(state,initial.event.id,'balanced',getDefaultPreparationAllocations(),[]);
    expect(eventFinancialReport(state,initial.event).preparation).toBe(0);
    state=confirmTournamentPreparationState(state,initial.event.id,'balanced',getDefaultPreparationAllocations(),['table-hire']);
    const report=eventFinancialReport(state,initial.event);
    expect(report.preparation).toBe(85);expect(report.venuePractice).toBe(35);
    expect(report.costs).toBeCloseTo(initial.entry+state.travel.bookings[initial.event.id].totalCost+120,2);
    expect(state.finance.ledger.filter(t=>t.category==='Preparation')).toHaveLength(1);
  });
  it('uses whole-event income and retains an immutable report when the next season reuses an event id',()=>{
    const {state,event}=booked();state.history.tournamentHistory=state.history.tournamentHistory.map(h=>({...h,prizeMoney:16000,sponsorBonusesPaid:1250}));
    const report=eventFinancialReport(state,event);expect(report.income).toBe(17250);expect(report.net).toBe(17250-report.costs);
    const message:InboxMessage={id:'report',sender:'Office',subject:'Post-event report: '+event.name,preview:'Finished.',date:'Today',priority:'Medium',eventFinance:report};
    const next={...state,tournaments:[{...event,startDate:'2030-06-01'}],travel:{bookings:{}},history:{...state.history,tournamentHistory:[]}};
    expect(financialReportForMessage(next,JSON.parse(JSON.stringify(message)))).toEqual(report);
  });
  it('enhances existing emails from matching records and keeps unknown legacy hotel nights explicit',()=>{
    const {state,event}=booked();state.history.tournamentHistory=state.history.tournamentHistory.map(h=>({...h,status:'Completed'}));
    const message:InboxMessage={id:'old',sender:'Office',subject:'Post-event report: '+event.name,preview:'Finished.',date:'Today',priority:'Medium',summary:[{label:'Event costs',value:'£0',detail:'Entry £12 · travel £855 · preparation £0'}]};
    const report=financialReportForMessage(state,message)!;expect(report.nights).toBeGreaterThan(0);
    const key=event.id+':'+event.startDate;state.realism!.journeys[key].hotelNightlyRate=undefined;
    const legacy=financialReportForMessage(state,message)!;expect(legacy.combinedTravel).toBe(true);expect(legacy.nights).toBeUndefined();expect(legacy.hotel).toBe(0);expect(legacy.transport).toBe(state.travel.bookings[event.id].totalCost);
    state.history.tournamentHistory.push({...state.history.tournamentHistory[0],id:'old-season',season:'2025/26',startDate:'2025-06-01'});
    expect(financialReportForMessage(state,message)).toBeUndefined();
  });
  it('stores the settled report in the email and survives save repair without changing funds',()=>{
    const initial=booked();let state=confirmTournamentPreparationState(initial.state,initial.event.id,'balanced',getDefaultPreparationAllocations(),['table-hire']);
    state=continueToNextTournamentState(state);state=startLiveMatchState(state,initial.event.id);
    expect(state.liveMatch).not.toBeNull();
    const settled=finalizeLiveMatch(state,{...state.liveMatch!,status:'Completed',playerFrames:0,opponentFrames:1});
    const message=settled.inbox.find(m=>m.subject==='Post-event report: '+initial.event.name)!;
    expect(message.eventFinance?.preparation).toBe(85);expect(message.eventFinance?.costs).toBeCloseTo(initial.entry+state.travel.bookings[initial.event.id].totalCost+85,2);
    const reloaded=repairGameState(JSON.parse(JSON.stringify(settled)));
    expect(reloaded.player.cash).toBe(settled.player.cash);expect(reloaded.inbox.find(m=>m.id===message.id)?.eventFinance).toEqual(message.eventFinance);
  });
});
