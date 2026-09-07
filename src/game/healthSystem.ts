import type { GameState } from '../hooks/useGameState';
export type TreatmentEffect = {
  id: string
  title: string
  cost: number
  fatigue: number
  strain: number
  burnout: number
  injuryWeeks: number
}

export const treatmentEffects: TreatmentEffect[] = [
  { id: 'treat-1', title: 'Rest', cost: 0, fatigue: 12, strain: 14, burnout: 10, injuryWeeks: 1 },
  { id: 'treat-2', title: 'Physio Treatment', cost: 180, fatigue: 9, strain: 28, burnout: 4, injuryWeeks: 2 },
  { id: 'treat-3', title: 'Reduced Training', cost: 50, fatigue: 7, strain: 18, burnout: 8, injuryWeeks: 1 },
  { id: 'treat-4', title: 'Fitness Plan', cost: 150, fatigue: 6, strain: 12, burnout: 5, injuryWeeks: 1 },
  { id: 'treat-5', title: 'Medical Review', cost: 120, fatigue: 5, strain: 20, burnout: 6, injuryWeeks: 2 },
]

export function getTreatmentEffect(optionId?: string) {
  return treatmentEffects.find((item) => item.id === optionId) ?? treatmentEffects[0]
}

export function needsHealthRecovery(state: Pick<GameState, 'player' | 'trainingCondition' | 'health'>) {
  return Boolean(state.health.activeIssue) || state.player.fatigue > 0 || state.trainingCondition.strain > 0 || state.trainingCondition.burnout > 0 || state.trainingCondition.injuryWeeks > 0;
}
export function treatmentPreview(state: GameState, optionId?: string) {
  const effect = getTreatmentEffect(optionId);
  return [
    { label: 'Fatigue', before: state.player.fatigue, after: Math.max(0, state.player.fatigue - effect.fatigue), unit: '%' },
    { label: 'Strain', before: state.trainingCondition.strain, after: Math.max(0, state.trainingCondition.strain - effect.strain), unit: '%' },
    { label: 'Burnout', before: state.trainingCondition.burnout, after: Math.max(0, state.trainingCondition.burnout - effect.burnout), unit: '%' },
    { label: 'Injury time', before: state.health.activeIssue?.weeksRemaining ?? state.trainingCondition.injuryWeeks, after: Math.max(0, (state.health.activeIssue?.weeksRemaining ?? state.trainingCondition.injuryWeeks) - effect.injuryWeeks), unit: ' wk' },
  ];
}
