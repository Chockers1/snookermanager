import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  simulateSyntheticLiveVisitMatch,
  type ConstructedLiveVisitProfile,
  type SyntheticLiveVisitDebugMetrics,
} from '../src/hooks/useGameState'
import type { PlayerAttributes } from '../src/types/game'
import { SIMULATION_MODE } from '../src/utils/simulationMode'
import {
  buildSyntheticProfile,
  getBaselineMatchWinChance,
  type ProfileStyle,
  type ProfileTier,
} from './matchSimulationShared'

type BiasCaseConfig = {
  id: string
  label: string
  playerTier: ProfileTier
  opponentTier: ProfileTier
  playerStyle: ProfileStyle
  opponentStyle: ProfileStyle
  bestOf: number
  opponentProfileMode: 'rankBased' | 'attributes'
  startingPlayer: 'player' | 'opponent'
}

type AggregatedSideMetrics = SyntheticLiveVisitDebugMetrics['player']

type ConstructedProfileAggregate = {
  count: number
  sourceKind: ConstructedLiveVisitProfile['sourceKind']
  sourceRankBand: string
  overall: number
  technicalAverage: number
  mentalAverage: number
  physicalAverage: number
  confidence: number
  fatigue: number
  pressureHandling: number
  composure: number
  breakBuilding: number
  safety: number
  potting: number
  longPotting: number
  tacticalRating: number
  consistency: number
  errorRate: number
  equipmentBonus: number
  startsFrameProbability: number
  initialMomentum: number
  constructedStrength: number
  tacticalPlans: Record<'Attack' | 'Balanced' | 'Safety', number>
  visitProfile: ConstructedLiveVisitProfile['visitProfile']
}

type BiasCaseSummary = {
  config: BiasCaseConfig
  expectedWinRate: number
  actualWinRate: number
  averageVisits: number
  player: AggregatedSideMetrics
  opponent: AggregatedSideMetrics
  constructedProfiles: {
    player: ConstructedProfileAggregate
    opponent: ConstructedProfileAggregate
  }
}

type SwapPairConfig = {
  label: string
  firstCaseId: string
  secondCaseId: string
}

type DeterministicSwapResult = {
  label: string
  firstDirectionLabel: string
  firstDirectionScore: string
  firstDirectionWinner: 'Player' | 'Opponent'
  secondDirectionLabel: string
  secondDirectionScore: string
  secondDirectionWinner: 'Player' | 'Opponent'
}

const RUNS_PER_CASE = 1000
const DETERMINISTIC_SEED = 240514

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')
const reportsDir = path.join(workspaceRoot, 'docs', 'reports')
const markdownPath = path.join(reportsDir, 'live-visit-bias-debug.md')

