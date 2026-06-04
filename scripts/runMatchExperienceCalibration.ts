import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  simulateSyntheticLiveVisitMatch,
  type ConstructedLiveVisitProfile,
  type SyntheticLiveVisitFrameSummary,
  type SyntheticLiveVisitMatchResult,
} from '../src/hooks/useGameState'
import type { PlayerAttributes } from '../src/types/game'
import { SIMULATION_MODE } from '../src/utils/simulationMode'
import {
  calculateAverage,
  calculateMatchStrength,
  calculateOverallRating,
  calculateTechnicalAverage,
} from '../src/utils/calculations'
import {
  buildSyntheticProfile,
  clamp,
  getBaselineMatchWinChance,
  type ProfileStyle,
  type ProfileTier,
  type SyntheticProfile,
} from './matchSimulationShared'

type ExperienceProfileTemplate = {
  name: string
  tier: ProfileTier
  style: ProfileStyle
  rankBand?: string
  ranking?: number
  confidence?: number
  confidenceDelta?: number
  fatigue?: number
  fatigueDelta?: number
  equipmentBonus?: number
  technicalDelta?: Partial<PlayerAttributes['technical']>
  mentalDelta?: Partial<PlayerAttributes['mental']>
  physicalDelta?: Partial<PlayerAttributes['physical']>
}

type ExperienceProfile = SyntheticProfile & {
  name: string
  rankBand: string
  ranking: number
}

type MatchExperienceConfig = {
  id: string
  label: string
  player: ExperienceProfileTemplate
  opponent: ExperienceProfileTemplate
  sampleFormat: number
  sampleRound?: 'Quarter Final' | 'Semi Final' | 'Final'
}

type PressureScenarioConfig = {
  id: string
  label: string
  matchupId: string
  bestOf: number
  initialPlayerFrames: number
  initialOpponentFrames: number
  round?: 'Quarter Final' | 'Semi Final' | 'Final'
  initialPressureValue?: number
}

type MatchExperienceRow = {
  matchupId: string
  matchup: string
  bestOf: number
  playerName: string
  opponentName: string
  playerStyle: string
  opponentStyle: string
  expectedWinRate: number
  frameWinChance: number
  actualWinRate: number
  playerFrames: number
  opponentFrames: number
  framesPlayed: number
  averageScoreline: string
  favouriteSide: 'Player' | 'Opponent'
  favouriteWon: boolean
  underdogWon: boolean
  decidingFrame: boolean
  whitewash: boolean
  comebackWin: boolean
  upset: boolean
  technicalGap: number
  mentalGap: number
  physicalGap: number
  confidenceGap: number
  fatigueGap: number
  pressureGap: number
  safetyGap: number
  breakBuildingGap: number
  tacticalGap: number
  playerStrength: number
  opponentStrength: number
  momentumSwings: number
  playerConfidenceSwing: number
  opponentConfidenceSwing: number
  playerFatigueChange: number
  opponentFatigueChange: number
  pressureEvents: number
  deciderPressureEvents: number
  framesWonFromBehind: number
  framesLostFromWinningPosition: number
  closeFramesWon: number
  closeFramesLost: number
  playerHighBreak: number
  opponentHighBreak: number
  topReason: string
}

type MatchExperienceSummary = {
  matchupId: string
  matchup: string
  bestOf: number
  playerStyle: string
  opponentStyle: string
  expectedWinRate: number
  averageFrameWinChance: number
  actualFrameWinRate: number
  actualWinRate: number
  difference: number
  averageScoreline: string
  averageFramesPlayed: number
  favouriteWinRate: number
  underdogWinRate: number
  decidingFrameRate: number
  whitewashRate: number
  comebackWinRate: number
  upsetRate: number
  technicalGap: number
  mentalGap: number
  physicalGap: number
  confidenceGap: number
  fatigueGap: number
  pressureGap: number
  safetyGap: number
  breakBuildingGap: number
  tacticalGap: number
  playerStrength: number
  opponentStrength: number
  averageMomentumSwings: number
  playerConfidenceSwing: number
  opponentConfidenceSwing: number
  playerFatigueChange: number
  opponentFatigueChange: number
  pressureEvents: number
  deciderPressureEvents: number
  framesWonFromBehind: number
  framesLostFromWinningPosition: number
  closeFramesWon: number
  closeFramesLost: number
}

type FormatEffectDiagnostic = {
  matchup: string
  expectedDirection: string
  actualDirection: string
  valid: boolean
  shortActualWinRate: number
  longActualWinRate: number
  shortFavouriteWinRate: number
  longFavouriteWinRate: number
  shortFrameDrift: number
  longFrameDrift: number
}

type MatchFeelVerdictRow = {
  area: string
  plausible: boolean
  evidence: string
}

type ScenarioRow = {
  scenarioId: string
  label: string
  matchup: string
  bestOf: number
  startScore: string
  conversion: boolean
  comeback: boolean
  collapse: boolean
  pressureErrors: number
  playerConfidenceSwing: number
  opponentConfidenceSwing: number
}

type ScenarioSummary = {
  label: string
  matchup: string
  bestOf: number
  startScore: string
  conversionRate: number
  comebackRate: number
  collapseRate: number
  pressureErrors: number
  playerConfidenceSwing: number
  opponentConfidenceSwing: number
}

type FactorImpact = {
  factor: string
  gap: number
  impact: number
}

type SampleReport = {
  matchup: MatchExperienceConfig
  bestOf: number
  player: ExperienceProfile
  opponent: ExperienceProfile
  result: SyntheticLiveVisitMatchResult
  expectedWinRate: number
  impacts: FactorImpact[]
  keyAdvantage: FactorImpact | null
  keyRisk: FactorImpact | null
  topReasons: string[]
  trainingAdvice: string
  explanationVerdict: 'explanation good' | 'explanation too generic' | 'explanation does not match match data' | 'explanation missing pressure/confidence/fatigue context'
}

