import type { GameState } from '../hooks/useGameState';
import type { Tournament } from '../types/game';
import { hotelRoundDate } from './realism/accommodation';
import { dayNumber } from './careerDepth/shared';

export type BetweenMatchChoice = 'rest' | 'practice' | 'review';
export type BetweenMatchPreparation = {
  key: string; choice: BetweenMatchChoice; nextDate: string;
  fatigueBefore: number; fatigueAfter: number; confidenceBefore: number; confidenceAfter: number;
};
export const betweenMatchChoices = [
  { id: 'rest', label: 'Rest & recover', description: 'Sleep, food and gentle mobility. Most fatigue recovery.' },
  { id: 'practice', label: 'Light table practice', description: 'Balance physical recovery with a small confidence lift.' },
  { id: 'review', label: 'Tactical review', description: 'Settle doubts about your opponent. Most confidence support, least physical recovery.' },
] as const;

export function betweenMatchInfo(state: GameState, tournament?: Tournament) {
  const progress = state.tournamentProgress;
  const event = tournament ?? state.tournaments.find(t => t.id === progress.tournamentId);
  if (!event || event.status !== 'Entered' || event.id !== progress.tournamentId || !progress.currentRound || !progress.completedRounds.length) return null;
  const round = progress.draw.find(r => r.label === progress.currentRound);
  const fixture = round?.matches.find(m => (m.top.name === state.player.fullName || m.bottom.name === state.player.fullName) && (m.top.score === undefined || m.bottom.score === undefined));
  if (!fixture) return null;
  const previous = progress.completedRounds.at(-1)!;
  // Use the same estimated event schedule as accommodation. Group fixtures on
  // the same stage date get a short turnaround, never a full overnight reset.
  const previousDate = hotelRoundDate(event, previous.round);
  const nextDate = hotelRoundDate(event, progress.currentRound);
  const days = Math.max(0, dayNumber(nextDate) - dayNumber(previousDate));
  const key = `${event.startDate}:${progress.completedRounds.length}:${progress.currentRound}:${fixture.id}`;
  const saved = state.travel.bookings[event.id]?.betweenMatches;
  return { event, key, previousDate, nextDate, days, round: progress.currentRound,
    opponent: fixture.top.name === state.player.fullName ? fixture.bottom.name : fixture.top.name,
    applied: saved?.key === key ? saved : undefined,
    recommended: state.player.fatigue >= 40 ? 'rest' as const : state.player.confidence < 65 ? 'review' as const : 'practice' as const };
}
export function betweenMatchEffects(state: GameState, days: number, choice: BetweenMatchChoice) {
  const nights = Math.min(3, Math.max(0, days));
  const recovery = choice === 'rest' ? 6 + nights * 8 : choice === 'practice' ? 4 + nights * 6 : 2 + nights * 4;
  // A bounded, once-per-fixture routine should remain useful near the support
  // ceiling. Preserve confidence above it, and never let preparation exceed 90.
  const current = state.player.confidence;
  const support = choice === 'rest' ? 0 : choice === 'practice' ? 1 : 2;
  const taper = Math.max(0.5, Math.min(1, (90 - current) / 25));
  const confidence = support === 0 || current >= 90 ? current
    : Math.max(current, Math.min(90, Math.round((current + support * taper * (nights === 0 ? 0.5 : 1)) * 100) / 100));
  return {
    fatigue: Math.max(0, state.player.fatigue - recovery),
    confidence,
    strain: Math.max(0, state.trainingCondition.strain - (choice === 'rest' ? 1 + nights * 2 : nights)),
  };
}
export function prepareBetweenMatchesState(state: GameState, choice: BetweenMatchChoice, tournamentId?: string): GameState {
  if (!betweenMatchChoices.some(c => c.id === choice) || state.liveMatch?.status === 'In Progress') return state;
  const info = betweenMatchInfo(state, tournamentId ? state.tournaments.find(t => t.id === tournamentId) : undefined);
  if (!info || (tournamentId && info.event.id !== tournamentId) || info.applied) return state;
  const booking = state.travel.bookings[info.event.id];
  if (!booking?.preparation) return state;
  const effects = betweenMatchEffects(state, info.days, choice);
  const preparation: BetweenMatchPreparation = { key: info.key, choice, nextDate: info.nextDate,
    fatigueBefore: state.player.fatigue, fatigueAfter: effects.fatigue,
    confidenceBefore: state.player.confidence, confidenceAfter: effects.confidence };
  return { ...state,
    player: { ...state.player, fatigue: effects.fatigue, confidence: effects.confidence },
    trainingCondition: { ...state.trainingCondition, strain: effects.strain },
    travel: { ...state.travel, bookings: { ...state.travel.bookings, [info.event.id]: { ...booking, betweenMatches: preparation } } },
    lastAction: `${betweenMatchChoices.find(c => c.id === choice)!.label} completed for ${info.round}. Fatigue ${preparation.fatigueBefore.toFixed(2)}% → ${preparation.fatigueAfter.toFixed(2)}%; confidence ${preparation.confidenceBefore.toFixed(2)}% → ${preparation.confidenceAfter.toFixed(2)}%.`,
  };
}
