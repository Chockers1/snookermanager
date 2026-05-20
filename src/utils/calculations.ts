import type { PersonalitySlider, PlayerAttributes } from '../types/game'

export function calculateAverage(values: number[]): number {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function buildTraitMap(traits?: PersonalitySlider[]) {
  return Object.fromEntries((traits ?? []).map((trait) => [trait.label, trait.value]))
}

function getPlayingStyleRatingBonus(playingStyle?: string) {
  switch (playingStyle) {
    case 'Measured Break Builder':
      return 1
    case 'Attacking Scorer':
      return 1
    case 'Safety First':
      return 1
    default:
      return 0
  }
}

function getAgePotentialBonus(age?: number) {
  if (age == null) return 0
  if (age <= 16) return 8
  if (age <= 20) return 6
  if (age <= 24) return 5
  if (age <= 29) return 4
  if (age <= 34) return 2
  if (age <= 39) return 0
  if (age <= 49) return -2
  return -5
}

function getAgePotentialFloor(age: number | undefined, overallRating: number) {
  if (age == null) return overallRating + 1
  if (age <= 14) return Math.max(92, overallRating + 40)
  if (age <= 16) return Math.max(88, overallRating + 34)
  if (age <= 18) return Math.max(84, overallRating + 28)
  if (age <= 21) return Math.max(78, overallRating + 18)
  if (age <= 24) return Math.max(72, overallRating + 13)
  return overallRating + 1
}

function getPersonalityKeywordBonus(personalityType?: string) {
  if (!personalityType) return 0

  const personality = personalityType.toLowerCase()
  let bonus = 0

  if (personality.includes('determined') || personality.includes('disciplined')) bonus += 1
  if (personality.includes('relentless') || personality.includes('driven')) bonus += 1
  if (personality.includes('professional')) bonus += 1

  return bonus
}

export function calculateOverallRatingFromAverages(params: {
  technicalAverage: number
  mentalAverage: number
  physicalAverage: number
  personalityTraits?: PersonalitySlider[]
  playingStyle?: string
}) {
  const { technicalAverage, mentalAverage, physicalAverage, personalityTraits, playingStyle } = params
  const traitMap = buildTraitMap(personalityTraits)
  const competitiveness = (traitMap.Competitiveness ?? 50) - 50
  const perseverance = (traitMap.Perseverance ?? 50) - 50
  const sportsmanship = (traitMap.Sportsmanship ?? 50) - 50
  const mediaHandling = (traitMap['Media Handling'] ?? 50) - 50
  const riskAppetite = Math.abs((traitMap['Risk Appetite'] ?? 50) - 54)
  const traitModifier =
    competitiveness * 0.05 +
    perseverance * 0.06 +
    sportsmanship * 0.03 +
    mediaHandling * 0.02 -
    riskAppetite * 0.015

  const baseRating = technicalAverage * 0.46 + mentalAverage * 0.34 + physicalAverage * 0.2

  return clamp(Math.round(baseRating + traitModifier + getPlayingStyleRatingBonus(playingStyle)), 1, 99)
}

export function calculatePotentialRatingFromProfile(params: {
  overallRating: number
  mentalAverage: number
  personalityTraits?: PersonalitySlider[]
  age?: number
  playingStyle?: string
  personalityType?: string
}) {
  const { age, mentalAverage, personalityTraits, personalityType, playingStyle, overallRating } = params
  const traitMap = buildTraitMap(personalityTraits)
  const perseverance = (traitMap.Perseverance ?? 50) - 50
  const competitiveness = (traitMap.Competitiveness ?? 50) - 50
  const sportsmanship = (traitMap.Sportsmanship ?? 50) - 50
  const mediaHandling = (traitMap['Media Handling'] ?? 50) - 50
  const growthModifier = perseverance * 0.11 + competitiveness * 0.08 + sportsmanship * 0.05 + mediaHandling * 0.03
  const mentalBonus = (mentalAverage - 70) * 0.12
  const potential =
    overallRating +
    5 +
    getAgePotentialBonus(age) +
    Math.round(growthModifier / 4) +
    Math.round(mentalBonus) +
    getPlayingStyleRatingBonus(playingStyle) +
    getPersonalityKeywordBonus(personalityType)

  return clamp(Math.max(overallRating + 1, potential, getAgePotentialFloor(age, overallRating)), overallRating, 99)
}

export function calculateOverallRating(params: {
  attributes: PlayerAttributes
  personalityTraits?: PersonalitySlider[]
  playingStyle?: string
}) {
  const { attributes, personalityTraits, playingStyle } = params
  const technicalAverage = calculateAverage(Object.values(attributes.technical))
  const mentalAverage = calculateAverage(Object.values(attributes.mental))
  const physicalAverage = calculateAverage(Object.values(attributes.physical))

  return calculateOverallRatingFromAverages({
    technicalAverage,
    mentalAverage,
    physicalAverage,
    personalityTraits,
    playingStyle,
  })
}

export function calculatePotentialRating(params: {
  attributes: PlayerAttributes
  personalityTraits?: PersonalitySlider[]
  age?: number
  playingStyle?: string
  personalityType?: string
  overallRating?: number
}) {
  const { age, attributes, personalityTraits, personalityType, playingStyle } = params
  const overallRating = params.overallRating ?? calculateOverallRating({ attributes, personalityTraits, playingStyle })
  const mentalAverage = calculateAverage(Object.values(attributes.mental))

  return calculatePotentialRatingFromProfile({
    overallRating,
    mentalAverage,
    personalityTraits,
    age,
    playingStyle,
    personalityType,
  })
}

export function calculateTechnicalAverage(attributes: Record<string, number>): number {
  return calculateAverage(Object.values(attributes))
}

export function calculateEffectiveAttribute(
  base: number,
  equipmentBonus = 0,
  coachBonus = 0,
  fatiguePenalty = 0,
): number {
  return Math.max(1, Math.min(100, base + equipmentBonus + coachBonus - fatiguePenalty))
}

export function calculateMatchStrength(params: {
  technical: number
  mental: number
  physical: number
  confidence: number
  fatigue: number
  equipmentBonus: number
}): number {
  const fatiguePenalty = params.fatigue * 0.25

  return Math.round(
    params.technical * 0.4 +
      params.mental * 0.3 +
      params.physical * 0.15 +
      params.confidence * 0.1 +
      params.equipmentBonus -
      fatiguePenalty,
  )
}