const MATCHES_PER_FORMAT = 100
const SCENARIO_RUNS = 100
const FORMATS = [5, 7, 11, 19, 25, 35] as const

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')
const reportsDir = path.join(workspaceRoot, 'docs', 'reports')
const markdownPath = path.join(reportsDir, 'match-experience-calibration.md')
const csvPath = path.join(reportsDir, 'match-experience-calibration.csv')

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatSigned(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function percent(numerator: number, denominator: number) {
  if (denominator === 0) return 0
  return numerator / denominator * 100
}

function getSyntheticRanking(tier: ProfileTier) {
  switch (tier) {
    case 'Youth': return 180
    case 'Amateur': return 128
    case 'Q Tour': return 96
    case 'Rookie Pro': return 72
    case 'Top 64': return 48
    case 'Top 32': return 24
    case 'Top 16': return 12
    case 'Top 4': return 3
    case 'World Champion': return 1
    case 'Veteran Min Support': return 56
    default: return 64
  }
}

function getClutch(attributes: PlayerAttributes) {
  return Math.round((attributes.mental['Big Match Nerve'] + attributes.mental.Composure + attributes.mental.Focus) / 3)
}

function getTacticalPlanFromStyle(style: ProfileStyle): 'Attack' | 'Balanced' | 'Safety' {
  if (style === 'Scorer' || style === 'Break Builder') return 'Attack'
  if (style === 'Tactical') return 'Safety'
  return 'Balanced'
}

function cloneAttributes(attributes: PlayerAttributes): PlayerAttributes {
  return {
    technical: { ...attributes.technical },
    mental: { ...attributes.mental },
    physical: { ...attributes.physical },
  }
}

function applyDelta<T extends Record<string, number>>(group: T, delta?: Partial<Record<keyof T, number>>) {
  if (!delta) return
  Object.entries(delta).forEach(([key, value]) => {
    if (typeof value !== 'number') return
    const typedKey = key as keyof T
    group[typedKey] = clamp(group[typedKey] + value, 1, 99)
  })
}

function buildExperienceProfile(template: ExperienceProfileTemplate, seed: number): ExperienceProfile {
  const base = buildSyntheticProfile(template.tier, template.style, seed)
  const attributes = cloneAttributes(base.attributes)
  applyDelta(attributes.technical, template.technicalDelta)
  applyDelta(attributes.mental, template.mentalDelta)
  applyDelta(attributes.physical, template.physicalDelta)
  const technical = calculateTechnicalAverage(attributes.technical)
  const mental = calculateAverage(Object.values(attributes.mental))
  const physical = calculateAverage(Object.values(attributes.physical))
  const confidence = template.confidence ?? clamp(base.confidence + (template.confidenceDelta ?? 0), 25, 99)
  const fatigue = template.fatigue ?? clamp(base.fatigue + (template.fatigueDelta ?? 0), 0, 99)
  const equipmentBonus = template.equipmentBonus ?? base.equipmentBonus
  const overall = calculateOverallRating({ attributes, playingStyle: template.style })
  const strength = calculateMatchStrength({ technical, mental, physical, confidence, fatigue, equipmentBonus })

  return {
    ...base,
    name: template.name,
    tier: template.tier,
    style: template.style,
    overall,
    technical,
    mental,
    physical,
    confidence,
    fatigue,
    equipmentBonus,
    strength,
    attributes,
    rankBand: template.rankBand ?? template.tier,
    ranking: template.ranking ?? getSyntheticRanking(template.tier),
    summary: `LP ${attributes.technical['Long Potting']}, BB ${attributes.technical['Break Building']}, SAF ${attributes.technical['Safety Play']}, COMP ${attributes.mental.Composure}, STM ${attributes.physical.Stamina}`,
  }
}

function buildFactorImpacts(player: ConstructedLiveVisitProfile, opponent: ConstructedLiveVisitProfile, bestOf: number, playerStrength: number, opponentStrength: number): FactorImpact[] {
  const confidenceGap = player.confidence - opponent.confidence
  const fatigueGap = player.fatigue - opponent.fatigue
  return [
    { factor: 'Technical', gap: player.technicalAverage - opponent.technicalAverage, impact: Math.round((player.technicalAverage - opponent.technicalAverage) * 0.35) },
    { factor: 'Mental', gap: player.mentalAverage - opponent.mentalAverage, impact: Math.round((player.mentalAverage - opponent.mentalAverage) * 0.32) },
    { factor: 'Physical', gap: player.physicalAverage - opponent.physicalAverage, impact: Math.round((player.physicalAverage - opponent.physicalAverage) * 0.24) },
    { factor: 'Confidence', gap: confidenceGap, impact: Math.round(confidenceGap * 0.3) },
    { factor: 'Fatigue', gap: fatigueGap, impact: Math.round((opponent.fatigue - player.fatigue) * 0.28) },
    { factor: 'Pressure', gap: player.pressureHandling - opponent.pressureHandling, impact: Math.round((player.pressureHandling - opponent.pressureHandling) * 0.28) },
    { factor: 'Safety', gap: player.safety - opponent.safety, impact: Math.round((player.safety - opponent.safety) * 0.22) },
    { factor: 'Break building', gap: player.breakBuilding - opponent.breakBuilding, impact: Math.round((player.breakBuilding - opponent.breakBuilding) * 0.22) },
    { factor: 'Tactical fit', gap: player.tacticalRating - opponent.tacticalRating, impact: Math.round((player.tacticalRating - opponent.tacticalRating) * 0.18) },
    { factor: 'Match length', gap: bestOf, impact: Math.round((playerStrength - opponentStrength) * ((bestOf - 5) / 30) * 0.8) },
  ]
}

function getConfidenceSwing(result: SyntheticLiveVisitMatchResult, playerConfidence: number, opponentConfidence: number) {
  const playerValues = [
    playerConfidence,
    ...result.frameSummaries.flatMap((frame) => [frame.playerConfidenceStart, frame.playerConfidenceEnd]),
  ]
  const opponentValues = [
    opponentConfidence,
    ...result.frameSummaries.flatMap((frame) => [frame.opponentConfidenceStart, frame.opponentConfidenceEnd]),
  ]

  return {
    player: Math.max(...playerValues) - Math.min(...playerValues),
    opponent: Math.max(...opponentValues) - Math.min(...opponentValues),
  }
}

function analyzeTrajectory(result: SyntheticLiveVisitMatchResult, initialPlayerFrames = 0, initialOpponentFrames = 0) {
  let playerFrames = initialPlayerFrames
  let opponentFrames = initialOpponentFrames
  let maxPlayerLead = playerFrames - opponentFrames
  let minPlayerLead = playerFrames - opponentFrames
  let lastLeader = Math.sign(playerFrames - opponentFrames)
  let momentumSwings = 0
  let framesWonFromBehind = 0
  let framesLostFromWinningPosition = 0
  let closeFramesWon = 0
  let closeFramesLost = 0

  result.frameSummaries.forEach((frame) => {
    if (frame.winner === 'Player') {
      playerFrames += 1
    } else {
      opponentFrames += 1
    }

    const lead = playerFrames - opponentFrames
    const leader = Math.sign(lead)
    if (leader !== 0 && lastLeader !== 0 && leader !== lastLeader) {
      momentumSwings += 1
    }
    if (leader !== 0) {
      lastLeader = leader
    }
    maxPlayerLead = Math.max(maxPlayerLead, lead)
    minPlayerLead = Math.min(minPlayerLead, lead)

    if (frame.winner === 'Player' && frame.winnerCameFromBehind) framesWonFromBehind += 1
    if (frame.winner === 'Opponent' && frame.winnerCameFromBehind) framesLostFromWinningPosition += 1
    if (frame.closeFrame && frame.winner === 'Player') closeFramesWon += 1
    if (frame.closeFrame && frame.winner === 'Opponent') closeFramesLost += 1
  })

  return {
    momentumSwings,
    comebackWin: result.playerWon ? minPlayerLead <= -2 : maxPlayerLead >= 2,
    framesWonFromBehind,
    framesLostFromWinningPosition,
    closeFramesWon,
    closeFramesLost,
  }
}

function getPressureEvents(result: SyntheticLiveVisitMatchResult) {
  const pressureEvents = result.fullVisitLog.filter((visit) => visit.pressureValue >= 72 && (!visit.success || visit.foulOccurred)).length
  const deciderFrame = result.frameSummaries.find((frame) => frame.decidingFrame)
  const deciderPressureEvents = deciderFrame
    ? result.fullVisitLog.filter((visit) => visit.frameLabel === `F${deciderFrame.frameNumber}` && visit.pressureValue >= 72).length
    : 0

  return { pressureEvents, deciderPressureEvents }
}

function simulateControlledMatch(
  matchup: MatchExperienceConfig,
  bestOf: number,
  seed: number,
  options?: {
    round?: 'Quarter Final' | 'Semi Final' | 'Final'
    initialPlayerFrames?: number
    initialOpponentFrames?: number
    initialPressureValue?: number
    startingPlayer?: 'player' | 'opponent'
  },
) {
  const player = buildExperienceProfile(matchup.player, seed)
  const opponent = buildExperienceProfile(matchup.opponent, seed)
  const expectedWinRate = getBaselineMatchWinChance(player.strength, opponent.strength)
  const result = simulateSyntheticLiveVisitMatch({
    simulationMode: SIMULATION_MODE.liveVisitCalibration,
    playerName: player.name,
    opponentName: opponent.name,
    playerRankBand: player.rankBand,
    opponentRankBand: opponent.rankBand,
    playerTacticalPlan: getTacticalPlanFromStyle(player.style),
    opponentTacticalPlan: getTacticalPlanFromStyle(opponent.style),
    bestOf,
    round: options?.round,
    seed,
    playerAttributes: player.attributes,
    playerEquipmentBonus: player.equipmentBonus,
    opponentAttributes: opponent.attributes,
    opponentEquipmentBonus: opponent.equipmentBonus,
    opponentProfileMode: 'attributes',
    startingPlayer: options?.startingPlayer ?? (seed % 2 === 0 ? 'opponent' : 'player'),
    playerConfidence: player.confidence,
    playerFatigue: player.fatigue,
    playerClutch: getClutch(player.attributes),
    playerStrength: player.strength,
    opponentRanking: opponent.ranking,
    opponentConfidence: opponent.confidence,
    opponentFatigue: opponent.fatigue,
    opponentClutch: getClutch(opponent.attributes),
    opponentStrength: opponent.strength,
    plannedMatchWinChance: expectedWinRate,
    preserveTacticalEdge: true,
    initialPlayerFrames: options?.initialPlayerFrames,
    initialOpponentFrames: options?.initialOpponentFrames,
    initialPressureValue: options?.initialPressureValue,
  })

  return { player, opponent, expectedWinRate, result }
}

function buildMatchRow(matchup: MatchExperienceConfig, bestOf: number, seed: number): MatchExperienceRow {
  const { player, opponent, expectedWinRate, result } = simulateControlledMatch(matchup, bestOf, seed)
  const favouriteSide = expectedWinRate >= 50 ? 'Player' : 'Opponent'
  const favouriteWon = favouriteSide === 'Player' ? result.playerWon : !result.playerWon
  const confidenceSwing = getConfidenceSwing(result, player.confidence, opponent.confidence)
  const trajectory = analyzeTrajectory(result)
  const pressureEvents = getPressureEvents(result)
  const playerProfile = result.constructedProfiles.player
  const opponentProfile = result.constructedProfiles.opponent
  const factorImpacts = buildFactorImpacts(playerProfile, opponentProfile, bestOf, player.strength, opponent.strength)
  const topReason = [...result.frameSummaries].sort((left, right) => Math.abs((right.keyBreak || 0) + (right.closeFrame ? 10 : 0)) - Math.abs((left.keyBreak || 0) + (left.closeFrame ? 10 : 0)))[0]?.reason ?? 'Match stayed balanced across the frames.'

  return {
    matchupId: matchup.id,
    matchup: matchup.label,
    bestOf,
    playerName: player.name,
    opponentName: opponent.name,
    playerStyle: player.style,
    opponentStyle: opponent.style,
    expectedWinRate,
    frameWinChance: result.frameWinChance,
    actualWinRate: result.playerWon ? 100 : 0,
    playerFrames: result.playerFrames,
    opponentFrames: result.opponentFrames,
    framesPlayed: result.playerFrames + result.opponentFrames,
    averageScoreline: `${result.playerFrames}-${result.opponentFrames}`,
    favouriteSide,
    favouriteWon,
    underdogWon: !favouriteWon,
    decidingFrame: result.decidingFrame,
    whitewash: result.whitewash,
    comebackWin: trajectory.comebackWin,
    upset: !favouriteWon,
    technicalGap: playerProfile.technicalAverage - opponentProfile.technicalAverage,
    mentalGap: playerProfile.mentalAverage - opponentProfile.mentalAverage,
    physicalGap: playerProfile.physicalAverage - opponentProfile.physicalAverage,
    confidenceGap: player.confidence - opponent.confidence,
    fatigueGap: player.fatigue - opponent.fatigue,
    pressureGap: playerProfile.pressureHandling - opponentProfile.pressureHandling,
    safetyGap: playerProfile.safety - opponentProfile.safety,
    breakBuildingGap: playerProfile.breakBuilding - opponentProfile.breakBuilding,
    tacticalGap: playerProfile.tacticalRating - opponentProfile.tacticalRating,
    playerStrength: player.strength,
    opponentStrength: opponent.strength,
    momentumSwings: trajectory.momentumSwings,
    playerConfidenceSwing: confidenceSwing.player,
    opponentConfidenceSwing: confidenceSwing.opponent,
    playerFatigueChange: result.finalState.playerFatigue - player.fatigue,
    opponentFatigueChange: result.finalState.opponentFatigue - opponent.fatigue,
    pressureEvents: pressureEvents.pressureEvents,
    deciderPressureEvents: pressureEvents.deciderPressureEvents,
    framesWonFromBehind: trajectory.framesWonFromBehind,
    framesLostFromWinningPosition: trajectory.framesLostFromWinningPosition,
    closeFramesWon: trajectory.closeFramesWon,
    closeFramesLost: trajectory.closeFramesLost,
    playerHighBreak: result.playerHighestBreak,
    opponentHighBreak: result.opponentHighestBreak,
    topReason: factorImpacts.some((impact) => Math.abs(impact.impact) >= 6) ? topReason : `${topReason} Pre-match balance stayed fairly tight.`,
  }
}

function summarizeRows(rows: MatchExperienceRow[]): MatchExperienceSummary[] {
  const groups = new Map<string, MatchExperienceRow[]>()
  rows.forEach((row) => {
    const key = `${row.matchupId}-${row.bestOf}`
    const existing = groups.get(key)
    if (existing) {
      existing.push(row)
    } else {
      groups.set(key, [row])
    }
  })

  return [...groups.values()].map((groupRows) => ({
    matchupId: groupRows[0].matchupId,
    matchup: groupRows[0].matchup,
    bestOf: groupRows[0].bestOf,
    playerStyle: groupRows[0].playerStyle,
    opponentStyle: groupRows[0].opponentStyle,
    expectedWinRate: average(groupRows.map((row) => row.expectedWinRate)),
    averageFrameWinChance: average(groupRows.map((row) => row.frameWinChance)),
    actualFrameWinRate: percent(
      groupRows.reduce((sum, row) => sum + row.playerFrames, 0),
      groupRows.reduce((sum, row) => sum + row.framesPlayed, 0),
    ),
    actualWinRate: average(groupRows.map((row) => row.actualWinRate)),
    difference: average(groupRows.map((row) => row.actualWinRate - row.expectedWinRate)),
    averageScoreline: `${average(groupRows.map((row) => row.playerFrames)).toFixed(1)}-${average(groupRows.map((row) => row.opponentFrames)).toFixed(1)}`,
    averageFramesPlayed: average(groupRows.map((row) => row.framesPlayed)),
    favouriteWinRate: percent(groupRows.filter((row) => row.favouriteWon).length, groupRows.length),
    underdogWinRate: percent(groupRows.filter((row) => row.underdogWon).length, groupRows.length),
    decidingFrameRate: percent(groupRows.filter((row) => row.decidingFrame).length, groupRows.length),
    whitewashRate: percent(groupRows.filter((row) => row.whitewash).length, groupRows.length),
    comebackWinRate: percent(groupRows.filter((row) => row.comebackWin).length, groupRows.length),
    upsetRate: percent(groupRows.filter((row) => row.upset).length, groupRows.length),
    technicalGap: average(groupRows.map((row) => row.technicalGap)),
    mentalGap: average(groupRows.map((row) => row.mentalGap)),
    physicalGap: average(groupRows.map((row) => row.physicalGap)),
    confidenceGap: average(groupRows.map((row) => row.confidenceGap)),
    fatigueGap: average(groupRows.map((row) => row.fatigueGap)),
    pressureGap: average(groupRows.map((row) => row.pressureGap)),
    safetyGap: average(groupRows.map((row) => row.safetyGap)),
    breakBuildingGap: average(groupRows.map((row) => row.breakBuildingGap)),
    tacticalGap: average(groupRows.map((row) => row.tacticalGap)),
    playerStrength: average(groupRows.map((row) => row.playerStrength)),
    opponentStrength: average(groupRows.map((row) => row.opponentStrength)),
    averageMomentumSwings: average(groupRows.map((row) => row.momentumSwings)),
    playerConfidenceSwing: average(groupRows.map((row) => row.playerConfidenceSwing)),
    opponentConfidenceSwing: average(groupRows.map((row) => row.opponentConfidenceSwing)),
    playerFatigueChange: average(groupRows.map((row) => row.playerFatigueChange)),
    opponentFatigueChange: average(groupRows.map((row) => row.opponentFatigueChange)),
    pressureEvents: average(groupRows.map((row) => row.pressureEvents)),
    deciderPressureEvents: average(groupRows.map((row) => row.deciderPressureEvents)),
    framesWonFromBehind: average(groupRows.map((row) => row.framesWonFromBehind)),
    framesLostFromWinningPosition: average(groupRows.map((row) => row.framesLostFromWinningPosition)),
    closeFramesWon: average(groupRows.map((row) => row.closeFramesWon)),
    closeFramesLost: average(groupRows.map((row) => row.closeFramesLost)),
  }))
}

function summarizeScenarios(rows: ScenarioRow[]): ScenarioSummary[] {
  const groups = new Map<string, ScenarioRow[]>()
  rows.forEach((row) => {
    const existing = groups.get(row.scenarioId)
    if (existing) {
      existing.push(row)
    } else {
      groups.set(row.scenarioId, [row])
    }
  })

  return [...groups.values()].map((groupRows) => ({
    label: groupRows[0].label,
    matchup: groupRows[0].matchup,
    bestOf: groupRows[0].bestOf,
    startScore: groupRows[0].startScore,
    conversionRate: percent(groupRows.filter((row) => row.conversion).length, groupRows.length),
    comebackRate: percent(groupRows.filter((row) => row.comeback).length, groupRows.length),
    collapseRate: percent(groupRows.filter((row) => row.collapse).length, groupRows.length),
    pressureErrors: average(groupRows.map((row) => row.pressureErrors)),
    playerConfidenceSwing: average(groupRows.map((row) => row.playerConfidenceSwing)),
    opponentConfidenceSwing: average(groupRows.map((row) => row.opponentConfidenceSwing)),
  }))
}

function getTopReasons(sample: SampleReport) {
  const reasons: string[] = []
  const playerWon = sample.result.playerWon
  const winnerLabel = playerWon ? 'Player' : 'Opponent'
  const factorOrder = [...sample.impacts].sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact))
  const winnerFactor = playerWon
    ? [...sample.impacts].sort((left, right) => right.impact - left.impact)[0] ?? null
    : [...sample.impacts].sort((left, right) => left.impact - right.impact)[0] ?? null
  if (winnerFactor && Math.abs(winnerFactor.impact) >= 2) {
    if (playerWon && winnerFactor.impact > 0) {
      reasons.push(`Player started with a usable ${winnerFactor.factor.toLowerCase()} edge (${formatSigned(winnerFactor.impact)} player impact).`)
    } else if (!playerWon && winnerFactor.impact < 0) {
      reasons.push(`Opponent exploited the pre-match ${winnerFactor.factor.toLowerCase()} gap (${formatSigned(winnerFactor.impact)} from the player view).`)
    } else if (playerWon) {
      reasons.push(`Player won despite a pre-match ${winnerFactor.factor.toLowerCase()} deficit (${formatSigned(winnerFactor.impact)} player impact).`)
    } else {
      reasons.push(`Opponent still won even though the player started with a ${winnerFactor.factor.toLowerCase()} edge (${formatSigned(winnerFactor.impact)} player impact).`)
    }
  }

  const biggestBreak = Math.max(...sample.result.frameSummaries.map((frame) => frame.keyBreak))
  if (biggestBreak >= 40) {
    reasons.push(`${winnerLabel} produced the heaviest scoring burst of the match with a ${biggestBreak} break.`)
  }

  const closeFrameWins = sample.result.frameSummaries.filter((frame) => frame.closeFrame && frame.winner === winnerLabel).length
  if (closeFrameWins > 0) {
    reasons.push(`${winnerLabel} won ${closeFrameWins} close frame${closeFrameWins === 1 ? '' : 's'} when the pressure rose.`)
  }

  const latePressureFrames = sample.result.frameSummaries.filter((frame) => frame.pressurePhase !== 'Standard' && frame.winner === winnerLabel).length
  if (latePressureFrames > 0) {
    reasons.push(`${winnerLabel} handled the later pressure phases better across ${latePressureFrames} frame${latePressureFrames === 1 ? '' : 's'}.`)
  }

  const fatigueGap = sample.player.fatigue - sample.opponent.fatigue
  if ((playerWon && fatigueGap < -4) || (!playerWon && fatigueGap > 4)) {
    reasons.push(`${winnerLabel} looked fresher once the match stretched beyond the opening phase.`)
  }

  return reasons.slice(0, 3)
}

