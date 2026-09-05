import type { GameState } from '../../hooks/useGameState';
import type { BaseKind } from './types';
export const TRAINING_BASES: Record<BaseKind, { name: string; weekly: number; joining: number; tableSessions: number; efficiency: number; description: string }> = {
  club: { name: 'Local club', weekly: 0, joining: 0, tableSessions: 8, efficiency: 1, description: 'Shared tables; eight priority table sessions. Further table work is less productive. No additional base subscription.' },
  rented: { name: 'Dedicated rented table', weekly: 90, joining: 180, tableSessions: 14, efficiency: 1.03, description: 'Fourteen priority sessions and consistent practice conditions. Coaches remain separately contracted.' },
  academy: { name: 'Professional academy', weekly: 260, joining: 600, tableSessions: 21, efficiency: 1.06, description: 'Full table access and a wider practice network. Access is not a free coaching contract or guaranteed partner.' },
};
export function trainingBaseCost(state: GameState) { return TRAINING_BASES[state.realism?.base ?? 'club'].weekly; }
export function baseTrainingMultiplier(state: GameState) {
  const base = TRAINING_BASES[state.realism?.base ?? 'club'];
  const sessions = state.trainingPlan.flatMap(d => [d.morning, d.afternoon, d.evening]).filter(c => c.category === 'Technical' || c.category === 'Match Prep').length;
  const away = state.realism && state.realism.location !== state.realism.home;
  const capacity = away ? 8 : base.tableSessions;
  const access = sessions > capacity ? (capacity + (sessions - capacity) * 0.75) / sessions : 1;
  return Number((access * (away ? 1 : base.efficiency)).toFixed(3));
}
