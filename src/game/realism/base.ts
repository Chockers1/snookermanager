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

export interface TrainingLocationProfile {
  name: string;
  strengths: readonly [string, string];
  tradeoff: string;
}
// Authored practice programmes, not claims about real facilities or national ability.
// Every hub has the same budget: two +6% specialisms and one -4% trade-off.
export const TRAINING_LOCATION_PROFILES: Record<string, TrainingLocationProfile> = {
  Auckland: { name: 'Steady foundations', strengths: ['Consistency', 'Balance'], tradeoff: 'Break Building' },
  Perth: { name: 'Long-session conditioning', strengths: ['Stamina', 'Recovery Rate'], tradeoff: 'Safety Play' },
  Albury: { name: 'Cue-action workshop', strengths: ['Hand Steadiness', 'Consistency'], tradeoff: 'Big Match Nerve' },
  Brisbane: { name: 'Movement and recovery', strengths: ['Balance', 'Recovery Rate'], tradeoff: 'Long Potting' },
  Toronto: { name: 'Pressure practice', strengths: ['Composure', 'Resilience'], tradeoff: 'Break Building' },
  SanJose: { name: 'Measured technique', strengths: ['Cue Ball Control', 'Focus'], tradeoff: 'Stamina' },
  RiodeJaneiro: { name: 'Attacking rhythm', strengths: ['Long Potting', 'Balance'], tradeoff: 'Safety Play' },
  Dubai: { name: 'Match composure', strengths: ['Big Match Nerve', 'Composure'], tradeoff: 'Hand Steadiness' },
  Vienna: { name: 'Precision routines', strengths: ['Consistency', 'Focus'], tradeoff: 'Long Potting' },
  Sofia: { name: 'Opening chances', strengths: ['Long Potting', 'Hand Steadiness'], tradeoff: 'Recovery Rate' },
  Oberhausen: { name: 'Tactical endurance', strengths: ['Safety Play', 'Stamina'], tradeoff: 'Break Building' },
  Lochristi: { name: 'Controlled break building', strengths: ['Cue Ball Control', 'Consistency'], tradeoff: 'Big Match Nerve' },
  Britain: { name: 'Matchcraft practice', strengths: ['Safety Play', 'Big Match Nerve'], tradeoff: 'Recovery Rate' },
  Belfast: { name: 'Resilient matchplay', strengths: ['Resilience', 'Safety Play'], tradeoff: 'Long Potting' },
  Dublin: { name: 'Repeatable delivery', strengths: ['Hand Steadiness', 'Composure'], tradeoff: 'Stamina' },
  Berlin: { name: 'Patient construction', strengths: ['Safety Play', 'Cue Ball Control'], tradeoff: 'Long Potting' },
  Shanghai: { name: 'Scoring patterns', strengths: ['Break Building', 'Cue Ball Control'], tradeoff: 'Recovery Rate' },
  Beijing: { name: 'Focused long openings', strengths: ['Long Potting', 'Focus'], tradeoff: 'Safety Play' },
  "Xi'an": { name: 'Consistent scoring', strengths: ['Break Building', 'Consistency'], tradeoff: 'Balance' },
  Wuhan: { name: 'Attacking practice', strengths: ['Long Potting', 'Break Building'], tradeoff: 'Safety Play' },
  Yushan: { name: 'Patient concentration', strengths: ['Focus', 'Composure'], tradeoff: 'Long Potting' },
  Riyadh: { name: 'Pressure scoring', strengths: ['Big Match Nerve', 'Break Building'], tradeoff: 'Recovery Rate' },
  Jeddah: { name: 'Long-match resilience', strengths: ['Stamina', 'Resilience'], tradeoff: 'Cue Ball Control' },
  HongKong: { name: 'Precise delivery', strengths: ['Cue Ball Control', 'Hand Steadiness'], tradeoff: 'Stamina' },
  Bangkok: { name: 'Confident openings', strengths: ['Long Potting', 'Composure'], tradeoff: 'Consistency' },
  Sydney: { name: 'Sustainable practice', strengths: ['Shoulder Health', 'Recovery Rate'], tradeoff: 'Break Building' },
};

export function trainingLocationProfile(location: string) {
  return TRAINING_LOCATION_PROFILES[location];
}
export function locationTrainingMultiplier(state: GameState, attribute: string) {
  const home = state.realism?.home ?? 'Britain';
  if ((state.realism?.location ?? home) !== home) return 1;
  const profile = trainingLocationProfile(home);
  if (!profile) return 1;
  return profile.strengths.includes(attribute) ? 1.06 : profile.tradeoff === attribute ? 0.96 : 1;
}
// The location programme shares the existing facility cap, not an extra bonus pool.
export function effectiveBaseTrainingMultiplier(state: GameState, attribute: string, facilityMultiplier: number) {
  const access = Math.min(1.15, facilityMultiplier * baseTrainingMultiplier(state));
  return Math.min(1.15, access * locationTrainingMultiplier(state, attribute));
}
