import type { GameState } from '../../hooks/useGameState';
import type { Tournament } from '../../types/game';
import type { VenueConditions } from './types';
export function venueConditions(tournament: Tournament): VenueConditions {
  if (tournament.venueConditions) return tournament.venueConditions;
  const hash = [...tournament.location].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const speed = 45 + hash % 31, cushions = 45 + (hash >>> 5) % 26, humidity = 35 + (hash >>> 10) % 36;
  return { speed, cushions, humidity, description: `${speed > 65 ? 'Quick' : speed < 52 ? 'Slower' : 'Medium-paced'} cloth · ${cushions > 62 ? 'lively' : 'measured'} cushions · ${humidity > 60 ? 'humid' : 'moderate'} room` };
}
/** Effective touch adjustments only: never edits permanent skills or directly adds win probability. */
export function conditionAdjustment(conditions: VenueConditions, cueControl: number, safety: number, familiarised: boolean) {
  const difficulty = Math.abs(conditions.speed - 58) / 14 + Math.abs(conditions.cushions - 55) / 18 + Math.max(0, conditions.humidity - 55) / 20;
  return Math.max(-2, Math.min(1, Number(((cueControl + safety - 140) / 90 - difficulty * (familiarised ? 0.3 : 0.65)).toFixed(1))));
}
export function familiarisedFor(state: GameState, tournament: Tournament) {
  const key = `${tournament.id}:${tournament.startDate}`;
  return Boolean(state.realism?.familiarised.includes(key) && state.realism.activities.some(a => a.id === `familiarise:${key}` && a.date <= state.currentDate));
}
