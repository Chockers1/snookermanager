import type { GameState } from '../../hooks/useGameState';
import type { TrainingPlannerDay, Tournament } from '../../types/game';
import type { CareerCommitment, CommitmentKind } from './types';
import { bounded, careerMessage, depthOf, overlaps, plusDays, peakPreparationWindows } from './shared';
import { buildTrainingCell, calculateDayLoad } from '../../utils/trainingPlan';

export const COMMITMENTS: Record<CommitmentKind, { name: string; days: number; cost: number; income: number; fatigue: number; sharpness: number }> = {
  'club-work': { name: 'Paid club work', days: 1, cost: 0, income: 120, fatigue: 5, sharpness: 0 },
  exhibition: { name: 'Paid exhibition', days: 1, cost: 0, income: 300, fatigue: 6, sharpness: 0 },
  camp: { name: 'Practice camp', days: 3, cost: 250, income: 0, fatigue: 4, sharpness: 3 },
  appearance: { name: 'Sponsor appearance', days: 1, cost: 0, income: 150, fatigue: 3, sharpness: 0 },
  recovery: { name: 'Protected recovery', days: 2, cost: 0, income: 0, fatigue: -8, sharpness: 0 },
};
export function conflictingTournamentCommitment(state: GameState, tournament: Tournament) {
  return depthOf(state).commitments.find(c => c.status === 'scheduled' && overlaps(plusDays(tournament.startDate, -1), tournament.endDate ?? tournament.startDate, c.startDate, c.endDate));
}
export function tournamentCommitmentConflict(state: GameState, tournament: Tournament): string | null {
  const conflict = conflictingTournamentCommitment(state, tournament);
  if (!conflict) {
    const block = depthOf(state).board?.blocks.find(b => overlaps(plusDays(tournament.startDate,-1),tournament.endDate ?? tournament.startDate,b.start,b.end));
    return block ? 'Conflicts with a protected '+block.kind+' week ('+block.start+'–'+block.end+'). Remove the block in the season planning board to enter.' : null;
  }
  const dates = conflict.startDate === conflict.endDate ? conflict.startDate : `${conflict.startDate}–${conflict.endDate}`;
  return `${COMMITMENTS[conflict.kind].name} (${dates}) overlaps this tournament or its travel day. Manage your commitments in Calendar, or skip this event.`;
}

