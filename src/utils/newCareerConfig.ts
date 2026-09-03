import { calculateOverallRating } from './calculations'
import type { AttributeSnapshot, BackgroundOption, NewCareerStartingLevel, PersonalitySlider, PlayerAttributes } from '../types/game'

type SliderOffsetMap = Record<string, number>

type AttributeProfile = {
  technical: number
  mental: number
  physical: number
  labelOffsets?: SliderOffsetMap
}

export type PlayingStyleProfile = {
  personality: string
  temperament: string
  summary: string
  impactNotes: string[]
  sliderOffsets: SliderOffsetMap
}

export type CueStyleProfile = {
  summary: string
  impactNotes: string[]
  attributeOffsets: SliderOffsetMap
}

const DEFAULT_PROFILE: PlayingStyleProfile = {
  personality: 'Complete All-Rounder',
  temperament: 'Measured and adaptable',
  summary: 'Balanced style keeps the player flexible across scoring, safety, and long tactical matches.',
  impactNotes: ['Stable under pressure', 'No major temperament bias', 'Best for flexible development plans'],
  sliderOffsets: {
    Competitiveness: 2,
    'Risk Appetite': 0,
    Perseverance: 2,
    Sportsmanship: 2,
    'Media Handling': 1,
  },
}

const PLAYING_STYLE_PROFILES: Record<string, PlayingStyleProfile> = {
  Balanced: DEFAULT_PROFILE,
  'Measured Break Builder': {
    personality: 'Methodical Constructor',
    temperament: 'Patient, process-driven, and steady',
    summary: 'Measured break builders lean toward focus, discipline, and calm frame construction rather than volatility.',
    impactNotes: ['Higher patience in long frames', 'Slightly more resilient after setbacks', 'Leans into controlled scoring phases'],
    sliderOffsets: {
      Competitiveness: 4,
      'Risk Appetite': -6,
      Perseverance: 8,
      Sportsmanship: 4,
      'Media Handling': 1,
    },
  },
  'Attacking Scorer': {
    personality: 'Front-Foot Showman',
    temperament: 'Aggressive, bold, and momentum-led',
    summary: 'Attacking scorers push the match early, take on more risk, and carry a stronger emotional swing profile.',
    impactNotes: ['Higher confidence ceiling', 'Risk appetite noticeably rises', 'Sharper sponsor and crowd appeal'],
    sliderOffsets: {
      Competitiveness: 8,
      'Risk Appetite': 12,
      Perseverance: 1,
      Sportsmanship: -2,
      'Media Handling': 6,
    },
  },
  'Safety First': {
    personality: 'Cold Match Controller',
    temperament: 'Disciplined, cautious, and tactical',
    summary: 'Safety-first players prefer control, reduce unnecessary risk, and win by dragging opponents into long tactical exchanges.',
    impactNotes: ['Lower volatility', 'Better tactical patience', 'Safer default temperament when under pressure'],
    sliderOffsets: {
      Competitiveness: 3,
      'Risk Appetite': -12,
      Perseverance: 6,
      Sportsmanship: 7,
      'Media Handling': -1,
    },
  },
}

const DEFAULT_CUE_STYLE_PROFILE: CueStyleProfile = {
  summary: 'Traditional cueing keeps the player balanced with no major technical bias at the start of the save.',
  impactNotes: ['No specialist lean', 'Steady base for all-round development', 'Best for neutral starts'],
  attributeOffsets: {},
}

const CUE_STYLE_PROFILES: Record<string, CueStyleProfile> = {
  Traditional: DEFAULT_CUE_STYLE_PROFILE,
  'Touch Focus': {
    summary: 'Touch-focused cueing sharpens feel shots and control on delicate positional play.',
    impactNotes: ['Stronger cue-ball control', 'Better touch under pressure', 'Slightly less front-foot power'],
    attributeOffsets: {
      'Cue Ball Control': 5,
      Composure: 2,
      Consistency: 2,
      'Break Building': -1,
    },
  },
  'Power Delivery': {
    summary: 'Power delivery cueing helps attack open tables harder, but asks more from touch and recovery shots.',
    impactNotes: ['Higher scoring upside', 'Long potting gets a lift', 'Fine control becomes less forgiving'],
    attributeOffsets: {
      'Long Potting': 4,
      'Break Building': 5,
      'Cue Ball Control': -2,
      'Safety Play': -1,
    },
  },
  'Compact Rhythm': {
    summary: 'Compact rhythm cueing favors repeatable timing and cleaner routine execution over pure power.',
    impactNotes: ['More repeatable mechanics', 'Stronger focus and rhythm', 'Slightly lower attacking ceiling'],
    attributeOffsets: {
      Focus: 4,
      Consistency: 4,
      'Cue Ball Control': 1,
      'Break Building': -1,
    },
  },
}