function getTrainingAdvice(sample: SampleReport) {
  const playerLost = !sample.result.playerWon
  const weakestFactor = [...sample.impacts].sort((left, right) => left.impact - right.impact)[0]
  if (!playerLost) {
    if (!sample.keyRisk || sample.keyRisk.impact >= -1) {
      return 'No urgent weakness dominated this win; keep reinforcing repeatable scoring choices and late-frame composure.'
    }
    return `The win held up, but tighten ${sample.keyRisk.factor.toLowerCase()} so stronger opponents cannot lean on it next time.`
  }
  if (!weakestFactor) {
    return 'Prioritise cue-ball control and repeatable shot selection in pressure frames.'
  }
  if (weakestFactor.factor === 'Safety') return 'Prioritise safety exchanges and cue-ball control so the opponent gets fewer simple starters.'
  if (weakestFactor.factor === 'Break building') return 'Raise break-building conversion so good openings become frame-winning visits.'
  if (weakestFactor.factor === 'Pressure' || weakestFactor.factor === 'Mental') return 'Work on composure, focus, and late-frame routines for deciding moments.'
  if (weakestFactor.factor === 'Fatigue' || sample.player.fatigue > sample.opponent.fatigue + 4) return 'Add stamina and recovery work so long matches do not collapse late.'
  return `Train ${weakestFactor.factor.toLowerCase()} first; it was the clearest drag on this result.`
}

