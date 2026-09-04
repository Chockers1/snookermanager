import { tableSetupCatalog } from '../data/gameContent'
import type { EquipmentState, TrainingConditionState } from '../types/game'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function getTrainingAdaptationMultiplier(fatigue: number, strain: number, burnout: number) {
  const fatigueMultiplier = fatigue >= 85 ? 0.2 : fatigue >= 70 ? 0.45 : fatigue >= 55 ? 0.72 : 1
  const strainMultiplier = strain >= 80 ? 0.45 : strain >= 55 ? 0.7 : 1
  const burnoutMultiplier = burnout >= 70 ? 0.55 : burnout >= 45 ? 0.8 : 1
  return Number(clamp(fatigueMultiplier * strainMultiplier * burnoutMultiplier, 0.15, 1).toFixed(2))
}

export function getFacilityTrainingMultiplier(equipment: EquipmentState) {
  const facility = equipment.currentTableId ? tableSetupCatalog.find((item) => item.id === equipment.currentTableId) : null
  if (!facility) return 0.92
  const quality = (facility.clothSpeed + facility.cushionResponse + facility.napQuality + (100 - facility.pocketForgiveness)) / 4
  return Number(clamp(0.88 + quality / 350, 0.95, 1.15).toFixed(2))
}

export function recoverTrainingCondition(condition: TrainingConditionState, recoverySupport = 0): TrainingConditionState {
  return {
    ...condition,
    rollingLoad: Math.round(condition.rollingLoad * 0.72),
    strain: clamp(condition.strain - 8 - recoverySupport * 2, 0, 100),
    injuryWeeks: Math.max(0, condition.injuryWeeks - 1),
    burnout: clamp(condition.burnout - 5, 0, 100),
  }
}