const CASES: BiasCaseConfig[] = [
  {
    id: 'equal-youth-player-start',
    label: 'Equal Youth mirror | player starts',
    playerTier: 'Youth',
    opponentTier: 'Youth',
    playerStyle: 'Counter',
    opponentStyle: 'Counter',
    bestOf: 19,
    opponentProfileMode: 'attributes',
    startingPlayer: 'player',
  },
  {
    id: 'equal-youth-opponent-start',
    label: 'Equal Youth mirror | opponent starts',
    playerTier: 'Youth',
    opponentTier: 'Youth',
    playerStyle: 'Counter',
    opponentStyle: 'Counter',
    bestOf: 19,
    opponentProfileMode: 'attributes',
    startingPlayer: 'opponent',
  },
  {
    id: 'equal-amateur-player-start',
    label: 'Equal Amateur mirror | player starts',
    playerTier: 'Amateur',
    opponentTier: 'Amateur',
    playerStyle: 'Counter',
    opponentStyle: 'Counter',
    bestOf: 19,
    opponentProfileMode: 'attributes',
    startingPlayer: 'player',
  },
  {
    id: 'equal-amateur-opponent-start',
    label: 'Equal Amateur mirror | opponent starts',
    playerTier: 'Amateur',
    opponentTier: 'Amateur',
    playerStyle: 'Counter',
    opponentStyle: 'Counter',
    bestOf: 19,
    opponentProfileMode: 'attributes',
    startingPlayer: 'opponent',
  },
  {
    id: 'equal-top64-player-start',
    label: 'Equal Top 64 mirror | player starts',
    playerTier: 'Top 64',
    opponentTier: 'Top 64',
    playerStyle: 'Counter',
    opponentStyle: 'Counter',
    bestOf: 19,
    opponentProfileMode: 'attributes',
    startingPlayer: 'player',
  },
  {
    id: 'equal-top64-opponent-start',
    label: 'Equal Top 64 mirror | opponent starts',
    playerTier: 'Top 64',
    opponentTier: 'Top 64',
    playerStyle: 'Counter',
    opponentStyle: 'Counter',
    bestOf: 19,
    opponentProfileMode: 'attributes',
    startingPlayer: 'opponent',
  },
  {
    id: 'equal-world-player-start',
    label: 'Equal World Champion mirror | player starts',
    playerTier: 'World Champion',
    opponentTier: 'World Champion',
    playerStyle: 'Nerve',
    opponentStyle: 'Nerve',
    bestOf: 19,
    opponentProfileMode: 'attributes',
    startingPlayer: 'player',
  },
  {
    id: 'equal-world-opponent-start',
    label: 'Equal World Champion mirror | opponent starts',
    playerTier: 'World Champion',
    opponentTier: 'World Champion',
    playerStyle: 'Nerve',
    opponentStyle: 'Nerve',
    bestOf: 19,
    opponentProfileMode: 'attributes',
    startingPlayer: 'opponent',
  },
  {
    id: 'youth-amateur-rank-based',
    label: 'Youth vs Amateur | current rank-based opponent profile',
    playerTier: 'Youth',
    opponentTier: 'Amateur',
    playerStyle: 'Scorer',
    opponentStyle: 'Break Builder',
    bestOf: 11,
    opponentProfileMode: 'rankBased',
    startingPlayer: 'player',
  },
  {
    id: 'amateur-youth-rank-based',
    label: 'Amateur vs Youth | current rank-based opponent profile',
    playerTier: 'Amateur',
    opponentTier: 'Youth',
    playerStyle: 'Break Builder',
    opponentStyle: 'Scorer',
    bestOf: 11,
    opponentProfileMode: 'rankBased',
    startingPlayer: 'player',
  },
  {
    id: 'youth-amateur-mirror',
    label: 'Youth vs Amateur | mirrored attribute opponent profile',
    playerTier: 'Youth',
    opponentTier: 'Amateur',
    playerStyle: 'Scorer',
    opponentStyle: 'Break Builder',
    bestOf: 11,
    opponentProfileMode: 'attributes',
    startingPlayer: 'player',
  },
  {
    id: 'amateur-youth-mirror',
    label: 'Amateur vs Youth | mirrored attribute opponent profile',
    playerTier: 'Amateur',
    opponentTier: 'Youth',
    playerStyle: 'Break Builder',
    opponentStyle: 'Scorer',
    bestOf: 11,
    opponentProfileMode: 'attributes',
    startingPlayer: 'player',
  },
  {
    id: 'youth-top64-rank-based',
    label: 'Youth vs Top 64 | current rank-based opponent profile',
    playerTier: 'Youth',
    opponentTier: 'Top 64',
    playerStyle: 'Tactical',
    opponentStyle: 'Counter',
    bestOf: 19,
    opponentProfileMode: 'rankBased',
    startingPlayer: 'player',
  },
  {
    id: 'top64-youth-rank-based',
    label: 'Top 64 vs Youth | current rank-based opponent profile',
    playerTier: 'Top 64',
    opponentTier: 'Youth',
    playerStyle: 'Counter',
    opponentStyle: 'Tactical',
    bestOf: 19,
    opponentProfileMode: 'rankBased',
    startingPlayer: 'player',
  },
  {
    id: 'top16-top4-rank-based',
    label: 'Top 16 vs Top 4 | current rank-based opponent profile',
    playerTier: 'Top 16',
    opponentTier: 'Top 4',
    playerStyle: 'Counter',
    opponentStyle: 'Nerve',
    bestOf: 19,
    opponentProfileMode: 'rankBased',
    startingPlayer: 'player',
  },
  {
    id: 'top4-top16-rank-based',
    label: 'Top 4 vs Top 16 | current rank-based opponent profile',
    playerTier: 'Top 4',
    opponentTier: 'Top 16',
    playerStyle: 'Nerve',
    opponentStyle: 'Counter',
    bestOf: 19,
    opponentProfileMode: 'rankBased',
    startingPlayer: 'player',
  },
  {
    id: 'veteran-world-rank-based',
    label: 'Veteran Min Support vs World Champion | current rank-based opponent profile',
    playerTier: 'Veteran Min Support',
    opponentTier: 'World Champion',
    playerStyle: 'Stamina',
    opponentStyle: 'Nerve',
    bestOf: 19,
    opponentProfileMode: 'rankBased',
    startingPlayer: 'player',
  },
  {
    id: 'world-veteran-rank-based',
    label: 'World Champion vs Veteran Min Support | current rank-based opponent profile',
    playerTier: 'World Champion',
    opponentTier: 'Veteran Min Support',
    playerStyle: 'Nerve',
    opponentStyle: 'Stamina',
    bestOf: 19,
    opponentProfileMode: 'rankBased',
    startingPlayer: 'player',
  },
]

const SWAP_PAIRS: SwapPairConfig[] = [
  { label: 'Youth vs Amateur', firstCaseId: 'youth-amateur-rank-based', secondCaseId: 'amateur-youth-rank-based' },
  { label: 'Youth vs Top 64', firstCaseId: 'youth-top64-rank-based', secondCaseId: 'top64-youth-rank-based' },
  { label: 'Veteran Min Support vs World Champion', firstCaseId: 'veteran-world-rank-based', secondCaseId: 'world-veteran-rank-based' },
  { label: 'Top 16 vs Top 4', firstCaseId: 'top16-top4-rank-based', secondCaseId: 'top4-top16-rank-based' },
]

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