function getExplanationVerdict(sample: SampleReport): SampleReport['explanationVerdict'] {
  const text = sample.topReasons.join(' ').toLowerCase()
  if (sample.topReasons.length < 2) return 'explanation too generic'
  if (!/break|pressure|confidence|fatigue|close|safety|mental|technical/.test(text)) return 'explanation does not match match data'
  if ((sample.result.decidingFrame || sample.result.finalState.pressureValue >= 72) && !/pressure|confidence|fatigue|close/.test(text)) {
    return 'explanation missing pressure/confidence/fatigue context'
  }
  return 'explanation good'
}

function buildSampleReport(matchup: MatchExperienceConfig, seed: number): SampleReport {
  const { player, opponent, expectedWinRate, result } = simulateControlledMatch(matchup, matchup.sampleFormat, seed, { round: matchup.sampleRound })
  const impacts = buildFactorImpacts(result.constructedProfiles.player, result.constructedProfiles.opponent, matchup.sampleFormat, player.strength, opponent.strength)
  const keyAdvantage = [...impacts].sort((left, right) => right.impact - left.impact).find((impact) => impact.impact > 0) ?? null
  const keyRisk = [...impacts].sort((left, right) => left.impact - right.impact).find((impact) => impact.impact < 0) ?? null
  const sample: SampleReport = {
    matchup,
    bestOf: matchup.sampleFormat,
    player,
    opponent,
    result,
    expectedWinRate,
    impacts,
    keyAdvantage,
    keyRisk,
    topReasons: [],
    trainingAdvice: '',
    explanationVerdict: 'explanation good',
  }
  sample.topReasons = getTopReasons(sample)
  sample.trainingAdvice = getTrainingAdvice(sample)
  sample.explanationVerdict = getExplanationVerdict(sample)
  return sample
}

