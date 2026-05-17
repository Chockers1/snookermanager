import type { PlayerAttributes } from '../src/types/game'
import {
  calculateAverage,
  calculateMatchStrength,
  calculateOverallRating,
  calculateTechnicalAverage,
} from '../src/utils/calculations'
import { convertMatchWinProbabilityToFrameWinProbability } from '../src/utils/matchOutcomeModel'

export type ProfileTier =
  | 'Youth'
  | 'Amateur'
  | 'Q Tour'
  | 'Rookie Pro'
  | 'Top 64'
  | 'Top 32'
  | 'Top 16'
  | 'Top 4'
  | 'World Champion'
  | 'Veteran Min Support'

export type ProfileStyle =
  | 'Scorer'
  | 'Tactical'
  | 'Break Builder'
  | 'Counter'
  | 'Nerve'
  | 'Stamina'

export type MatchupDefinition = {
  label: string
  playerTier: ProfileTier
  opponentTier: ProfileTier
}

export type SyntheticProfile = {
  tier: ProfileTier
  style: ProfileStyle
  overall: number
  technical: number
  mental: number
  physical: number
  confidence: number
  fatigue: number
  equipmentBonus: number
  strength: number
  attributes: PlayerAttributes
  summary: string
}

export type BaselineSimulationResult = {
  frameWinChance: number
  playerFrames: number
  opponentFrames: number
  playerWon: boolean
  decidingFrame: boolean
  whitewash: boolean
}

export const MATCHUPS: MatchupDefinition[] = [
  { label: 'Youth vs Youth', playerTier: 'Youth', opponentTier: 'Youth' },
  { label: 'Youth vs Amateur', playerTier: 'Youth', opponentTier: 'Amateur' },
  { label: 'Youth vs Top 64', playerTier: 'Youth', opponentTier: 'Top 64' },
  { label: 'Amateur vs Q Tour', playerTier: 'Amateur', opponentTier: 'Q Tour' },
  { label: 'Q Tour vs Rookie Pro', playerTier: 'Q Tour', opponentTier: 'Rookie Pro' },
  { label: 'Rookie Pro vs Top 64', playerTier: 'Rookie Pro', opponentTier: 'Top 64' },
  { label: 'Top 64 vs Top 32', playerTier: 'Top 64', opponentTier: 'Top 32' },
  { label: 'Top 32 vs Top 16', playerTier: 'Top 32', opponentTier: 'Top 16' },
  { label: 'Top 16 vs Top 4', playerTier: 'Top 16', opponentTier: 'Top 4' },
  { label: 'Veteran Min Support vs World Champion', playerTier: 'Veteran Min Support', opponentTier: 'World Champion' },
]

export const PROFILE_STYLES: ProfileStyle[] = ['Scorer', 'Tactical', 'Break Builder', 'Counter', 'Nerve', 'Stamina']
export const CALIBRATION_FORMATS = [7, 9, 11, 19, 25, 33, 35] as const

const TECHNICAL_KEYS = ['Long Potting', 'Break Building', 'Cue Ball Control', 'Safety Play', 'Consistency'] as const
const MENTAL_KEYS = ['Focus', 'Composure', 'Big Match Nerve', 'Resilience', 'Professionalism'] as const
const PHYSICAL_KEYS = ['Stamina', 'Recovery Rate', 'Balance', 'Hand Steadiness', 'Shoulder Health'] as const

const PROFILE_BASELINES: Record<ProfileTier, { technical: number; mental: number; physical: number; confidence: number; fatigue: number; equipmentBonus: number }> = {
  Youth: { technical: 57, mental: 54, physical: 58, confidence: 56, fatigue: 14, equipmentBonus: 0 },
  Amateur: { technical: 63, mental: 60, physical: 61, confidence: 59, fatigue: 15, equipmentBonus: 1 },
  'Q Tour': { technical: 69, mental: 66, physical: 65, confidence: 62, fatigue: 16, equipmentBonus: 2 },
  'Rookie Pro': { technical: 74, mental: 70, physical: 68, confidence: 64, fatigue: 18, equipmentBonus: 3 },
  'Top 64': { technical: 79, mental: 75, physical: 71, confidence: 67, fatigue: 18, equipmentBonus: 4 },
  'Top 32': { technical: 83, mental: 79, physical: 73, confidence: 70, fatigue: 17, equipmentBonus: 5 },
  'Top 16': { technical: 88, mental: 84, physical: 76, confidence: 73, fatigue: 16, equipmentBonus: 6 },
  'Top 4': { technical: 91, mental: 87, physical: 79, confidence: 76, fatigue: 15, equipmentBonus: 7 },
  'World Champion': { technical: 94, mental: 91, physical: 82, confidence: 79, fatigue: 14, equipmentBonus: 8 },
  'Veteran Min Support': { technical: 80, mental: 76, physical: 67, confidence: 62, fatigue: 24, equipmentBonus: 7 },
}