const STARTING_LEVEL_ATTRIBUTE_PROFILES: Record<NewCareerStartingLevel['stage'], AttributeProfile> = {
  1: {
    technical: -29,
    mental: -27,
    physical: -20,
    labelOffsets: {
      Professionalism: -6,
      'Big Match Nerve': -8,
      Stamina: -3,
    },
  },
  2: {
    technical: -22,
    mental: -19,
    physical: -14,
    labelOffsets: {
      Professionalism: -4,
      'Big Match Nerve': -5,
      Stamina: -2,
    },
  },
  3: {
    technical: -15,
    mental: -12,
    physical: -8,
    labelOffsets: {
      Professionalism: -2,
      'Big Match Nerve': -2,
    },
  },
  4: {
    technical: -9,
    mental: -7,
    physical: -4,
  },
  5: {
    technical: -4,
    mental: -2,
    physical: 0,
    labelOffsets: {
      Professionalism: 1,
      'Big Match Nerve': 1,
    },
  },
  6: {
    technical: -2,
    mental: 0,
    physical: 1,
    labelOffsets: {
      Professionalism: 2,
      'Big Match Nerve': 2,
      Focus: 1,
    },
  },
  7: {
    technical: 0,
    mental: 1,
    physical: 1,
    labelOffsets: {
      Professionalism: 3,
      'Big Match Nerve': 2,
      Stamina: 1,
    },
  },
  8: {
    technical: 3,
    mental: 3,
    physical: 2,
    labelOffsets: {
      Professionalism: 4,
      'Big Match Nerve': 3,
      Consistency: 2,
    },
  },
  9: {
    technical: 6,
    mental: 5,
    physical: 3,
    labelOffsets: {
      Professionalism: 5,
      'Big Match Nerve': 4,
      Composure: 3,
      Consistency: 3,
    },
  },
  10: {
    technical: 9,
    mental: 7,
    physical: 4,
    labelOffsets: {
      Professionalism: 6,
      'Big Match Nerve': 5,
      Composure: 4,
      Consistency: 4,
      'Break Building': 2,
    },
  },
  14: {
    technical: -7,
    mental: 1,
    physical: -10,
    labelOffsets: {
      Composure: 3,
      Professionalism: 5,
      'Big Match Nerve': 3,
      Stamina: -4,
      'Recovery Rate': -5,
      'Shoulder Health': -4,
    },
  },
}

const STARTING_LEVEL_OVERALL_CAPS: Record<NewCareerStartingLevel['stage'], number> = {
  1: 54,
  2: 58,
  3: 63,
  4: 68,
  5: 72,
  6: 70,
  7: 72,
  8: 74,
  9: 78,
  10: 82,
  14: 68,
}

const AGE_ATTRIBUTE_PROFILES: AttributeProfile[] = [
  {
    technical: -4,
    mental: -6,
    physical: -2,
    labelOffsets: {
      Professionalism: -4,
      'Big Match Nerve': -4,
    },
  },
  {
    technical: -2,
    mental: -3,
    physical: -1,
    labelOffsets: {
      Professionalism: -2,
      'Big Match Nerve': -2,
    },
  },
  {
    technical: -1,
    mental: -1,
    physical: 0,
  },
  {
    technical: 0,
    mental: 0,
    physical: 0,
  },
  {
    technical: -1,
    mental: 1,
    physical: -1,
  },
  {
    technical: -2,
    mental: 2,
    physical: -3,
    labelOffsets: {
      Composure: 1,
      Professionalism: 1,
      'Recovery Rate': -1,
    },
  },
  {
    technical: -3,
    mental: 3,
    physical: -6,
    labelOffsets: {
      Composure: 2,
      Professionalism: 2,
      'Recovery Rate': -3,
      Stamina: -2,
    },
  },
  {
    technical: -5,
    mental: 2,
    physical: -8,
    labelOffsets: {
      Composure: 1,
      Professionalism: 2,
      'Recovery Rate': -4,
      Stamina: -3,
      'Hand Steadiness': -1,
    },
  },
]