function csvEscape(value: string | number | boolean) {
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function buildCsv(matchRows: MatchExperienceRow[], scenarioRows: ScenarioRow[]) {
  const headers = [
    'rowType',
    'group',
    'label',
    'bestOf',
    'playerName',
    'opponentName',
    'expectedWinRate',
    'frameWinChance',
    'actualWinRate',
    'playerFrames',
    'opponentFrames',
    'favouriteSide',
    'favouriteWon',
    'underdogWon',
    'decidingFrame',
    'whitewash',
    'comebackWin',
    'upset',
    'technicalGap',
    'mentalGap',
    'physicalGap',
    'confidenceGap',
    'fatigueGap',
    'pressureGap',
    'safetyGap',
    'breakBuildingGap',
    'tacticalGap',
    'playerStrength',
    'opponentStrength',
    'momentumSwings',
    'playerConfidenceSwing',
    'opponentConfidenceSwing',
    'playerFatigueChange',
    'opponentFatigueChange',
    'pressureEvents',
    'deciderPressureEvents',
    'framesWonFromBehind',
    'framesLostFromWinningPosition',
    'closeFramesWon',
    'closeFramesLost',
    'topReason',
  ]
  const lines = [headers.join(',')]

  matchRows.forEach((row) => {
    lines.push([
      'match',
      row.matchupId,
      row.matchup,
      row.bestOf,
      row.playerName,
      row.opponentName,
      row.expectedWinRate.toFixed(2),
      row.frameWinChance.toFixed(2),
      row.actualWinRate.toFixed(2),
      row.playerFrames,
      row.opponentFrames,
      row.favouriteSide,
      row.favouriteWon,
      row.underdogWon,
      row.decidingFrame,
      row.whitewash,
      row.comebackWin,
      row.upset,
      row.technicalGap.toFixed(2),
      row.mentalGap.toFixed(2),
      row.physicalGap.toFixed(2),
      row.confidenceGap.toFixed(2),
      row.fatigueGap.toFixed(2),
      row.pressureGap.toFixed(2),
      row.safetyGap.toFixed(2),
      row.breakBuildingGap.toFixed(2),
      row.tacticalGap.toFixed(2),
      row.playerStrength.toFixed(2),
      row.opponentStrength.toFixed(2),
      row.momentumSwings,
      row.playerConfidenceSwing.toFixed(2),
      row.opponentConfidenceSwing.toFixed(2),
      row.playerFatigueChange.toFixed(2),
      row.opponentFatigueChange.toFixed(2),
      row.pressureEvents,
      row.deciderPressureEvents,
      row.framesWonFromBehind,
      row.framesLostFromWinningPosition,
      row.closeFramesWon,
      row.closeFramesLost,
      row.topReason.trim(),
    ].map(csvEscape).join(','))
  })

  scenarioRows.forEach((row) => {
    lines.push([
      'scenario',
      row.scenarioId,
      row.label,
      row.bestOf,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      row.conversion,
      row.comeback,
      '',
      '',
      '',
      row.collapse,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      row.playerConfidenceSwing.toFixed(2),
      row.opponentConfidenceSwing.toFixed(2),
      '',
      '',
      row.pressureErrors.toFixed(2),
      '',
      '',
      '',
      '',
      '',
      row.startScore,
    ].map(csvEscape).join(','))
  })

  return `${lines.join('\n')}\n`
}

function getRealismWarnings(summaries: MatchExperienceSummary[], scenarios: ScenarioSummary[]) {
  const warnings: string[] = []
  const equalProfiles = summaries.filter((summary) => summary.matchup === 'Equal Youth vs Equal Youth')
  equalProfiles.forEach((summary) => {
    if (summary.actualWinRate < 45 || summary.actualWinRate > 55) {
      warnings.push(`Equal profile warning: ${summary.matchup} BO${summary.bestOf} landed at ${formatPercent(summary.actualWinRate)}.`)
    }
  })

  const shortLongPairs = new Map<string, MatchExperienceSummary[]>()
  summaries.forEach((summary) => {
    const existing = shortLongPairs.get(summary.matchup)
    if (existing) existing.push(summary)
    else shortLongPairs.set(summary.matchup, [summary])
  })
  shortLongPairs.forEach((rows, matchup) => {
    const shortUpset = average(rows.filter((row) => row.bestOf <= 7).map((row) => row.upsetRate))
    const longUpset = average(rows.filter((row) => row.bestOf >= 25).map((row) => row.upsetRate))
    const shortFavourite = average(rows.filter((row) => row.bestOf <= 7).map((row) => row.favouriteWinRate))
    const longFavourite = average(rows.filter((row) => row.bestOf >= 25).map((row) => row.favouriteWinRate))
    if (shortUpset <= longUpset) warnings.push(`Format warning: ${matchup} did not create more upsets in short matches (${formatPercent(shortUpset)} short vs ${formatPercent(longUpset)} long).`)
    if (longFavourite < shortFavourite) warnings.push(`Format warning: ${matchup} did not favour the stronger side more in longer matches (${formatPercent(shortFavourite)} short favourite win vs ${formatPercent(longFavourite)} long).`)
  })

  const tiredFavourite = summaries.filter((summary) => summary.matchup === 'Tired Favourite vs Fresh Underdog')
  if (average(tiredFavourite.filter((summary) => summary.bestOf >= 25).map((summary) => summary.actualWinRate)) >= average(tiredFavourite.filter((summary) => summary.bestOf <= 7).map((summary) => summary.actualWinRate)) - 5) {
    warnings.push('Fatigue warning: tired favourite did not lose enough edge in long formats.')
  }

  const pressureCritical = scenarios.filter((scenario) => scenario.label.includes('Deciding') || scenario.label.includes('final'))
  if (average(pressureCritical.map((scenario) => scenario.pressureErrors)) < 2) {
    warnings.push('Pressure warning: deciders and finals did not generate enough pressure mistakes.')
  }

  const styleRows = summaries.filter((summary) => summary.matchup === 'Heavy Break Builder vs Safety Grinder')
  if (average(styleRows.map((summary) => Math.abs(summary.breakBuildingGap))) < 6 || average(styleRows.map((summary) => Math.abs(summary.safetyGap))) < 6) {
    warnings.push('Style warning: break-building and safety specialists are not separating enough in the controlled tests.')
  }

  const momentumRows = summaries.filter((summary) => summary.averageMomentumSwings < 0.5)
  if (momentumRows.length > 4) {
    warnings.push('Momentum warning: too many matchup/format rows show almost no scoreline momentum swings.')
  }

  return warnings
}

function getRecommendedChanges(warnings: string[]) {
  const suggestions: string[] = []
  if (warnings.some((warning) => warning.includes('Equal profile'))) suggestions.push('Keep trimming equal-profile drift before using live visit outside calibration.')
  if (warnings.some((warning) => warning.includes('Format warning'))) suggestions.push('Increase long-format leverage from strength and composure so favourites separate more cleanly over distance.')
  if (warnings.some((warning) => warning.includes('Fatigue warning'))) suggestions.push('Push more fatigue cost into late-frame error chance and break continuation in BO19+ formats.')
  if (warnings.some((warning) => warning.includes('Pressure warning'))) suggestions.push('Raise decider and final pressure modifiers slightly so nerve and confidence matter more in late phases.')
  if (warnings.some((warning) => warning.includes('Style warning'))) suggestions.push('Differentiate break-build and safety decisions further so tactical archetypes create visibly different match patterns.')
  if (warnings.some((warning) => warning.includes('Momentum warning'))) suggestions.push('Add a slightly stronger confidence response to two-frame streaks without reintroducing runaway snowballing.')
  return suggestions.length > 0 ? suggestions : ['No immediate tuning change is justified from this calibration pass; keep iterating on rank-based swap stability first.']
}

function getFormatEffectDiagnostics(summaries: MatchExperienceSummary[]): FormatEffectDiagnostic[] {
  const byMatchup = new Map<string, MatchExperienceSummary[]>()
  summaries.forEach((summary) => {
    const existing = byMatchup.get(summary.matchup)
    if (existing) {
      existing.push(summary)
    } else {
      byMatchup.set(summary.matchup, [summary])
    }
  })

  return [...byMatchup.entries()].map(([matchup, matchupRows]) => {
    const ordered = [...matchupRows].sort((left, right) => left.bestOf - right.bestOf)
    const shortRows = ordered.filter((row) => row.bestOf <= 7)
    const longRows = ordered.filter((row) => row.bestOf >= 25)
    const shortActualWinRate = average(shortRows.map((row) => row.actualWinRate))
    const longActualWinRate = average(longRows.map((row) => row.actualWinRate))
    const shortFavouriteWinRate = average(shortRows.map((row) => row.favouriteWinRate))
    const longFavouriteWinRate = average(longRows.map((row) => row.favouriteWinRate))
    const shortFrameDrift = average(shortRows.map((row) => row.actualFrameWinRate - row.averageFrameWinChance))
    const longFrameDrift = average(longRows.map((row) => row.actualFrameWinRate - row.averageFrameWinChance))
    const averageExpectedWinRate = average(ordered.map((row) => row.expectedWinRate))
    const expectedDirection = averageExpectedWinRate > 52
      ? 'Player edge should grow'
      : averageExpectedWinRate < 48
        ? 'Player edge should shrink'
        : 'Roughly flat'
    const actualDelta = longActualWinRate - shortActualWinRate
    const actualDirection = actualDelta > 3
      ? 'Player edge grew'
      : actualDelta < -3
        ? 'Player edge shrank'
        : 'Roughly flat'
    const valid = expectedDirection === 'Roughly flat'
      ? Math.abs(actualDelta) <= 6
      : expectedDirection === 'Player edge should grow'
        ? actualDelta >= 3
        : actualDelta <= -3

    return {
      matchup,
      expectedDirection,
      actualDirection,
      valid,
      shortActualWinRate,
      longActualWinRate,
      shortFavouriteWinRate,
      longFavouriteWinRate,
      shortFrameDrift,
      longFrameDrift,
    }
  })
}

function getEndUserMatchFeelVerdict(
  summaries: MatchExperienceSummary[],
  scenarios: ScenarioSummary[],
  samples: SampleReport[],
  formatDiagnostics: FormatEffectDiagnostic[],
): MatchFeelVerdictRow[] {
  const severeDrifts = [...summaries]
    .filter((summary) => Math.abs(summary.difference) >= 35)
    .sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference))
    .slice(0, 3)
  const confidenceRows = summaries.filter((summary) => summary.matchup === 'High Confidence Underdog vs Low Confidence Favourite')
  const tiredFavouriteRows = summaries.filter((summary) => summary.matchup === 'Tired Favourite vs Fresh Underdog')
  const equalYouthBo35 = summaries.find((summary) => summary.matchup === 'Equal Youth vs Equal Youth' && summary.bestOf === 35)
  const worldFinalScenario = scenarios.find((scenario) => scenario.label.includes('World final deciding session'))
  const shortUpsetRate = average(summaries.filter((summary) => summary.bestOf <= 7).map((summary) => summary.upsetRate))
  const longUpsetRate = average(summaries.filter((summary) => summary.bestOf >= 25).map((summary) => summary.upsetRate))
  const validFormatDiagnostics = formatDiagnostics.filter((diagnostic) => diagnostic.valid).length
  const explanationGoodRate = percent(samples.filter((sample) => sample.explanationVerdict === 'explanation good').length, samples.length)
  const confidenceOverall = average(confidenceRows.map((summary) => summary.actualWinRate - summary.expectedWinRate))
  const tiredShort = average(tiredFavouriteRows.filter((summary) => summary.bestOf <= 7).map((summary) => summary.actualWinRate))
  const tiredLong = average(tiredFavouriteRows.filter((summary) => summary.bestOf >= 25).map((summary) => summary.actualWinRate))
  const averagePressureErrors = average(scenarios.map((scenario) => scenario.pressureErrors))

  const rows: MatchFeelVerdictRow[] = [
    {
      area: 'Attribute impact',
      plausible: severeDrifts.length === 0,
      evidence: severeDrifts.length === 0
        ? 'No matchup/format row missed expectation by 35 points or more.'
        : `Severe drifts remain: ${severeDrifts.map((summary) => `${summary.matchup} BO${summary.bestOf} ${formatSigned(summary.difference)}%`).join('; ')}.`,
    },
    {
      area: 'Confidence impact',
      plausible: Math.abs(confidenceOverall) <= 20,
      evidence: `High-confidence underdog rows averaged ${formatSigned(confidenceOverall)}% versus expectation across formats.`,
    },
    {
      area: 'Fatigue impact',
      plausible: tiredLong <= tiredShort - 5 && (equalYouthBo35?.playerFatigueChange ?? 0) <= 60,
      evidence: `Tired favourite moved from ${formatPercent(tiredShort)} in BO5/7 to ${formatPercent(tiredLong)} in BO25/35; Equal Youth BO35 fatigue delta was ${(equalYouthBo35?.playerFatigueChange ?? 0).toFixed(1)}.`,
    },
    {
      area: 'Pressure impact',
      plausible: averagePressureErrors >= 1.5 && averagePressureErrors <= 8 && !!worldFinalScenario && worldFinalScenario.conversionRate >= 20 && worldFinalScenario.conversionRate <= 80,
      evidence: `Pressure scenarios averaged ${averagePressureErrors.toFixed(1)} errors; World final deciding session converted at ${formatPercent(worldFinalScenario?.conversionRate ?? 0)}.`,
    },
    {
      area: 'Format effect',
      plausible: validFormatDiagnostics >= Math.ceil(formatDiagnostics.length * 0.6) && shortUpsetRate >= longUpsetRate + 5,
      evidence: `${validFormatDiagnostics}/${formatDiagnostics.length} matchup format checks passed; short-format upsets averaged ${formatPercent(shortUpsetRate)} vs ${formatPercent(longUpsetRate)} long.`,
    },
    {
      area: 'Upset frequency',
      plausible: shortUpsetRate >= 20 && shortUpsetRate <= 50 && longUpsetRate >= 10 && longUpsetRate <= 35,
      evidence: `Overall upset rates were ${formatPercent(shortUpsetRate)} in BO5/7 and ${formatPercent(longUpsetRate)} in BO25/35.`,
    },
    {
      area: 'Explanation quality',
      plausible: explanationGoodRate >= 75,
      evidence: `${formatPercent(explanationGoodRate)} of sample explanations were graded explanation good.`,
    },
  ]

  rows.push({
    area: 'Live-visit ready for career',
    plausible: rows.every((row) => row.plausible),
    evidence: rows.every((row) => row.plausible)
      ? 'All current match-feel checks passed.'
      : `Blocked because ${rows.filter((row) => !row.plausible).map((row) => row.area.toLowerCase()).join(', ')} still fail.`,
  })

  return rows
}

