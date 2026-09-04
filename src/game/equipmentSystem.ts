import { caseCatalog, chalkCatalog, cueCatalog, tipCatalog } from '../data/gameContent'
import type { EquipmentState } from '../types/game'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function getCueState(equipment: EquipmentState, cueId: string) {
  return equipment.cueStates[cueId] ?? { condition: 75, familiarity: 50, durability: 72, tipCondition: 64, shaftStraightness: 70 }
}

export function getEquipmentPerformanceProfile(equipment: EquipmentState) {
  const cue = equipment.currentCueId ? cueCatalog.find((item) => item.id === equipment.currentCueId) : null
  const chalk = equipment.currentChalkId ? chalkCatalog.find((item) => item.id === equipment.currentChalkId) : null
  const tip = equipment.currentTipId ? tipCatalog.find((item) => item.id === equipment.currentTipId) : null
  const cueState = equipment.currentCueId ? getCueState(equipment, equipment.currentCueId) : null
  const cueQuality = cue ? Object.values(cue.bonuses).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(cue.bonuses).length) : 0
  const familiarityFactor = cueState ? 0.55 + clamp(cueState.familiarity, 0, 100) / 220 : 0
  const cueConditionFactor = cueState ? clamp((cueState.condition + cueState.shaftStraightness) / 180, 0.45, 1.08) : 0
  const cueBonus = cueQuality * familiarityFactor * cueConditionFactor * 0.42
  const chalkConditionFactor = clamp(equipment.chalkCondition / 100, 0.3, 1)
  const chalkBonus = chalk ? ((chalk.grip + chalk.cleanContact + chalk.spinTransfer + chalk.consistency) / 400) * 1.4 * chalkConditionFactor : 0
  const tipConditionFactor = cueState ? clamp(cueState.tipCondition / 100, 0.35, 1) : 0
  const tipBonus = tip ? ((tip.spinControl + tip.feel + tip.consistency) / 300) * 1.4 * tipConditionFactor : 0

  return {
    totalBonus: Number(clamp(cueBonus + chalkBonus + tipBonus, 0, 9).toFixed(1)),
    cueBonus: Number(clamp(cueBonus, 0, 6).toFixed(1)),
    chalkBonus: Number(chalkBonus.toFixed(1)),
    tipBonus: Number(tipBonus.toFixed(1)),
    controlBonus: Number(clamp((chalkBonus + tipBonus) * 0.7, 0, 2).toFixed(1)),
    longPotBonus: Number(clamp(cueBonus * 0.35 + (chalk?.cleanContact ?? 0) / 130, 0, 3).toFixed(1)),
    breakBuildingBonus: Number(clamp(cueBonus * 0.35 + (tip?.spinControl ?? 0) / 120, 0, 3).toFixed(1)),
    miscueReduction: Number(clamp(((chalk?.miscueReduction ?? 0) + (tip?.miscueReduction ?? 0)) / 100, 0, 1.8).toFixed(1)),
  }
}

export function applyEquipmentMatchWear(equipment: EquipmentState, framesPlayed: number, sponsorProtection = false): EquipmentState {
  if (!equipment.currentCueId) return equipment
  const cueState = getCueState(equipment, equipment.currentCueId)
  const equipmentCase = equipment.currentCaseId ? caseCatalog.find((item) => item.id === equipment.currentCaseId) : null
  const protectionFactor = 1 - clamp((equipmentCase?.protection ?? 0) / 160 + (sponsorProtection ? 0.12 : 0), 0, 0.65)
  const usage = Math.max(1, framesPlayed)
  const chalkWear = Math.max(3, Math.round(usage * 1.4))
  const chalkDepleted = equipment.chalkCondition - chalkWear <= 0
  const currentChalkStock = equipment.currentChalkId ? equipment.chalkStock[equipment.currentChalkId] ?? 0 : 0
  const nextChalkStock = equipment.currentChalkId && chalkDepleted ? { ...equipment.chalkStock, [equipment.currentChalkId]: Math.max(0, currentChalkStock - 1) } : equipment.chalkStock
  const remainingChalkStock = equipment.currentChalkId ? nextChalkStock[equipment.currentChalkId] ?? 0 : 0

  return {
    ...equipment,
    chalkCondition: chalkDepleted && remainingChalkStock > 0 ? 100 : clamp(equipment.chalkCondition - chalkWear, 0, 100),
    chalkStock: nextChalkStock,
    cueStates: {
      ...equipment.cueStates,
      [equipment.currentCueId]: {
        ...cueState,
        condition: clamp(cueState.condition - Math.max(1, Math.round((usage / 5) * protectionFactor)), 0, 100),
        familiarity: clamp(cueState.familiarity + Math.max(1, Math.round(usage / 6)), 0, 100),
        durability: clamp(cueState.durability - Math.max(0, Math.round(usage / 14)), 0, 100),
        tipCondition: clamp(cueState.tipCondition - Math.max(1, Math.round(usage / 4)), 0, 100),
        shaftStraightness: clamp(cueState.shaftStraightness - (usage >= 9 ? Math.max(1, Math.round(protectionFactor)) : 0), 0, 100),
      },
    },
  }
}