const AGE_PROFILE_RANGES = [13, 16, 20, 29, 39, 49, 59]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function cloneAttributes(attributes: PlayerAttributes): PlayerAttributes {
  return {
    technical: { ...attributes.technical },
    mental: { ...attributes.mental },
    physical: { ...attributes.physical },
  }
}

function adjustAttribute(attributes: PlayerAttributes, label: string, delta: number) {
  if (delta === 0) return

  for (const group of [attributes.technical, attributes.mental, attributes.physical]) {
    if (label in group) {
      group[label] = clamp(group[label] + delta, 1, 99)
      return
    }
  }
}

function applyGroupDelta(group: Record<string, number>, delta: number) {
  if (delta === 0) return

  for (const label of Object.keys(group)) {
    group[label] = clamp(group[label] + delta, 1, 99)
  }
}

function applyAttributeProfile(attributes: PlayerAttributes, profile: AttributeProfile) {
  applyGroupDelta(attributes.technical, profile.technical)
  applyGroupDelta(attributes.mental, profile.mental)
  applyGroupDelta(attributes.physical, profile.physical)

  Object.entries(profile.labelOffsets ?? {}).forEach(([label, delta]) => {
    adjustAttribute(attributes, label, delta)
  })
}

function getAgeAttributeProfile(age: number) {
  const index = AGE_PROFILE_RANGES.findIndex((maxAge) => age <= maxAge)
  return AGE_ATTRIBUTE_PROFILES[index === -1 ? AGE_ATTRIBUTE_PROFILES.length - 1 : index]
}

function applySliderEffects(attributes: PlayerAttributes, sliders: PersonalitySlider[]) {
  const sliderMap = Object.fromEntries(sliders.map((slider) => [slider.label, slider.value]))
  adjustAttribute(attributes, 'Big Match Nerve', Math.round(((sliderMap.Competitiveness ?? 50) - 50) / 10))
  adjustAttribute(attributes, 'Break Building', Math.round(((sliderMap['Risk Appetite'] ?? 50) - 50) / 12))
  adjustAttribute(attributes, 'Safety Play', -Math.round(((sliderMap['Risk Appetite'] ?? 50) - 50) / 14))
  adjustAttribute(attributes, 'Resilience', Math.round(((sliderMap.Perseverance ?? 50) - 50) / 10))
  adjustAttribute(attributes, 'Stamina', Math.round(((sliderMap.Perseverance ?? 50) - 50) / 14))
  adjustAttribute(attributes, 'Professionalism', Math.round(((sliderMap.Sportsmanship ?? 50) - 50) / 10))
  adjustAttribute(attributes, 'Focus', Math.round(((sliderMap['Media Handling'] ?? 50) - 50) / 16))
}

function lowerAllAttributes(attributes: PlayerAttributes, amount: number) {
  for (const group of [attributes.technical, attributes.mental, attributes.physical]) {
    for (const label of Object.keys(group)) {
      group[label] = clamp(group[label] - amount, 1, 99)
    }
  }
}

function applyStartingLevelOverallCap(attributes: PlayerAttributes, startingLevel: NewCareerStartingLevel, effectiveSliders: PersonalitySlider[], playingStyle: string) {
  const maxOverall = STARTING_LEVEL_OVERALL_CAPS[startingLevel.stage]
  let overall = calculateOverallRating({ attributes, personalityTraits: effectiveSliders, playingStyle })
  let guard = 0

  while (overall > maxOverall && guard < 40) {
    guard += 1
    lowerAllAttributes(attributes, 1)
    overall = calculateOverallRating({ attributes, personalityTraits: effectiveSliders, playingStyle })
  }
}

