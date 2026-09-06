import type { GameState } from '../hooks/useGameState';
import { careerMessage, plusDays } from './careerDepth/shared';
import { commitmentConflict } from './careerDepth/commitments';
export function careerBudget(state:GameState) {
  const weekly=state.finance.cashFlow;
  const runway=weekly<0?Math.max(0,Math.floor(state.player.cash/-weekly)):null;
  return {weekly,runway,projected:state.player.cash+weekly*4,warning:state.player.cash<0||weekly<0&&state.player.cash+weekly*4<500};
}
export function nextClubWorkDate(state:GameState) {
  for(let i=0;i<28;i++) {
    const date=plusDays(state.currentDate,i);
    if(!commitmentConflict(state,date,date)&&!state.careerDepth?.commitments.some(c=>c.kind==='club-work'&&c.status!=='cancelled'&&Math.abs(Date.parse(c.startDate)-Date.parse(date))<7*86400000)) return date;
  }
  return undefined;
}
export function reconcileCareerBudget(state:GameState):GameState {
  const budget=careerBudget(state),period=state.currentDate.slice(0,7);
  if(!budget.warning||state.finance.budgetWarningPeriod===period) return state;
  return careerMessage({...state,finance:{...state.finance,budgetWarningPeriod:period}},'cash-warning:'+period,'Career funds need attention',
    'Balance £'+Math.round(state.player.cash)+'; recurring cash flow £'+Math.round(budget.weekly)+'/week. Four-week projection £'+Math.round(budget.projected)+'. Review staff, table rental and overseas lodging. Paid club work earns £120 for a reserved day, once per week; book it in Finances or Calendar. Existing expenses and debt remain payable.','/finance');
}