function buildMarkdown(
  summaries: MatchExperienceSummary[],
  scenarioSummaries: ScenarioSummary[],
  samples: SampleReport[],
  warnings: string[],
  recommendations: string[],
) {
  const byMatchup = new Map<string, MatchExperienceSummary[]>()
  summaries.forEach((summary) => {
    const existing = byMatchup.get(summary.matchup)
    if (existing) existing.push(summary)
    else byMatchup.set(summary.matchup, [summary])
  })
  const formatDiagnostics = getFormatEffectDiagnostics(summaries)
  const verdictRows = getEndUserMatchFeelVerdict(summaries, scenarioSummaries, samples, formatDiagnostics)

  const biggestDrifts = [...summaries].sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference)).slice(0, 5)
  const lines = [
    '# Match Experience Calibration',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- ${MATCHES_PER_FORMAT} live-visit simulations were run for each fixed matchup and format.`,
    `- ${SCENARIO_RUNS} live-visit simulations were run for each pressure scenario.`,
    '- This report is calibration-only. Career and weekly simulation remain unchanged.',
    '- Opponents use fixed explicit profiles here so the report can isolate attributes, pressure, confidence, fatigue, momentum, and format effects cleanly.',
    '',
    '## Executive Summary',
    '',
    `- Biggest calibration drifts: ${biggestDrifts.map((summary) => `${summary.matchup} BO${summary.bestOf} ${formatSigned(summary.difference)}%`).join('; ')}.`,
    `- Equal Youth control range: ${byMatchup.get('Equal Youth vs Equal Youth')?.map((summary) => `BO${summary.bestOf} ${formatPercent(summary.actualWinRate)}`).join(', ') ?? 'n/a'}.`,
    `- Short-format upset rate average: ${formatPercent(average(summaries.filter((summary) => summary.bestOf <= 7).map((summary) => summary.upsetRate)))}.`,
    `- Long-format upset rate average: ${formatPercent(average(summaries.filter((summary) => summary.bestOf >= 25).map((summary) => summary.upsetRate)))}.`,
    `- Pressure scenario average conversion rate: ${formatPercent(average(scenarioSummaries.map((summary) => summary.conversionRate)))}.`,
    '',
    '## Matchup Calibration Table',
    '',
    '| Matchup | BO | Expected | Actual | Diff | Avg Score | Avg Frames | Fav Win | Upset | Decider | Whitewash | Comeback |',
    '| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  summaries.forEach((summary) => {
    lines.push(`| ${summary.matchup} | ${summary.bestOf} | ${formatPercent(summary.expectedWinRate)} | ${formatPercent(summary.actualWinRate)} | ${formatSigned(summary.difference)}% | ${summary.averageScoreline} | ${summary.averageFramesPlayed.toFixed(1)} | ${formatPercent(summary.favouriteWinRate)} | ${formatPercent(summary.upsetRate)} | ${formatPercent(summary.decidingFrameRate)} | ${formatPercent(summary.whitewashRate)} | ${formatPercent(summary.comebackWinRate)} |`)
  })

  lines.push('')
  lines.push('## Format Effect Table')
  lines.push('')
  lines.push('| Matchup | BO5 | BO7 | BO11 | BO19 | BO25 | BO35 | Trend |')
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |')
  byMatchup.forEach((matchupRows, matchup) => {
    const ordered = [...matchupRows].sort((left, right) => left.bestOf - right.bestOf)
    const shortActual = average(ordered.filter((row) => row.bestOf <= 7).map((row) => row.actualWinRate))
    const longActual = average(ordered.filter((row) => row.bestOf >= 25).map((row) => row.actualWinRate))
    const trend = longActual > shortActual ? 'longer match helped player edge grow' : longActual < shortActual ? 'longer match reduced player edge' : 'flat across formats'
    lines.push(`| ${matchup} | ${formatPercent(ordered.find((row) => row.bestOf === 5)?.actualWinRate ?? 0)} | ${formatPercent(ordered.find((row) => row.bestOf === 7)?.actualWinRate ?? 0)} | ${formatPercent(ordered.find((row) => row.bestOf === 11)?.actualWinRate ?? 0)} | ${formatPercent(ordered.find((row) => row.bestOf === 19)?.actualWinRate ?? 0)} | ${formatPercent(ordered.find((row) => row.bestOf === 25)?.actualWinRate ?? 0)} | ${formatPercent(ordered.find((row) => row.bestOf === 35)?.actualWinRate ?? 0)} | ${trend} |`)
  })

  lines.push('')
  lines.push('## Frame Win Probability Diagnostics')
  lines.push('')
  lines.push('| Matchup | BO | Baseline Match | Derived Frame | Actual Frame | Actual Match | Frame Drift | Match Drift |')
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
  summaries.forEach((summary) => {
    lines.push(`| ${summary.matchup} | ${summary.bestOf} | ${formatPercent(summary.expectedWinRate)} | ${formatPercent(summary.averageFrameWinChance)} | ${formatPercent(summary.actualFrameWinRate)} | ${formatPercent(summary.actualWinRate)} | ${formatSigned(summary.actualFrameWinRate - summary.averageFrameWinChance)}% | ${formatSigned(summary.actualWinRate - summary.expectedWinRate)}% |`)
  })

  lines.push('')
  lines.push('## Format Effect Diagnostics')
  lines.push('')
  lines.push('| Matchup | Expected Direction | Actual Direction | BO5/7 Player Win | BO25/35 Player Win | BO5/7 Fav Win | BO25/35 Fav Win | Frame Drift Short | Frame Drift Long | Valid |')
  lines.push('| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |')
  formatDiagnostics.forEach((diagnostic) => {
    lines.push(`| ${diagnostic.matchup} | ${diagnostic.expectedDirection} | ${diagnostic.actualDirection} | ${formatPercent(diagnostic.shortActualWinRate)} | ${formatPercent(diagnostic.longActualWinRate)} | ${formatPercent(diagnostic.shortFavouriteWinRate)} | ${formatPercent(diagnostic.longFavouriteWinRate)} | ${formatSigned(diagnostic.shortFrameDrift)}% | ${formatSigned(diagnostic.longFrameDrift)}% | ${diagnostic.valid ? 'Yes' : 'No'} |`)
  })

  lines.push('')
  lines.push('## Pressure Scenario Table')
  lines.push('')
  lines.push('| Scenario | Matchup | BO | Start | Conversion | Comeback | Collapse | Pressure Errors | Player Conf Swing | Opponent Conf Swing |')
  lines.push('| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |')
  scenarioSummaries.forEach((summary) => {
    lines.push(`| ${summary.label} | ${summary.matchup} | ${summary.bestOf} | ${summary.startScore} | ${formatPercent(summary.conversionRate)} | ${formatPercent(summary.comebackRate)} | ${formatPercent(summary.collapseRate)} | ${summary.pressureErrors.toFixed(1)} | ${summary.playerConfidenceSwing.toFixed(1)} | ${summary.opponentConfidenceSwing.toFixed(1)} |`)
  })

  lines.push('')
  lines.push('## Attribute Impact Table')
  lines.push('')
  lines.push('| Matchup | BO | Tech | Mental | Physical | Conf | Fatigue | Pressure | Safety | Break | Tactical | Player Str | Opp Str | Momentum | Conf Swing P/O | Fatigue Delta P/O | Pressure Events | Frames From Behind | Frames Lost Lead | Close W/L |')
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | --- |')
  summaries.forEach((summary) => {
    lines.push(`| ${summary.matchup} | ${summary.bestOf} | ${summary.technicalGap.toFixed(1)} | ${summary.mentalGap.toFixed(1)} | ${summary.physicalGap.toFixed(1)} | ${summary.confidenceGap.toFixed(1)} | ${summary.fatigueGap.toFixed(1)} | ${summary.pressureGap.toFixed(1)} | ${summary.safetyGap.toFixed(1)} | ${summary.breakBuildingGap.toFixed(1)} | ${summary.tacticalGap.toFixed(1)} | ${summary.playerStrength.toFixed(1)} | ${summary.opponentStrength.toFixed(1)} | ${summary.averageMomentumSwings.toFixed(1)} | ${summary.playerConfidenceSwing.toFixed(1)} / ${summary.opponentConfidenceSwing.toFixed(1)} | ${summary.playerFatigueChange.toFixed(1)} / ${summary.opponentFatigueChange.toFixed(1)} | ${summary.pressureEvents.toFixed(1)} | ${summary.framesWonFromBehind.toFixed(1)} | ${summary.framesLostFromWinningPosition.toFixed(1)} | ${summary.closeFramesWon.toFixed(1)} / ${summary.closeFramesLost.toFixed(1)} |`)
  })

  lines.push('')
  lines.push('## Sample Match Reports')
  lines.push('')
  samples.forEach((sample) => {
    const favourite = sample.expectedWinRate >= 50 ? 'Player' : 'Opponent'
    const actualWinner = sample.result.playerWon ? 'Player' : 'Opponent'
    lines.push(`### ${sample.matchup.label}`)
    lines.push('')
    lines.push('Pre-match')
    lines.push(`- Player: ${sample.player.name} (${sample.player.tier}, ${sample.player.style})`) 
    lines.push(`- Opponent: ${sample.opponent.name} (${sample.opponent.tier}, ${sample.opponent.style})`)
    lines.push(`- Format: Best of ${sample.bestOf}`)
    lines.push(`- Expected win chance: ${formatPercent(sample.expectedWinRate)}`)
    lines.push(`- Frame win chance: ${formatPercent(sample.result.frameWinChance)}`)
    lines.push(`- Technical gap: ${formatSigned(sample.result.constructedProfiles.player.technicalAverage - sample.result.constructedProfiles.opponent.technicalAverage)}`)
    lines.push(`- Mental gap: ${formatSigned(sample.result.constructedProfiles.player.mentalAverage - sample.result.constructedProfiles.opponent.mentalAverage)}`)
    lines.push(`- Physical gap: ${formatSigned(sample.result.constructedProfiles.player.physicalAverage - sample.result.constructedProfiles.opponent.physicalAverage)}`)
    lines.push(`- Confidence gap: ${formatSigned(sample.player.confidence - sample.opponent.confidence)}`)
    lines.push(`- Fatigue gap (player-opponent): ${formatSigned(sample.player.fatigue - sample.opponent.fatigue)}`)
    lines.push(`- Pressure gap: ${formatSigned(sample.result.constructedProfiles.player.pressureHandling - sample.result.constructedProfiles.opponent.pressureHandling)}`)
    lines.push(`- Key predicted advantage: ${sample.keyAdvantage ? `${sample.keyAdvantage.factor} (${formatSigned(sample.keyAdvantage.impact)} player impact)` : 'No clear player-side pre-match edge.'}`)
    lines.push(`- Key risk: ${sample.keyRisk ? `${sample.keyRisk.factor} (${formatSigned(sample.keyRisk.impact)} player impact)` : 'No clear player-side pre-match risk.'}`)
    lines.push('')
    lines.push('| Factor | Gap | Impact |')
    lines.push('| --- | ---: | ---: |')
    sample.impacts.forEach((impact) => {
      lines.push(`| ${impact.factor} | ${formatSigned(impact.gap)} | ${formatSigned(impact.impact)} |`)
    })
    lines.push('')
    lines.push('Frame-by-frame')
    sample.result.frameSummaries.forEach((frame) => {
      lines.push(`- Frame ${frame.frameNumber}: ${frame.winner} wins ${frame.score}. Reason: ${frame.reason} Confidence ${frame.playerConfidenceStart}->${frame.playerConfidenceEnd} / ${frame.opponentConfidenceStart}->${frame.opponentConfidenceEnd}. Fatigue ${frame.playerFatigueStart}->${frame.playerFatigueEnd} / ${frame.opponentFatigueStart}->${frame.opponentFatigueEnd}. Pressure ${frame.pressureStart}->${frame.pressureEnd}.`) 
    })
    lines.push('')
    lines.push('Match summary')
    lines.push(`- Final score: ${sample.result.score}`)
    lines.push(`- Expected winner: ${favourite}`)
    lines.push(`- Actual winner: ${actualWinner}`)
    lines.push(`- Upset: ${favourite !== actualWinner ? 'yes' : 'no'}`)
    lines.push(`- Top 3 reasons: ${sample.topReasons.join(' ')}`)
    lines.push(`- Training advice: ${sample.trainingAdvice}`)
    lines.push(`- Explanation verdict: ${sample.explanationVerdict}`)
    lines.push('')
  })

  lines.push('## Realism Warnings')
  lines.push('')
  if (warnings.length === 0) {
    lines.push('- No realism warnings were triggered in this pass.')
  } else {
    warnings.forEach((warning) => lines.push(`- ${warning}`))
  }

  lines.push('')
  lines.push('## End-User Match Feel Verdict')
  lines.push('')
  lines.push('| Area | Plausible | Evidence |')
  lines.push('| --- | --- | --- |')
  verdictRows.forEach((row) => {
    lines.push(`| ${row.area} | ${row.plausible ? 'Yes' : 'No'} | ${row.evidence} |`)
  })

  lines.push('')
  lines.push('## Recommended Tuning Changes')
  lines.push('')
  recommendations.forEach((recommendation, index) => {
    lines.push(`${index + 1}. ${recommendation}`)
  })

  return `${lines.join('\n')}\n`
}

