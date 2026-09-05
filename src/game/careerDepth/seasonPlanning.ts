import { bookTravelState, enterTournamentState, getTournamentEntryAccess, getTravelPackageCost, type GameState } from '../../hooks/useGameState';
import { depthOf, overlaps, plusDays, pendingStory } from './shared';
import type { Strategy } from './types';
import { tableSetupCatalog } from '../../data/gameContent';
import { trainingBaseCost } from '../realism/base';
import { overseasWeeklyCost } from '../realism';

export const STRATEGIES: Record<Strategy, string> = { ranking: 'Chase ranking points', majors: 'Peak for majors', development: 'Development season', survival: 'Financial survival' };
export function recurringCost(state: GameState) {
  const facility = tableSetupCatalog.find(f => f.id === state.equipment.currentTableId);
  return state.coachContracts.reduce((sum, c) => sum + c.weeklyCost, 0) + Math.max(0, -state.finance.baseCashFlow) + Math.round((facility?.monthlyRental ?? 0) / 4) + trainingBaseCost(state) + overseasWeeklyCost(state);
}
export function recommendSeason(state: GameState) {
  const d = depthOf(state);
  let lastEnd = '';
  return state.tournaments.filter(t => t.startDate >= state.currentDate && !['Completed', 'Skipped'].includes(t.status))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id)).map(event => {
      const access = getTournamentEntryAccess(state, event);
      const entry = event.status === 'Entered' ? 0 : event.entryFee;
      const travel = state.travel.bookings[event.id] ? 0 : getTravelPackageCost(state, undefined, undefined, event.id);
      let reason = 'Ranking opportunity with time to recover.';
      let include = access.allowed;
      if (!include) reason = access.reason ?? 'Not eligible.';
      else if (lastEnd && event.startDate <= plusDays(lastEnd, d.strategy === 'development' ? 21 : 3)) { include = false; reason = 'Preserves recovery or an uninterrupted development block.'; }
      else if (d.strategy === 'majors' && !d.targets.includes(event.id)) { include = false; reason = 'Preparation protected for your selected target events.'; }
      else if (d.strategy === 'ranking' && event.rankingValue <= 0) { include = false; reason = 'Does not advance the ranking strategy.'; }
      else if (d.strategy === 'survival' && entry + travel > Math.max(0, state.player.cash - recurringCost(state) * 4) / 4) { include = false; reason = 'Guaranteed costs are too high for the survival budget.'; }
      if (include && d.commitments.some(c => c.status === 'scheduled' && overlaps(plusDays(event.startDate, -1), event.endDate ?? event.startDate, c.startDate, c.endDate))) { include = false; reason = 'Conflicts with an existing commitment.'; }
      if (include) lastEnd = event.endDate ?? event.startDate;
      return { event, entry, travel, total: entry + travel, include, reason: include && d.strategy === 'majors' ? 'Selected peak event.' : reason, inApprovalWindow: event.startDate < plusDays(state.currentDate, 42) };
    });
}
export function approveSchedule(state: GameState, eventIds: string[], cap: number, reserve: number): GameState {
  const d = depthOf(state);
  if (![cap, reserve].every(n => Number.isFinite(n) && n >= 0) || new Set(eventIds).size !== eventIds.length) return { ...state, lastAction: 'Enter valid budget limits and a unique event list.' };
  const options = recommendSeason(state);
  const selected = eventIds.map(id => options.find(r => r.event.id === id));
  if (!selected.length || selected.some(r => !r || !r.inApprovalWindow || !getTournamentEntryAccess(state, r.event).allowed)) return { ...state, lastAction: 'Choose eligible events within the next six weeks.' };
  const rows = selected.filter(r => r !== undefined);
  if (d.strategy === 'majors' && rows.some(r => d.targets.includes(r.event.id) && (
    d.commitments.some(c => c.status === 'scheduled' && overlaps(c.startDate, c.endDate, plusDays(r.event.startDate, -3), plusDays(r.event.startDate, -1))) ||
    rows.some(other => other.event.id !== r.event.id && overlaps(other.event.startDate, other.event.endDate ?? other.event.startDate, plusDays(r.event.startDate, -3), plusDays(r.event.startDate, -1)))
  ))) return { ...state, lastAction: 'Keep the three days before each peak event free for protected preparation.' };
  if (rows.some((r, i) => rows.some((other, j) => j < i && overlaps(plusDays(r.event.startDate, -1), r.event.endDate ?? r.event.startDate, plusDays(other.event.startDate, -1), other.event.endDate ?? other.event.startDate)))) return { ...state, lastAction: 'Selected events overlap; choose a conflict-free schedule.' };
  if (rows.reduce((sum, r) => sum + r.total, 0) > cap || cap + reserve > state.player.cash) return { ...state, lastAction: 'The selected costs must fit the cap, and cap plus reserve must fit your current cash. Prize money is not assumed.' };
  return { ...state, careerDepth: { ...d, schedule: { strategy: d.strategy, targets: d.targets, eventIds,
    approvedDate: state.currentDate, expiresDate: plusDays(state.currentDate, 42), cap, reserve, spent: 0, completedEventIds: [], enabled: true,
    quotes: Object.fromEntries(rows.map(r => [r.event.id, r.total])), recurringCost: recurringCost(state) } }, lastAction: 'Six-week schedule approved. Assistance stops before preparation and matches.' };
}
export function runScheduleAssistance(state: GameState): GameState {
  const d = depthOf(state), plan = d.schedule;
  if (!plan?.enabled || pendingStory(state) || state.seasonReview?.pending || state.liveMatch?.status === 'In Progress') return state;
  const pause = (reason: string): GameState => ({ ...state, careerDepth: { ...d, schedule: { ...plan, enabled: false, pauseReason: reason } }, lastAction: `Schedule paused: ${reason}` });
  if (state.currentDate >= plan.expiresDate) return pause('Approve a new six-week block.');
  if (state.health.activeIssue || state.trainingCondition.injuryWeeks > 0 || recurringCost(state) !== plan.recurringCost) return pause('Health or recurring costs changed; review the plan.');
  const events = plan.eventIds.map(id => state.tournaments.find(t => t.id === id)).filter(t => t !== undefined).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const target = events.find(t => !plan.completedEventIds.includes(t.id) && t.status !== 'Completed');
  if (!target) return state;
  const active = state.tournaments.find(t => t.status === 'Entered' && t.id !== target.id);
  if (active) return target.startDate <= (active.endDate ?? active.startDate) ? pause('An ongoing tournament overlaps the next selected event.') : state;
  if (target.status === 'Skipped' || target.startDate < state.currentDate || !getTournamentEntryAccess(state, target).allowed) return pause('Event availability or eligibility changed.');
  if (d.commitments.some(c => c.status === 'scheduled' && overlaps(plusDays(target.startDate, -1), target.endDate ?? target.startDate, c.startDate, c.endDate))) return pause('A calendar commitment conflicts with the selected event.');
  const cost = (target.status === 'Entered' ? 0 : target.entryFee) + (state.travel.bookings[target.id] ? 0 : getTravelPackageCost(state, undefined, undefined, target.id));
  if (cost > plan.quotes[target.id] || plan.spent + cost > plan.cap || state.player.cash - cost < plan.reserve) return pause('Current prices or cash exceed your approved limits.');
  let next = target.status === 'Entered' ? state : enterTournamentState(state, target.id);
  if (!next.tournaments.some(t => t.id === target.id && t.status === 'Entered')) return pause(next.lastAction);
  if (!next.travel.bookings[target.id]) next = bookTravelState(next, target.id);
  if (!next.travel.bookings[target.id]) return pause(next.lastAction);
  return { ...next, careerDepth: { ...depthOf(next), schedule: { ...plan, spent: plan.spent + state.player.cash - next.player.cash, completedEventIds: [...plan.completedEventIds, target.id] } }, lastAction: `${target.name}: entry and travel handled within your approved budget. Choose your preparation plan next.` };
}