const STYLE_OFFSETS: Record<ProfileStyle, {
  technical: Partial<Record<(typeof TECHNICAL_KEYS)[number], number>>
  mental: Partial<Record<(typeof MENTAL_KEYS)[number], number>>
  physical: Partial<Record<(typeof PHYSICAL_KEYS)[number], number>>
  playingStyle: string
}> = {
  Scorer: {
    technical: { 'Long Potting': 5, 'Break Building': 7, 'Cue Ball Control': 2, 'Safety Play': -4, Consistency: 1 },
    mental: { Focus: 1, Composure: -1, 'Big Match Nerve': 1 },
    physical: { Stamina: 1, 'Hand Steadiness': 1 },
    playingStyle: 'Attacking Scorer',
  },
  Tactical: {
    technical: { 'Long Potting': -2, 'Break Building': -3, 'Cue Ball Control': 4, 'Safety Play': 7, Consistency: 2 },
    mental: { Focus: 3, Composure: 3, 'Big Match Nerve': 1, Professionalism: 2 },
    physical: { Balance: 2, 'Hand Steadiness': 2 },
    playingStyle: 'Safety First',
  },
  'Break Builder': {
    technical: { 'Long Potting': 2, 'Break Building': 8, 'Cue Ball Control': 5, 'Safety Play': -2, Consistency: 3 },
    mental: { Focus: 2, Composure: 1 },
    physical: { Stamina: 2, Balance: 1 },
    playingStyle: 'Measured Break Builder',
  },
  Counter: {
    technical: { 'Long Potting': 1, 'Break Building': 1, 'Cue Ball Control': 4, 'Safety Play': 3, Consistency: 4 },
    mental: { Focus: 3, Composure: 2, Resilience: 3 },
    physical: { Balance: 2, 'Hand Steadiness': 2 },
    playingStyle: 'Balanced Match Player',
  },
  Nerve: {
    technical: { Consistency: 2, 'Cue Ball Control': 1 },
    mental: { Focus: 2, Composure: 5, 'Big Match Nerve': 6, Resilience: 2 },
    physical: { 'Hand Steadiness': 3 },
    playingStyle: 'Balanced Match Player',
  },
  Stamina: {
    technical: { Consistency: 1, 'Cue Ball Control': 1 },
    mental: { Focus: 1, Professionalism: 2 },
    physical: { Stamina: 6, 'Recovery Rate': 4, Balance: 2, 'Shoulder Health': 2 },
    playingStyle: 'Balanced Match Player',
  },
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}

