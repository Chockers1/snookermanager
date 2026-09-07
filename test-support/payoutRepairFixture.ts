import { postEventRankingFixture } from './postEventRankingFixture';
import { rankingEventKey } from '../src/game/rollingRankings';

/** Authentic completed draw, converted back to the old percentage-based receipts. */
export function payoutRepairFixture() {
  const { state, event } = postEventRankingFixture();
  delete state.payoutRepair;
  const key=rankingEventKey(event), ledger=state.rollingRankings!, recorded=ledger.events[key];
  const oldAwards:Record<string,number>={};
  for(const round of recorded.bracket) for(const match of round.matches) {
    if(typeof match.top.score!== 'number'||typeof match.bottom.score!=='number'||match.placeholder) continue;
    const topWon=match.top.score>match.bottom.score;
    oldAwards[topWon?match.bottom.name:match.top.name]=round.label==='Final'?154000:round.label==='Semi Final'?56000:round.label==='Quarter Final'?21000:0;
    if(round.label==='Final')oldAwards[topWon?match.top.name:match.bottom.name]=350000;
  }
  const deltas=Object.fromEntries(Object.entries(oldAwards).map(([name,amount])=>[name,amount-(recorded.prizeAwards?.[name]??0)]));
  recorded.prizeAwards=oldAwards;delete recorded.prizeVersion;
  ledger.earnings=ledger.earnings.map(e=>e.eventKey===key?{...e,amount:oldAwards[e.playerName]??0}:e);
  for(const table of ['world','oneYear'] as const) state.competitionTables[table]=state.competitionTables[table].map(r=>({...r,prizeMoney:r.prizeMoney+(deltas[r.playerName]??0)}));
  state.player.cash+=26000;state.finance.cash=state.player.cash;
  if(state.history.legacy)state.history.legacy.prizeMoney+=26000;
  state.history.tournamentHistory=state.history.tournamentHistory.map(h=>h.tournamentId===event.id?{...h,prizeMoney:56000,rankingPoints:56000}:h);
  state.history.matchLog=state.history.matchLog.map(m=>m.tournamentId===event.id&&m.round==='Semi Final'?{...m,prizeMoney:56000,rankingPoints:56000}:m);
  state.matches=state.matches.map(m=>m.tournamentId===event.id&&m.round==='Semi Final'?{...m,prizeMoneyEarned:56000,rankingPointsGained:56000}:m);
  state.inbox=state.inbox.map(m=>m.eventFinance?.tournamentId===event.id?{...m,eventFinance:{...m.eventFinance,prize:56000,income:m.eventFinance.income+26000,net:m.eventFinance.net+26000}}:m);
  return {state,event,key};
}