const MATCHUPS: MatchExperienceConfig[] = [
  {
    id: 'equal-youth',
    label: 'Equal Youth vs Equal Youth',
    player: { name: 'Equal Youth A', tier: 'Youth', style: 'Counter' },
    opponent: { name: 'Equal Youth B', tier: 'Youth', style: 'Counter' },
    sampleFormat: 11,
  },
  {
    id: 'youth-amateur',
    label: 'Youth Prospect vs Amateur',
    player: { name: 'Youth Prospect', tier: 'Youth', style: 'Scorer' },
    opponent: { name: 'Amateur Regular', tier: 'Amateur', style: 'Counter' },
    sampleFormat: 11,
  },
  {
    id: 'youth-top64',
    label: 'Youth Prospect vs Top 64',
    player: { name: 'Youth Prospect', tier: 'Youth', style: 'Break Builder' },
    opponent: { name: 'Top 64 Pro', tier: 'Top 64', style: 'Counter' },
    sampleFormat: 11,
  },
  {
    id: 'amateur-qtour',
    label: 'Amateur vs Q Tour',
    player: { name: 'Amateur Challenger', tier: 'Amateur', style: 'Counter' },
    opponent: { name: 'Q Tour Winner', tier: 'Q Tour', style: 'Break Builder' },
    sampleFormat: 11,
  },
  {
    id: 'qtour-rookie',
    label: 'Q Tour vs Rookie Pro',
    player: { name: 'Q Tour Winner', tier: 'Q Tour', style: 'Scorer' },
    opponent: { name: 'Rookie Pro', tier: 'Rookie Pro', style: 'Counter' },
    sampleFormat: 11,
  },
  {
    id: 'rookie-top64',
    label: 'Rookie Pro vs Top 64',
    player: { name: 'Rookie Pro', tier: 'Rookie Pro', style: 'Break Builder' },
    opponent: { name: 'Top 64 Pro', tier: 'Top 64', style: 'Counter' },
    sampleFormat: 11,
  },
  {
    id: 'top64-top32',
    label: 'Top 64 vs Top 32',
    player: { name: 'Top 64 Pro', tier: 'Top 64', style: 'Counter' },
    opponent: { name: 'Top 32 Pro', tier: 'Top 32', style: 'Nerve' },
    sampleFormat: 11,
  },
  {
    id: 'top32-top16',
    label: 'Top 32 vs Top 16',
    player: { name: 'Top 32 Pro', tier: 'Top 32', style: 'Scorer' },
    opponent: { name: 'Top 16 Pro', tier: 'Top 16', style: 'Counter' },
    sampleFormat: 11,
  },
  {
    id: 'top16-top4',
    label: 'Top 16 vs Top 4',
    player: { name: 'Top 16 Pro', tier: 'Top 16', style: 'Counter' },
    opponent: { name: 'Top 4 Star', tier: 'Top 4', style: 'Nerve' },
    sampleFormat: 19,
    sampleRound: 'Semi Final',
  },
  {
    id: 'top4-world',
    label: 'Top 4 vs World Champion',
    player: { name: 'Top 4 Star', tier: 'Top 4', style: 'Break Builder' },
    opponent: { name: 'World Champion', tier: 'World Champion', style: 'Nerve' },
    sampleFormat: 19,
    sampleRound: 'Final',
  },
  {
    id: 'veteran-world',
    label: 'Veteran Min Support vs World Champion',
    player: { name: 'Veteran Min Support', tier: 'Veteran Min Support', style: 'Tactical' },
    opponent: { name: 'World Champion', tier: 'World Champion', style: 'Counter' },
    sampleFormat: 19,
    sampleRound: 'Final',
  },
  {
    id: 'confidence-underdog',
    label: 'High Confidence Underdog vs Low Confidence Favourite',
    player: { name: 'High Confidence Underdog', tier: 'Amateur', style: 'Scorer', confidenceDelta: 12, fatigueDelta: -2 },
    opponent: { name: 'Low Confidence Favourite', tier: 'Top 32', style: 'Counter', confidenceDelta: -12, fatigueDelta: 2 },
    sampleFormat: 11,
  },
  {
    id: 'tired-favourite',
    label: 'Tired Favourite vs Fresh Underdog',
    player: { name: 'Tired Favourite', tier: 'Top 32', style: 'Counter', fatigueDelta: 16, confidenceDelta: -3 },
    opponent: { name: 'Fresh Underdog', tier: 'Top 64', style: 'Scorer', fatigueDelta: -8, confidenceDelta: 4 },
    sampleFormat: 19,
  },
  {
    id: 'technical-vs-mental',
    label: 'Strong Technical / Weak Mental vs Weak Technical / Strong Mental',
    player: {
      name: 'Technical Shotmaker',
      tier: 'Top 64',
      style: 'Scorer',
      technicalDelta: { 'Long Potting': 8, 'Break Building': 8, 'Cue Ball Control': 5 },
      mentalDelta: { Focus: -8, Composure: -8, 'Big Match Nerve': -8 },
    },
    opponent: {
      name: 'Mental Match Player',
      tier: 'Top 64',
      style: 'Counter',
      technicalDelta: { 'Long Potting': -6, 'Break Building': -6 },
      mentalDelta: { Focus: 8, Composure: 8, 'Big Match Nerve': 8 },
    },
    sampleFormat: 11,
  },
  {
    id: 'break-vs-safety',
    label: 'Heavy Break Builder vs Safety Grinder',
    player: { name: 'Heavy Break Builder', tier: 'Top 64', style: 'Break Builder' },
    opponent: { name: 'Safety Grinder', tier: 'Top 64', style: 'Tactical' },
    sampleFormat: 11,
  },
  {
    id: 'pressure-vs-talent',
    label: 'Pressure Specialist vs Inconsistent Talent',
    player: { name: 'Pressure Specialist', tier: 'Top 32', style: 'Nerve', mentalDelta: { Composure: 6, 'Big Match Nerve': 7, Focus: 4 } },
    opponent: { name: 'Inconsistent Talent', tier: 'Top 32', style: 'Scorer', technicalDelta: { 'Long Potting': 6, 'Break Building': 6, Consistency: -7 }, mentalDelta: { Composure: -7, Focus: -6 } },
    sampleFormat: 11,
  },
]