export function createSeededRandom(seed: number) {
  let current = seed >>> 0

  return () => {
    current += 0x6d2b79f5
    let value = current
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function buildAttributeGroup<T extends string>(
  keys: readonly T[],
  baseValue: number,
  offsets: Partial<Record<T, number>>,
  seed: number,
) {
  const random = createSeededRandom(seed)

  return Object.fromEntries(keys.map((key) => {
    const jitter = Math.round((random() - 0.5) * 6)
    const offset = offsets[key] ?? 0
    return [key, clamp(baseValue + offset + jitter, 1, 99)]
  })) as Record<T, number>
}

export function buildSyntheticProfile(tier: ProfileTier, style: ProfileStyle, seed: number): SyntheticProfile {
  const baseline = PROFILE_BASELINES[tier]
  const styleOffsets = STYLE_OFFSETS[style]
  const attributes: PlayerAttributes = {
    technical: buildAttributeGroup(TECHNICAL_KEYS, baseline.technical, styleOffsets.technical, seed * 11 + 1),
    mental: buildAttributeGroup(MENTAL_KEYS, baseline.mental, styleOffsets.mental, seed * 11 + 2),
    physical: buildAttributeGroup(PHYSICAL_KEYS, baseline.physical, styleOffsets.physical, seed * 11 + 3),
  }
  const technical = calculateTechnicalAverage(attributes.technical)
  const mental = calculateAverage(Object.values(attributes.mental))
  const physical = calculateAverage(Object.values(attributes.physical))
  const confidence = clamp(baseline.confidence + Math.round((createSeededRandom(seed * 11 + 4)() - 0.5) * 8), 25, 99)
  const fatigue = clamp(baseline.fatigue + Math.round((createSeededRandom(seed * 11 + 5)() - 0.5) * 6), 0, 99)
  const equipmentBonus = baseline.equipmentBonus
  const overall = calculateOverallRating({ attributes, playingStyle: styleOffsets.playingStyle })
  const strength = calculateMatchStrength({ technical, mental, physical, confidence, fatigue, equipmentBonus })

  return {
    tier,
    style,
    overall,
    technical,
    mental,
    physical,
    confidence,
    fatigue,
    equipmentBonus,
    strength,
    attributes,
    summary: `LP ${attributes.technical['Long Potting']}, BB ${attributes.technical['Break Building']}, SAF ${attributes.technical['Safety Play']}, COMP ${attributes.mental.Composure}, STM ${attributes.physical.Stamina}`,
  }
}

export function getBaselineMatchWinChance(playerStrength: number, opponentStrength: number) {
  return clamp(50 + (playerStrength - opponentStrength) * 1.18, 14, 84)
}

export function simulateBaselineMatch(winChance: number, bestOf: number, random: () => number): BaselineSimulationResult {
  const frameWinChance = convertMatchWinProbabilityToFrameWinProbability(winChance, bestOf)
  const frameProbability = frameWinChance / 100
  const framesNeeded = Math.ceil(bestOf / 2)
  let playerFrames = 0
  let opponentFrames = 0

  while (playerFrames < framesNeeded && opponentFrames < framesNeeded) {
    if (random() < frameProbability) {
      playerFrames += 1
    } else {
      opponentFrames += 1
    }
  }

  return {
    frameWinChance,
    playerFrames,
    opponentFrames,
    playerWon: playerFrames > opponentFrames,
    decidingFrame: Math.max(playerFrames, opponentFrames) === framesNeeded && Math.min(playerFrames, opponentFrames) === framesNeeded - 1,
    whitewash: Math.min(playerFrames, opponentFrames) === 0,
  }
}

export function getAverageScoreline(playerScores: number[], opponentScores: number[]) {
  if (playerScores.length === 0) return '0.0-0.0'
  const averagePlayer = playerScores.reduce((sum, value) => sum + value, 0) / playerScores.length
  const averageOpponent = opponentScores.reduce((sum, value) => sum + value, 0) / opponentScores.length
  return `${averagePlayer.toFixed(1)}-${averageOpponent.toFixed(1)}`
}

export function getCalibrationTargetBand(matchup: string, bestOf: number) {
  switch (matchup) {
    case 'Youth vs Youth':
      return { min: 45, max: 55 }
    case 'Youth vs Amateur':
      return { min: 30, max: 45 }
    case 'Youth vs Top 64':
      return bestOf >= 19 ? { min: 3, max: 12 } : { min: 10, max: 25 }
    case 'Amateur vs Q Tour':
      return { min: 30, max: 45 }
    case 'Q Tour vs Rookie Pro':
      return { min: 30, max: 45 }
    case 'Rookie Pro vs Top 64':
      return { min: 25, max: 40 }
    case 'Top 64 vs Top 32':
      return { min: 35, max: 45 }
    case 'Top 32 vs Top 16':
      return { min: 30, max: 42 }
    case 'Top 16 vs Top 4':
      return { min: 30, max: 42 }
    case 'Veteran Min Support vs World Champion':
      return bestOf >= 19 ? { min: 3, max: 15 } : { min: 10, max: 25 }
    default:
      return null
  }
}