function createAggregateSideMetrics(): AggregatedSideMetrics {
  return {
    frameStarts: 0,
    firstScoringChances: 0,
    visits: 0,
    pointsScored: 0,
    frameWins: 0,
    potAttempts: 0,
    potSuccesses: 0,
    breakBuildAttempts: 0,
    breakBuildSuccesses: 0,
    safetyAttempts: 0,
    safetySuccesses: 0,
    snookerHuntAttempts: 0,
    snookerHuntSuccesses: 0,
    respottedBlackAttempts: 0,
    respottedBlackSuccesses: 0,
    foulsCommitted: 0,
    unforcedErrors: 0,
    scoringVisitCount: 0,
    totalScoringBreak: 0,
    totalTacticalEdge: 0,
    totalDecisionBonus: 0,
    totalSuccessChance: 0,
    totalConfidence: 0,
    totalFatigue: 0,
  }
}

function createConstructedProfileAggregate(sourceKind: ConstructedLiveVisitProfile['sourceKind'], sourceRankBand: string): ConstructedProfileAggregate {
  return {
    count: 0,
    sourceKind,
    sourceRankBand,
    overall: 0,
    technicalAverage: 0,
    mentalAverage: 0,
    physicalAverage: 0,
    confidence: 0,
    fatigue: 0,
    pressureHandling: 0,
    composure: 0,
    breakBuilding: 0,
    safety: 0,
    potting: 0,
    longPotting: 0,
    tacticalRating: 0,
    consistency: 0,
    errorRate: 0,
    equipmentBonus: 0,
    startsFrameProbability: 0,
    initialMomentum: 0,
    constructedStrength: 0,
    tacticalPlans: {
      Attack: 0,
      Balanced: 0,
      Safety: 0,
    },
    visitProfile: {
      longPotting: 0,
      breakBuilding: 0,
      cueBallControl: 0,
      safetyPlay: 0,
      consistency: 0,
      composure: 0,
      focus: 0,
      bigMatchNerve: 0,
      handSteadiness: 0,
      stamina: 0,
    },
  }
}

function addSideMetrics(target: AggregatedSideMetrics, source: AggregatedSideMetrics) {
  target.frameStarts += source.frameStarts
  target.firstScoringChances += source.firstScoringChances
  target.visits += source.visits
  target.pointsScored += source.pointsScored
  target.frameWins += source.frameWins
  target.potAttempts += source.potAttempts
  target.potSuccesses += source.potSuccesses
  target.breakBuildAttempts += source.breakBuildAttempts
  target.breakBuildSuccesses += source.breakBuildSuccesses
  target.safetyAttempts += source.safetyAttempts
  target.safetySuccesses += source.safetySuccesses
  target.snookerHuntAttempts += source.snookerHuntAttempts
  target.snookerHuntSuccesses += source.snookerHuntSuccesses
  target.respottedBlackAttempts += source.respottedBlackAttempts
  target.respottedBlackSuccesses += source.respottedBlackSuccesses
  target.foulsCommitted += source.foulsCommitted
  target.unforcedErrors += source.unforcedErrors
  target.scoringVisitCount += source.scoringVisitCount
  target.totalScoringBreak += source.totalScoringBreak
  target.totalTacticalEdge += source.totalTacticalEdge
  target.totalDecisionBonus += source.totalDecisionBonus
  target.totalSuccessChance += source.totalSuccessChance
  target.totalConfidence += source.totalConfidence
  target.totalFatigue += source.totalFatigue
}

function addConstructedProfile(target: ConstructedProfileAggregate, source: ConstructedLiveVisitProfile) {
  target.count += 1
  target.sourceKind = source.sourceKind
  target.sourceRankBand = source.sourceRankBand
  target.overall += source.overall
  target.technicalAverage += source.technicalAverage
  target.mentalAverage += source.mentalAverage
  target.physicalAverage += source.physicalAverage
  target.confidence += source.confidence
  target.fatigue += source.fatigue
  target.pressureHandling += source.pressureHandling
  target.composure += source.composure
  target.breakBuilding += source.breakBuilding
  target.safety += source.safety
  target.potting += source.potting
  target.longPotting += source.longPotting
  target.tacticalRating += source.tacticalRating
  target.consistency += source.consistency
  target.errorRate += source.errorRate
  target.equipmentBonus += source.equipmentBonus
  target.startsFrameProbability += source.startsFrameProbability
  target.initialMomentum += source.initialMomentum
  target.constructedStrength += source.constructedStrength
  target.tacticalPlans[source.tacticalPlan] += 1
  target.visitProfile.longPotting += source.visitProfile.longPotting
  target.visitProfile.breakBuilding += source.visitProfile.breakBuilding
  target.visitProfile.cueBallControl += source.visitProfile.cueBallControl
  target.visitProfile.safetyPlay += source.visitProfile.safetyPlay
  target.visitProfile.consistency += source.visitProfile.consistency
  target.visitProfile.composure += source.visitProfile.composure
  target.visitProfile.focus += source.visitProfile.focus
  target.visitProfile.bigMatchNerve += source.visitProfile.bigMatchNerve
  target.visitProfile.handSteadiness += source.visitProfile.handSteadiness
  target.visitProfile.stamina += source.visitProfile.stamina
}

function percent(numerator: number, denominator: number) {
  if (denominator === 0) return 0
  return numerator / denominator * 100
}