const SCENARIOS: PressureScenarioConfig[] = [
  { id: 'lead-3-0', label: 'A. Player leads 3-0 in best of 7', matchupId: 'top64-top32', bestOf: 7, initialPlayerFrames: 3, initialOpponentFrames: 0, initialPressureValue: 58 },
  { id: 'trail-0-3', label: 'B. Player trails 0-3 in best of 7', matchupId: 'top64-top32', bestOf: 7, initialPlayerFrames: 0, initialOpponentFrames: 3, initialPressureValue: 66 },
  { id: 'lead-8-4', label: 'C. Player leads 8-4 in best of 19', matchupId: 'top16-top4', bestOf: 19, initialPlayerFrames: 8, initialOpponentFrames: 4, initialPressureValue: 70 },
  { id: 'trail-7-9', label: 'D. Player trails 7-9 in best of 19', matchupId: 'top16-top4', bestOf: 19, initialPlayerFrames: 7, initialOpponentFrames: 9, initialPressureValue: 82 },
  { id: 'decider-5-5', label: 'E. Deciding frame at 5-5 in best of 11', matchupId: 'top32-top16', bestOf: 11, initialPlayerFrames: 5, initialOpponentFrames: 5, initialPressureValue: 86 },
  { id: 'world-final', label: 'F. World final deciding session', matchupId: 'top4-world', bestOf: 35, initialPlayerFrames: 14, initialOpponentFrames: 14, round: 'Final', initialPressureValue: 92 },
  { id: 'low-confidence-final', label: 'G. Low-confidence player in final', matchupId: 'confidence-underdog', bestOf: 19, initialPlayerFrames: 4, initialOpponentFrames: 4, round: 'Final', initialPressureValue: 88 },
  { id: 'high-confidence-qualifier', label: 'H. High-confidence underdog in qualifier', matchupId: 'confidence-underdog', bestOf: 7, initialPlayerFrames: 0, initialOpponentFrames: 0, initialPressureValue: 54 },
  { id: 'tired-long', label: 'I. Tired favourite in long match', matchupId: 'tired-favourite', bestOf: 35, initialPlayerFrames: 0, initialOpponentFrames: 0, initialPressureValue: 52 },
  { id: 'fresh-short', label: 'J. Fresh underdog in short match', matchupId: 'tired-favourite', bestOf: 5, initialPlayerFrames: 0, initialOpponentFrames: 0, initialPressureValue: 46 },
]

function buildScenarioRows(matchupsById: Map<string, MatchExperienceConfig>) {
  const rows: ScenarioRow[] = []
  SCENARIOS.forEach((scenario, scenarioIndex) => {
    const matchup = matchupsById.get(scenario.matchupId)
    if (!matchup) {
      throw new Error(`Missing matchup for scenario ${scenario.id}`)
    }

    for (let run = 0; run < SCENARIO_RUNS; run += 1) {
      const { player, opponent, result } = simulateControlledMatch(matchup, scenario.bestOf, 800000 + scenarioIndex * 1000 + run, {
        round: scenario.round,
        initialPlayerFrames: scenario.initialPlayerFrames,
        initialOpponentFrames: scenario.initialOpponentFrames,
        initialPressureValue: scenario.initialPressureValue,
        startingPlayer: run % 2 === 0 ? 'player' : 'opponent',
      })
      const swing = getConfidenceSwing(result, player.confidence, opponent.confidence)
      const pressureEvents = getPressureEvents(result)
      const playerLed = scenario.initialPlayerFrames > scenario.initialOpponentFrames
      const playerTrailed = scenario.initialPlayerFrames < scenario.initialOpponentFrames
      rows.push({
        scenarioId: scenario.id,
        label: scenario.label,
        matchup: matchup.label,
        bestOf: scenario.bestOf,
        startScore: `${scenario.initialPlayerFrames}-${scenario.initialOpponentFrames}`,
        conversion: playerLed ? result.playerWon : !result.playerWon,
        comeback: playerTrailed ? result.playerWon : false,
        collapse: playerLed ? !result.playerWon : false,
        pressureErrors: pressureEvents.pressureEvents,
        playerConfidenceSwing: swing.player,
        opponentConfidenceSwing: swing.opponent,
      })
    }
  })
  return rows
}

function main() {
  const matchRows: MatchExperienceRow[] = []
  MATCHUPS.forEach((matchup, matchupIndex) => {
    FORMATS.forEach((bestOf, formatIndex) => {
      for (let run = 0; run < MATCHES_PER_FORMAT; run += 1) {
        matchRows.push(buildMatchRow(matchup, bestOf, 200000 + matchupIndex * 10000 + formatIndex * 1000 + run))
      }
    })
  })

  const summaries = summarizeRows(matchRows).sort((left, right) => left.matchup.localeCompare(right.matchup) || left.bestOf - right.bestOf)
  const matchupMap = new Map(MATCHUPS.map((matchup) => [matchup.id, matchup]))
  const scenarioRows = buildScenarioRows(matchupMap)
  const scenarioSummaries = summarizeScenarios(scenarioRows)
  const samples = MATCHUPS.map((matchup, index) => buildSampleReport(matchup, 600000 + index * 97))
  const warnings = getRealismWarnings(summaries, scenarioSummaries)
  const recommendations = getRecommendedChanges(warnings)

  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(markdownPath, buildMarkdown(summaries, scenarioSummaries, samples, warnings, recommendations))
  fs.writeFileSync(csvPath, buildCsv(matchRows, scenarioRows))
  console.log(`Wrote match experience calibration report to ${markdownPath}`)
  console.log(`Wrote match experience calibration csv to ${csvPath}`)
}

main()