export function buildNewCareerAttributes(options: {
  starterAttributes: PlayerAttributes
  background: BackgroundOption
  startingLevel: NewCareerStartingLevel
  age: number
  sliders: PersonalitySlider[]
  cueStyle: string
  playingStyle: string
}) {
  const { age, background, cueStyle, playingStyle, sliders, starterAttributes, startingLevel } = options
  const attributes = cloneAttributes(starterAttributes)
  const effectiveSliders = applyPlayingStyleToSliders(sliders, playingStyle)

  applyAttributeProfile(attributes, STARTING_LEVEL_ATTRIBUTE_PROFILES[startingLevel.stage])
  if (startingLevel.id === 'start-bottom-tour') {
    applyAttributeProfile(attributes, {
      technical: -3,
      mental: -2,
      physical: -1,
      labelOffsets: {
        Confidence: -2,
        Consistency: -2,
        'Big Match Nerve': -2,
      },
    })
  }
  applyAttributeProfile(attributes, getAgeAttributeProfile(age))
  background.bonuses.forEach((bonus) => adjustAttribute(attributes, bonus.label, bonus.value))
  background.weaknesses.forEach((weakness) => adjustAttribute(attributes, weakness.label, weakness.value))
  applySliderEffects(attributes, effectiveSliders)
  Object.entries(getCueStyleProfile(cueStyle).attributeOffsets).forEach(([label, delta]) => {
    adjustAttribute(attributes, label, delta)
  })
  applyStartingLevelOverallCap(attributes, startingLevel, effectiveSliders, playingStyle)

  return attributes
}

export function buildAttributeSnapshots(attributes: PlayerAttributes, labels: string[]): AttributeSnapshot[] {
  return labels.map((label) => ({
    label,
    value:
      attributes.technical[label]
      ?? attributes.mental[label]
      ?? attributes.physical[label]
      ?? 0,
  }))
}

export function calculateAttributeOverall(attributes: PlayerAttributes) {
  const values = [
    ...Object.values(attributes.technical),
    ...Object.values(attributes.mental),
    ...Object.values(attributes.physical),
  ]

  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length))
}

export function getPlayingStyleProfile(playingStyle: string): PlayingStyleProfile {
  return PLAYING_STYLE_PROFILES[playingStyle] ?? DEFAULT_PROFILE
}

export function getCueStyleProfile(cueStyle: string): CueStyleProfile {
  return CUE_STYLE_PROFILES[cueStyle] ?? DEFAULT_CUE_STYLE_PROFILE
}

export function getPlayingStyleSliderDelta(playingStyle: string, sliderLabel: string) {
  const profile = getPlayingStyleProfile(playingStyle)
  return profile.sliderOffsets[sliderLabel] ?? 0
}

export function getCueStyleAttributeDelta(cueStyle: string, attributeLabel: string) {
  const profile = getCueStyleProfile(cueStyle)
  return profile.attributeOffsets[attributeLabel] ?? 0
}

export function applyPlayingStyleToSliders(sliders: PersonalitySlider[], playingStyle: string): PersonalitySlider[] {
  return sliders.map((slider) => ({
    ...slider,
    value: clamp(slider.value + getPlayingStyleSliderDelta(playingStyle, slider.label), 20, 90),
  }))
}

export function buildCareerPersonality(backgroundPersonality: string, playingStyle: string) {
  const profile = getPlayingStyleProfile(playingStyle)
  return backgroundPersonality ? `${profile.personality} · ${backgroundPersonality}` : profile.personality
}

export function isStartingLevelEligible(level: NewCareerStartingLevel, age: number) {
  return age >= level.minAge && age <= level.maxAge
}

export function getEligibleStartingLevels(levels: NewCareerStartingLevel[], age: number) {
  return levels.filter((level) => isStartingLevelEligible(level, age))
}

export function getValidatedStartingLevel(levels: NewCareerStartingLevel[], age: number, requestedId?: string) {
  const eligibleLevels = getEligibleStartingLevels(levels, age)
  const requestedLevel = eligibleLevels.find((level) => level.id === requestedId)

  if (requestedLevel) return requestedLevel
  if (eligibleLevels.length > 0) return eligibleLevels[eligibleLevels.length - 1]

  return levels[0]
}