function average(total: number, count: number) {
  if (count === 0) return 0
  return total / count
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatAverage(value: number) {
  return value.toFixed(2)
}

function averageConstructedField(aggregate: ConstructedProfileAggregate, key: Exclude<keyof ConstructedProfileAggregate, 'count' | 'sourceKind' | 'sourceRankBand' | 'tacticalPlans' | 'visitProfile'>) {
  return average(aggregate[key] as number, aggregate.count)
}

function averageVisitField(aggregate: ConstructedProfileAggregate, key: keyof ConstructedProfileAggregate['visitProfile']) {
  return average(aggregate.visitProfile[key], aggregate.count)
}

function getDominantTacticalPlan(aggregate: ConstructedProfileAggregate) {
  return (Object.entries(aggregate.tacticalPlans) as Array<[ConstructedLiveVisitProfile['tacticalPlan'], number]>)
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Balanced'
}

function getExpectedStrongerSide(summary: BiasCaseSummary) {
  if (summary.expectedWinRate >= 52) return 'player'
  if (summary.expectedWinRate <= 48) return 'opponent'
  return 'even'
}

function getActualStrongerSide(summary: BiasCaseSummary) {
  const playerStrength = averageConstructedField(summary.constructedProfiles.player, 'constructedStrength')
  const opponentStrength = averageConstructedField(summary.constructedProfiles.opponent, 'constructedStrength')
  if (Math.abs(playerStrength - opponentStrength) < 1) return 'even'
  return playerStrength > opponentStrength ? 'player' : 'opponent'
}

function getConstructedProfileWarnings(summary: BiasCaseSummary) {
  const warnings: string[] = []
  const expectedStrongerSide = getExpectedStrongerSide(summary)
  const actualStrongerSide = getActualStrongerSide(summary)
  const playerProfile = summary.constructedProfiles.player
  const opponentProfile = summary.constructedProfiles.opponent

  if (expectedStrongerSide !== 'even' && actualStrongerSide !== expectedStrongerSide) {
    warnings.push(`Expected ${expectedStrongerSide} stronger, but constructed ${actualStrongerSide} profile is stronger.`)
  }

  if (
    averageVisitField(opponentProfile, 'longPotting') <= 0
    || averageVisitField(opponentProfile, 'breakBuilding') <= 0
    || averageVisitField(opponentProfile, 'safetyPlay') <= 0
    || averageVisitField(opponentProfile, 'focus') <= 0
  ) {
    warnings.push('Opponent missing key fields.')
  }

  if (
    averageVisitField(opponentProfile, 'longPotting') < 30
    || averageVisitField(opponentProfile, 'breakBuilding') < 30
    || averageVisitField(opponentProfile, 'safetyPlay') < 30
  ) {
    warnings.push('Opponent defaulted to zero/low values.')
  }

  if (
    summary.config.opponentProfileMode === 'rankBased'
    && averageConstructedField(playerProfile, 'equipmentBonus') > averageConstructedField(opponentProfile, 'equipmentBonus') + 1
  ) {
    warnings.push('Player received support/equipment bonus but opponent did not.')
  }

  if (summary.config.playerTier !== summary.config.opponentTier && playerProfile.sourceRankBand === opponentProfile.sourceRankBand) {
    warnings.push('Player and opponent used the same rank band accidentally.')
  }

  return warnings
}

function getPairWarnings(first: BiasCaseSummary, second: BiasCaseSummary) {
  const warnings: string[] = []
  const winRateSum = first.actualWinRate + second.actualWinRate
  if (winRateSum < 85 || winRateSum > 115) {
    warnings.push(`Swapped pair sum ${formatPercent(winRateSum)} is outside the 85%-115% inversion band.`)
  }
  if (first.actualWinRate > 55 && second.actualWinRate > 55) {
    warnings.push('Player side wins both directions.')
  }
  if (first.actualWinRate < 45 && second.actualWinRate < 45) {
    warnings.push('Opponent side wins both directions.')
  }
  return warnings
}

function getInversionValid(first: BiasCaseSummary, second: BiasCaseSummary) {
  const winRateSum = first.actualWinRate + second.actualWinRate
  return winRateSum >= 85 && winRateSum <= 115 && !(first.actualWinRate > 55 && second.actualWinRate > 55) && !(first.actualWinRate < 45 && second.actualWinRate < 45)
}

function buildProfilesForRun(config: BiasCaseConfig, caseIndex: number, runIndex: number) {
  const player = buildSyntheticProfile(config.playerTier, config.playerStyle, caseIndex * 10000 + runIndex * 2 + 1)
  const opponent = buildSyntheticProfile(config.opponentTier, config.opponentStyle, caseIndex * 10000 + runIndex * 2 + 2)
  const expectedWinRate = getBaselineMatchWinChance(player.strength, opponent.strength)
  return { player, opponent, expectedWinRate }
}

function simulateCaseRun(config: BiasCaseConfig, caseIndex: number, runIndex: number, seed: number) {
  const { player, opponent, expectedWinRate } = buildProfilesForRun(config, caseIndex, runIndex)
  return {
    expectedWinRate,
    result: simulateSyntheticLiveVisitMatch({
      simulationMode: SIMULATION_MODE.liveVisitCalibration,
      playerName: `Player ${player.tier} ${player.style}`,
      opponentName: `Opponent ${opponent.tier} ${opponent.style}`,
      playerRankBand: player.tier,
      opponentRankBand: opponent.tier,
      playerTacticalPlan: getTacticalPlanFromStyle(config.playerStyle),
      opponentTacticalPlan: getTacticalPlanFromStyle(config.opponentStyle),
      bestOf: config.bestOf,
      seed,
      playerAttributes: player.attributes,
      playerEquipmentBonus: player.equipmentBonus,
      opponentAttributes: opponent.attributes,
      opponentEquipmentBonus: opponent.equipmentBonus,
      opponentProfileMode: config.opponentProfileMode,
      startingPlayer: config.startingPlayer,
      playerConfidence: player.confidence,
      playerFatigue: player.fatigue,
      playerClutch: getClutch(player.attributes),
      playerStrength: player.strength,
      opponentRanking: getSyntheticRanking(opponent.tier),
      opponentConfidence: opponent.confidence,
      opponentFatigue: opponent.fatigue,
      opponentClutch: getClutch(opponent.attributes),
      opponentStrength: opponent.strength,
      plannedMatchWinChance: expectedWinRate,
    }),
  }
}

function runCase(config: BiasCaseConfig, caseIndex: number): BiasCaseSummary {
  let expectedWinRateTotal = 0
  let playerWins = 0
  let totalVisits = 0
  const playerMetrics = createAggregateSideMetrics()
  const opponentMetrics = createAggregateSideMetrics()
  const constructedProfiles = {
    player: createConstructedProfileAggregate('attributes', config.playerTier),
    opponent: createConstructedProfileAggregate(config.opponentProfileMode === 'attributes' ? 'attributes' : 'rankBased', config.opponentTier),
  }

  for (let run = 0; run < RUNS_PER_CASE; run += 1) {
    const { expectedWinRate, result } = simulateCaseRun(config, caseIndex, run, caseIndex * 500000 + run)
    expectedWinRateTotal += expectedWinRate
    totalVisits += result.totalVisits
    if (result.playerWon) {
      playerWins += 1
    }
    addSideMetrics(playerMetrics, result.debugMetrics.player)
    addSideMetrics(opponentMetrics, result.debugMetrics.opponent)
    addConstructedProfile(constructedProfiles.player, result.constructedProfiles.player)
    addConstructedProfile(constructedProfiles.opponent, result.constructedProfiles.opponent)
  }

  return {
    config,
    expectedWinRate: expectedWinRateTotal / RUNS_PER_CASE,
    actualWinRate: percent(playerWins, RUNS_PER_CASE),
    averageVisits: totalVisits / RUNS_PER_CASE,
    player: playerMetrics,
    opponent: opponentMetrics,
    constructedProfiles,
  }
}

function runDeterministicSwap(config: BiasCaseConfig, caseIndex: number) {
  const { result } = simulateCaseRun(config, caseIndex, DETERMINISTIC_SEED, DETERMINISTIC_SEED + caseIndex)
  return {
    label: config.label,
    score: result.score,
    winner: result.playerWon ? 'Player' as const : 'Opponent' as const,
  }
}

function formatSideSummary(label: string, metrics: AggregatedSideMetrics, totalFrames: number) {
  return [
    `- ${label} frame starts: ${metrics.frameStarts}`,
    `- ${label} first scoring chances: ${metrics.firstScoringChances}`,
    `- ${label} frame win %: ${formatPercent(percent(metrics.frameWins, totalFrames))}`,
    `- ${label} pot success: ${formatPercent(percent(metrics.potSuccesses, metrics.potAttempts))} (${metrics.potSuccesses}/${metrics.potAttempts})`,
    `- ${label} safety success: ${formatPercent(percent(metrics.safetySuccesses, metrics.safetyAttempts))} (${metrics.safetySuccesses}/${metrics.safetyAttempts})`,
    `- ${label} break-build success: ${formatPercent(percent(metrics.breakBuildSuccesses, metrics.breakBuildAttempts))} (${metrics.breakBuildSuccesses}/${metrics.breakBuildAttempts})`,
    `- ${label} snooker-hunt success: ${formatPercent(percent(metrics.snookerHuntSuccesses, metrics.snookerHuntAttempts))} (${metrics.snookerHuntSuccesses}/${metrics.snookerHuntAttempts})`,
    `- ${label} unforced errors: ${metrics.unforcedErrors}`,
    `- ${label} fouls: ${metrics.foulsCommitted}`,
    `- ${label} average scoring break: ${formatAverage(average(metrics.totalScoringBreak, metrics.scoringVisitCount))}`,
    `- ${label} average tactical edge: ${formatAverage(average(metrics.totalTacticalEdge, metrics.visits))}`,
    `- ${label} average decision bonus: ${formatAverage(average(metrics.totalDecisionBonus, metrics.visits))}`,
    `- ${label} average success chance: ${formatAverage(average(metrics.totalSuccessChance, metrics.visits))}`,
    `- ${label} average confidence: ${formatAverage(average(metrics.totalConfidence, metrics.visits))}`,
    `- ${label} average fatigue: ${formatAverage(average(metrics.totalFatigue, metrics.visits))}`,
  ]
}

function formatConstructedProfile(label: string, aggregate: ConstructedProfileAggregate) {
  return [
    `- ${label} source kind: ${aggregate.sourceKind}`,
    `- ${label} source rank band: ${aggregate.sourceRankBand}`,
    `- ${label} overall: ${formatAverage(averageConstructedField(aggregate, 'overall'))}`,
    `- ${label} technical average: ${formatAverage(averageConstructedField(aggregate, 'technicalAverage'))}`,
    `- ${label} mental average: ${formatAverage(averageConstructedField(aggregate, 'mentalAverage'))}`,
    `- ${label} physical average: ${formatAverage(averageConstructedField(aggregate, 'physicalAverage'))}`,
    `- ${label} confidence: ${formatAverage(averageConstructedField(aggregate, 'confidence'))}`,
    `- ${label} fatigue: ${formatAverage(averageConstructedField(aggregate, 'fatigue'))}`,
    `- ${label} pressure handling: ${formatAverage(averageConstructedField(aggregate, 'pressureHandling'))}`,
    `- ${label} composure: ${formatAverage(averageConstructedField(aggregate, 'composure'))}`,
    `- ${label} break building: ${formatAverage(averageConstructedField(aggregate, 'breakBuilding'))}`,
    `- ${label} safety: ${formatAverage(averageConstructedField(aggregate, 'safety'))}`,
    `- ${label} potting: ${formatAverage(averageConstructedField(aggregate, 'potting'))}`,
    `- ${label} long potting: ${formatAverage(averageConstructedField(aggregate, 'longPotting'))}`,
    `- ${label} tactical rating: ${formatAverage(averageConstructedField(aggregate, 'tacticalRating'))}`,
    `- ${label} consistency: ${formatAverage(averageConstructedField(aggregate, 'consistency'))}`,
    `- ${label} error rate: ${formatAverage(averageConstructedField(aggregate, 'errorRate'))}`,
    `- ${label} equipment bonus: ${formatAverage(averageConstructedField(aggregate, 'equipmentBonus'))}`,
    `- ${label} tactical plan: ${getDominantTacticalPlan(aggregate)}`,
    `- ${label} starts frame probability: ${formatAverage(averageConstructedField(aggregate, 'startsFrameProbability'))}`,
    `- ${label} initial momentum: ${formatAverage(averageConstructedField(aggregate, 'initialMomentum'))}`,
    `- ${label} constructed strength: ${formatAverage(averageConstructedField(aggregate, 'constructedStrength'))}`,
    `- ${label} visit profile values: LP ${formatAverage(averageVisitField(aggregate, 'longPotting'))}, BB ${formatAverage(averageVisitField(aggregate, 'breakBuilding'))}, CBC ${formatAverage(averageVisitField(aggregate, 'cueBallControl'))}, SAF ${formatAverage(averageVisitField(aggregate, 'safetyPlay'))}, CONS ${formatAverage(averageVisitField(aggregate, 'consistency'))}, FOC ${formatAverage(averageVisitField(aggregate, 'focus'))}, COMP ${formatAverage(averageVisitField(aggregate, 'composure'))}, BMN ${formatAverage(averageVisitField(aggregate, 'bigMatchNerve'))}, HAND ${formatAverage(averageVisitField(aggregate, 'handSteadiness'))}, STM ${formatAverage(averageVisitField(aggregate, 'stamina'))}`,
  ]
}

function findCase(summaries: BiasCaseSummary[], id: string) {
  const summary = summaries.find((entry) => entry.config.id === id)
  if (!summary) {
    throw new Error(`Missing summary for case ${id}`)
  }
  return summary
}

function buildMarkdown(summaries: BiasCaseSummary[]) {
  const equalYouthPlayer = findCase(summaries, 'equal-youth-player-start')
  const equalYouthOpponent = findCase(summaries, 'equal-youth-opponent-start')
  const equalAmateurPlayer = findCase(summaries, 'equal-amateur-player-start')
  const equalAmateurOpponent = findCase(summaries, 'equal-amateur-opponent-start')
  const equalTop64Player = findCase(summaries, 'equal-top64-player-start')
  const equalTop64Opponent = findCase(summaries, 'equal-top64-opponent-start')
  const equalWorldPlayer = findCase(summaries, 'equal-world-player-start')
  const equalWorldOpponent = findCase(summaries, 'equal-world-opponent-start')
  const youthAmateurRank = findCase(summaries, 'youth-amateur-rank-based')
  const amateurYouthRank = findCase(summaries, 'amateur-youth-rank-based')
  const youthAmateurMirror = findCase(summaries, 'youth-amateur-mirror')
  const amateurYouthMirror = findCase(summaries, 'amateur-youth-mirror')

  const equalYouthStartSwing = equalYouthPlayer.actualWinRate - (100 - equalYouthOpponent.actualWinRate)
  const equalWorldStartSwing = equalWorldPlayer.actualWinRate - (100 - equalWorldOpponent.actualWinRate)
  const rankBasedPerspectiveGap = youthAmateurRank.actualWinRate + amateurYouthRank.actualWinRate - 100
  const mirroredPerspectiveGap = youthAmateurMirror.actualWinRate + amateurYouthMirror.actualWinRate - 100

  const deterministicResults: DeterministicSwapResult[] = SWAP_PAIRS.map((pair, pairIndex) => {
    const firstConfig = CASES.find((entry) => entry.id === pair.firstCaseId)
    const secondConfig = CASES.find((entry) => entry.id === pair.secondCaseId)
    if (!firstConfig || !secondConfig) {
      throw new Error(`Missing deterministic swap config for ${pair.label}`)
    }
    const firstDirection = runDeterministicSwap(firstConfig, pairIndex * 2 + 1)
    const secondDirection = runDeterministicSwap(secondConfig, pairIndex * 2 + 2)
    return {
      label: pair.label,
      firstDirectionLabel: firstDirection.label,
      firstDirectionScore: firstDirection.score,
      firstDirectionWinner: firstDirection.winner,
      secondDirectionLabel: secondDirection.label,
      secondDirectionScore: secondDirection.score,
      secondDirectionWinner: secondDirection.winner,
    }
  })

  const lines: string[] = [
    '# Live Visit Bias Debug',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- ${RUNS_PER_CASE} synthetic matches were run per bias case.`,
    '- Career mode remains isolated from these tests; this report uses only `liveVisitCalibration`.',
    '- `Snooker escapes` are not modelled as a separate event in the engine. The nearest explicit signal available here is `Snooker Hunt` success rate.',
    '',
    '## Headline Findings',
    '',
    `- Equal Youth mirror: player-start ${formatPercent(equalYouthPlayer.actualWinRate)}, opponent-start ${formatPercent(equalYouthOpponent.actualWinRate)}.`,
    `- Equal Amateur mirror: player-start ${formatPercent(equalAmateurPlayer.actualWinRate)}, opponent-start ${formatPercent(equalAmateurOpponent.actualWinRate)}.`,
    `- Equal Top 64 mirror: player-start ${formatPercent(equalTop64Player.actualWinRate)}, opponent-start ${formatPercent(equalTop64Opponent.actualWinRate)}.`,
    `- Equal World Champion mirror: player-start ${formatPercent(equalWorldPlayer.actualWinRate)}, opponent-start ${formatPercent(equalWorldOpponent.actualWinRate)}.`,
    `- Youth vs Amateur rank-based swap gap: original ${formatPercent(youthAmateurRank.actualWinRate)}, swapped ${formatPercent(amateurYouthRank.actualWinRate)}, perspective gap ${formatPercent(rankBasedPerspectiveGap)}.`,
    `- Youth vs Amateur mirrored-attributes swap gap: original ${formatPercent(youthAmateurMirror.actualWinRate)}, swapped ${formatPercent(amateurYouthMirror.actualWinRate)}, perspective gap ${formatPercent(mirroredPerspectiveGap)}.`,
    '',
    '## Source Checks',
    '',
    `- A. Player-first possession: Equal Youth start swing is ${formatPercent(equalYouthStartSwing)} and Equal World Champion start swing is ${formatPercent(equalWorldStartSwing)} when only the opening break is flipped.`,
    `- B. Profile asymmetry: Youth vs Amateur actual win rate is ${formatPercent(youthAmateurRank.actualWinRate)} with the current rank-based opponent model, versus ${formatPercent(youthAmateurMirror.actualWinRate)} when both sides use mirrored attribute profiles.`,
    '- C. Tactical asymmetry: compare the constructed tactical plans and the average decision bonus lines below. Simulated mode is side-neutral; any persistent gap is coming from constructed profile or frame-state flow.',
    '- D. Momentum asymmetry: frame-start and first-scoring-chance gaps show whether winner-keeps-table and frame-start sequencing are still compounding a side advantage.',
    '- E. Error-rate asymmetry: compare pot/safety/break-build success plus unforced errors and fouls by side in the equal-profile mirror cases.',
    `- F. Probability perspective bug: a healthy swap pair should sum close to 100%. The rank-based Youth/Amateur pair sums to ${formatPercent(youthAmateurRank.actualWinRate + amateurYouthRank.actualWinRate)}; the mirrored pair sums to ${formatPercent(youthAmateurMirror.actualWinRate + amateurYouthMirror.actualWinRate)}.`,
    '',
    '## Swap Test Matrix',
    '',
    '| Pair | A as Player Win % | B as Player Win % | Sum | Inversion Valid | Warnings |',
    '| --- | ---: | ---: | ---: | --- | --- |',
  ]

  SWAP_PAIRS.forEach((pair) => {
    const first = findCase(summaries, pair.firstCaseId)
    const second = findCase(summaries, pair.secondCaseId)
    const warnings = getPairWarnings(first, second)
    lines.push(`| ${pair.label} | ${formatPercent(first.actualWinRate)} | ${formatPercent(second.actualWinRate)} | ${formatPercent(first.actualWinRate + second.actualWinRate)} | ${getInversionValid(first, second) ? 'yes' : 'no'} | ${warnings.length > 0 ? warnings.join(' / ') : 'none'} |`)
  })

  lines.push('')
  lines.push('## Constructed Profile Audit')
  lines.push('')

  SWAP_PAIRS.forEach((pair) => {
    const first = findCase(summaries, pair.firstCaseId)
    const second = findCase(summaries, pair.secondCaseId)
    ;[first, second].forEach((summary) => {
      const warnings = getConstructedProfileWarnings(summary)
      lines.push(`### ${summary.config.label}`)
      lines.push('')
      lines.push(`- Expected stronger side: ${getExpectedStrongerSide(summary)}`)
      lines.push(`- Actual stronger side after construction: ${getActualStrongerSide(summary)}`)
      lines.push(`- Warnings: ${warnings.length > 0 ? warnings.join(' | ') : 'none'}`)
      lines.push(...formatConstructedProfile('Player', summary.constructedProfiles.player))
      lines.push(...formatConstructedProfile('Opponent', summary.constructedProfiles.opponent))
      lines.push('')
    })
  })

  lines.push('## Equal Profile Matrix')
  lines.push('')
  lines.push('| Mirror | Player Starts | Opponent Starts | Combined Average | Target 45-55 |')
  lines.push('| --- | ---: | ---: | ---: | --- |')
  lines.push(`| Youth | ${formatPercent(equalYouthPlayer.actualWinRate)} | ${formatPercent(equalYouthOpponent.actualWinRate)} | ${formatPercent((equalYouthPlayer.actualWinRate + equalYouthOpponent.actualWinRate) / 2)} | ${((equalYouthPlayer.actualWinRate + equalYouthOpponent.actualWinRate) / 2) >= 45 && ((equalYouthPlayer.actualWinRate + equalYouthOpponent.actualWinRate) / 2) <= 55 ? 'yes' : 'no'} |`)
  lines.push(`| Amateur | ${formatPercent(equalAmateurPlayer.actualWinRate)} | ${formatPercent(equalAmateurOpponent.actualWinRate)} | ${formatPercent((equalAmateurPlayer.actualWinRate + equalAmateurOpponent.actualWinRate) / 2)} | ${((equalAmateurPlayer.actualWinRate + equalAmateurOpponent.actualWinRate) / 2) >= 45 && ((equalAmateurPlayer.actualWinRate + equalAmateurOpponent.actualWinRate) / 2) <= 55 ? 'yes' : 'no'} |`)
  lines.push(`| Top 64 | ${formatPercent(equalTop64Player.actualWinRate)} | ${formatPercent(equalTop64Opponent.actualWinRate)} | ${formatPercent((equalTop64Player.actualWinRate + equalTop64Opponent.actualWinRate) / 2)} | ${((equalTop64Player.actualWinRate + equalTop64Opponent.actualWinRate) / 2) >= 45 && ((equalTop64Player.actualWinRate + equalTop64Opponent.actualWinRate) / 2) <= 55 ? 'yes' : 'no'} |`)
  lines.push(`| World Champion | ${formatPercent(equalWorldPlayer.actualWinRate)} | ${formatPercent(equalWorldOpponent.actualWinRate)} | ${formatPercent((equalWorldPlayer.actualWinRate + equalWorldOpponent.actualWinRate) / 2)} | ${((equalWorldPlayer.actualWinRate + equalWorldOpponent.actualWinRate) / 2) >= 45 && ((equalWorldPlayer.actualWinRate + equalWorldOpponent.actualWinRate) / 2) <= 55 ? 'yes' : 'no'} |`)
  lines.push('')

  lines.push('## Deterministic Seed Spot Checks')
  lines.push('')
  lines.push(`- Fixed seed used: ${DETERMINISTIC_SEED}`)
  lines.push('')
  lines.push('| Pair | First Direction | Score | Winner | Second Direction | Score | Winner |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- |')
  deterministicResults.forEach((result) => {
    lines.push(`| ${result.label} | ${result.firstDirectionLabel} | ${result.firstDirectionScore} | ${result.firstDirectionWinner} | ${result.secondDirectionLabel} | ${result.secondDirectionScore} | ${result.secondDirectionWinner} |`)
  })
  lines.push('')

  lines.push('## Detailed Cases')
  lines.push('')
  summaries.forEach((summary) => {
    const totalFrames = summary.player.frameWins + summary.opponent.frameWins
    lines.push(`### ${summary.config.label}`)
    lines.push('')
    lines.push(`- Expected win rate: ${formatPercent(summary.expectedWinRate)}`)
    lines.push(`- Actual player-side win rate: ${formatPercent(summary.actualWinRate)}`)
    lines.push(`- Drift: ${formatPercent(summary.actualWinRate - summary.expectedWinRate)}`)
    lines.push(`- Average visits per match: ${summary.averageVisits.toFixed(1)}`)
    lines.push(`- Opponent profile mode: ${summary.config.opponentProfileMode}`)
    lines.push(`- Opening break: ${summary.config.startingPlayer}`)
    lines.push(...formatSideSummary('Player', summary.player, totalFrames))
    lines.push(...formatSideSummary('Opponent', summary.opponent, totalFrames))
    lines.push('')
  })

  lines.push('## Symmetry Notes')
  lines.push('')
  lines.push(`- Equal Youth mirror stays near 50/50 only if the start-side swing is negligible. The measured swing here is ${formatPercent(equalYouthStartSwing)}.`)
  lines.push(`- Equal World Champion mirror checks whether the side effect persists even at elite profiles. The measured swing here is ${formatPercent(equalWorldStartSwing)}.`)
  lines.push(`- Youth/Amateur mirrored swap should invert cleanly if the probability perspective is correct. The current mirrored swap gap is ${formatPercent(mirroredPerspectiveGap)} from perfect inversion.`)

  return `${lines.join('\n')}\n`
}

function main() {
  const summaries = CASES.map((config, index) => runCase(config, index + 1))
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(markdownPath, buildMarkdown(summaries))
  console.log(`Wrote live visit bias debug report to ${markdownPath}`)
}

main()