export function commitmentQuote(state: GameState, kind: CommitmentKind, startDate: string): CareerCommitment {
  const item = COMMITMENTS[kind];
  const scale = state.player.worldRanking ? 1 + Math.min(3, state.player.reputation / 30) : 0.5;
  return { id: `${kind}:${startDate}`, kind, startDate, endDate: plusDays(startDate, item.days - 1),
    sponsorId: kind === 'appearance' ? [...state.sponsors].sort((a, b) => (a.compliance ?? 100) - (b.compliance ?? 100))[0]?.id : undefined,
    cost: Math.round(item.cost * scale), income: kind === 'club-work' ? item.income : Math.round(item.income * scale),
    fatigue: item.fatigue, sharpness: item.sharpness, status: 'scheduled' };
}
export function commitmentConflict(state: GameState, start: string, end: string) {
  if (start < state.currentDate || state.seasonReview?.pending || state.liveMatch?.status === 'In Progress') return 'Choose a future free date outside a match or season review.';
  if (state.trainingAppliedWeek === state.week && start < depthOf(state).nextSettlementDate) return 'This training week has already been applied. Choose the next training week.';
  if (state.tournaments.some(t => t.status === 'Entered' && overlaps(start, end, plusDays(t.startDate, -1), t.endDate ?? t.startDate))) return 'Conflicts with an entered tournament or protected travel.';
  if (peakPreparationWindows(state).some(w => overlaps(start, end, w.startDate, w.endDate))) return 'Conflicts with the three-day preparation block protected by your approved major-event plan.';
  if (depthOf(state).board?.blocks.some(b=>overlaps(start,end,b.start,b.end))) return 'Conflicts with a protected season planning block.';
  if (depthOf(state).commitments.some(c => c.status === 'scheduled' && overlaps(start, end, c.startDate, c.endDate))) return 'Conflicts with another commitment.';
  return null;
}
export function scheduleCommitment(state: GameState, kind: CommitmentKind, start: string, storyId?: string): GameState {
  const d = depthOf(state);
  if (!COMMITMENTS[kind] || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isFinite(Date.parse(start))) return { ...state, lastAction: 'Choose a valid commitment date.' };
  const quote = commitmentQuote(state, kind, start);
  const conflict = commitmentConflict(state, start, quote.endDate);
  if (conflict) return { ...state, lastAction: conflict };
  if (d.commitments.some(c => c.id === quote.id)) return { ...state, lastAction: 'That opportunity has already been booked or declined.' };
  if (kind === 'appearance' && !state.sponsors.length && !storyId) return { ...state, lastAction: 'A sponsor contract or media invitation is required.' };
  if (kind === 'club-work' && d.commitments.some(c => c.kind === kind && c.status !== 'cancelled' && Math.abs(Date.parse(c.startDate)-Date.parse(start)) < 7*86400000)) return {...state,lastAction:'Local clubs offer one paid shift per seven days.'};
  if (kind === 'appearance' && !storyId && d.commitments.some(c => c.kind === 'appearance' && c.status !== 'cancelled' && Math.abs(Date.parse(c.startDate) - Date.parse(start)) < 28 * 86400000)) return { ...state, lastAction: 'Your commercial schedule allows one paid sponsor appearance every four weeks.' };
  if (kind === 'exhibition' && !storyId) return { ...state, lastAction: 'Paid exhibitions require a breakthrough invitation.' };
  if (quote.cost > 0 && (state.player.cash < quote.cost || (d.schedule?.enabled && state.player.cash - quote.cost < d.schedule.reserve))) return { ...state, lastAction: 'Not enough unreserved cash for this commitment.' };
  return { ...state, player: { ...state.player, cash: state.player.cash - quote.cost },
    careerDepth: { ...d, commitments: [...d.commitments, { ...quote, sourceStoryId: storyId }] },
    finance: { ...state.finance, ledger: [{ id: `commitment-cost:${quote.id}`, date: state.currentDate, description: COMMITMENTS[kind].name, amount: quote.cost, type: 'Expense', category: 'Training' }, ...state.finance.ledger] },
    lastAction: `${COMMITMENTS[kind].name} reserved for ${start}–${quote.endDate}. Cost £${quote.cost}; income £${quote.income} on completion.` };
}
export function protectCommitmentSessions(state: GameState, plan: TrainingPlannerDay[]) {
  const anchor = plusDays(depthOf(state).nextSettlementDate, -7);
  return plan.map((day, i) => {
    const date = plusDays(anchor, i);
    const peak = peakPreparationWindows(state).find(w => date >= w.startDate && date <= w.endDate);
    if (peak && !day.competitionName) return { ...day, morning: buildTrainingCell('match-prep'), afternoon: buildTrainingCell('review'), evening: buildTrainingCell('rest'), competitionName: `Protected preparation: ${peak.name}` };
    const commitment = depthOf(state).commitments.find(c => c.status !== 'cancelled' && overlaps(date, date, c.startDate, c.endDate));
    const block = depthOf(state).board?.blocks.find(b=>date>=b.start && date<=b.end);
    if (!commitment && block && !day.competitionName) {
      const focus = { 'long-pot':'long-pot-routine','safety':'safety-exchanges','pressure':'mental-training','stamina':'fitness','cue-action':'line-up-drill' }[block.focus];
      const sessions = { morning:buildTrainingCell(block.kind==='rest'?'rest':focus),afternoon:buildTrainingCell(block.kind==='rest'?'rest':'video-review'),evening:buildTrainingCell('rest') };
      const load=calculateDayLoad(sessions);
      return { ...day,...sessions,planningBlockKind:block.kind,load,loadLabel:load>=80?'High':load>=55?'Medium':'Low',competitionName:'Planned '+block.kind+' week' };
    }
    if (!commitment || day.competitionName) return day;
    // Commitments replace all three sessions: never free extra training on top of them.
    const cell = { ...buildTrainingCell('rest'), subtitle: COMMITMENTS[commitment.kind].name };
    return { ...day, morning: cell, afternoon: cell, evening: cell, careerCommitmentId: commitment.id, competitionName: COMMITMENTS[commitment.kind].name, load: 0, loadLabel: 'Reserved' };
  });
}
export function settleCommitments(state: GameState): GameState {
  let next = state;
  for (const c of depthOf(state).commitments) {
    if (c.status !== 'scheduled' || next.currentDate <= c.endDate) continue;
    const d = depthOf(next);
    next = { ...next, player: { ...next.player, cash: next.player.cash + c.income, fatigue: bounded(next.player.fatigue + c.fatigue) },
      trainingCondition: { ...next.trainingCondition, strain: bounded(next.trainingCondition.strain - (c.kind === 'recovery' ? 4 : 0)) },
      sponsors: c.kind === 'appearance' ? next.sponsors.map(s => s.id === c.sponsorId ? { ...s, compliance: bounded((s.compliance ?? 100) + 5), fulfilledObligations: (s.fulfilledObligations ?? 0) + 1 } : s) : next.sponsors,
      finance: { ...next.finance, ledger: [{ id: `commitment-income:${c.id}`, date: next.currentDate, description: COMMITMENTS[c.kind].name, amount: c.income, type: 'Income', category: 'Other' }, ...next.finance.ledger] },
      careerDepth: { ...d, commitments: d.commitments.map(item => item.id === c.id ? { ...item, status: 'completed' } : item),
        temporarySharpness: Math.min(5, d.temporarySharpness + c.sharpness), sharpnessExpires: c.sharpness ? plusDays(next.currentDate, 14) : d.sharpnessExpires } };
    next = careerMessage(next, `commitment:${c.id}`, `${COMMITMENTS[c.kind].name} completed`, `Income £${c.income}; fatigue ${c.fatigue > 0 ? '+' : ''}${c.fatigue}; temporary sharpness +${c.sharpness}. No competitive result or ranking points awarded.`, '/calendar');
  }
  const d = depthOf(next);
  if (d.sharpnessExpires && next.currentDate >= d.sharpnessExpires) next = { ...next, careerDepth: { ...d, temporarySharpness: 0 } };
  return next;
}
